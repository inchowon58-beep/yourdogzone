"""PC 로컬에서 Gemini API로 업체 소개글 재작성 (gemini-2.5-flash)"""

from __future__ import annotations

import json
import os
import re
import time
from dataclasses import dataclass
from typing import Any, Callable

import requests

LogFn = Callable[[str], None]

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_MAX_RETRIES = int(os.getenv("GEMINI_MAX_RETRIES", "3"))
GEMINI_RETRY_DELAY_SEC = float(os.getenv("GEMINI_RETRY_DELAY_SEC", "5"))
API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)

CATEGORY_CONFIG: dict[str, dict[str, Any]] = {
    "academy": {
        "label": "애견미용학원",
        "singular": "학원",
        "fields": [
            ("title_copy", "한 줄 카피 (40자 내외)"),
            ("curriculum", "교육 과정·특징 소개 (3~5문장)"),
            ("tuition_info", "수강료·혜택 안내 (없으면 null)"),
        ],
        "required": ("title_copy", "curriculum"),
    },
    "adoption": {
        "label": "강아지분양",
        "singular": "분양 업체",
        "fields": [
            ("title_copy", "한 줄 카피 (40자 내외)"),
            ("service_info", "분양 안내·견종 정보 (3~5문장)"),
            ("extra_info", "분양 가격대 (없으면 null)"),
            ("extra_info_2", "입양·분양 절차 (없으면 null)"),
        ],
        "required": ("title_copy", "service_info"),
    },
    "shelter": {
        "label": "강아지보호소",
        "singular": "보호소",
        "fields": [
            ("title_copy", "한 줄 카피 (40자 내외)"),
            ("service_info", "보호소 소개 (3~5문장)"),
            ("extra_info", "운영 시간·입양 가능 안내 (없으면 null)"),
            ("extra_info_2", "입양 절차 (없으면 null)"),
        ],
        "required": ("title_copy", "service_info"),
    },
    "funeral": {
        "label": "강아지장례식장",
        "singular": "장례식장",
        "fields": [
            ("title_copy", "한 줄 카피 (40자 내외)"),
            ("service_info", "장례 서비스 안내 (3~5문장)"),
            ("extra_info", "패키지·요금 안내 (없으면 null)"),
            ("extra_info_2", "운영 시간·예약 방법 (없으면 null)"),
        ],
        "required": ("title_copy", "service_info"),
    },
    "breeder": {
        "label": "브리더정보",
        "singular": "브리더",
        "fields": [
            ("title_copy", "한 줄 카피 (40자 내외)"),
            ("service_info", "브리더 소개·전문 견종 (3~5문장)"),
            ("extra_info", "인증·등록 정보 (없으면 null)"),
            ("extra_info_2", "분양 조건 (없으면 null)"),
        ],
        "required": ("title_copy", "service_info"),
    },
    "hospital": {
        "label": "동물병원",
        "singular": "동물병원",
        "fields": [
            ("title_copy", "한 줄 카피 (40자 내외)"),
            ("service_info", "진료 과목·특징 (3~5문장)"),
            ("extra_info", "운영 시간 (없으면 null)"),
            ("extra_info_2", "응급·특이사항 (없으면 null)"),
        ],
        "required": ("title_copy", "service_info"),
    },
}


@dataclass
class RefineResult:
    ok: bool
    fields: dict[str, str | None] | None = None
    error: str | None = None


def _api_key() -> str:
    return os.getenv("GEMINI_API_KEY", "").strip()


def _category_cfg(category: str) -> dict[str, Any]:
    return CATEGORY_CONFIG.get(category, CATEGORY_CONFIG["academy"])


def _build_prompt(name: str, description: str, address: str, category: str) -> str:
    cfg = _category_cfg(category)
    label = cfg["label"]
    singular = cfg["singular"]
    lines = [f'  "{key}": "{hint}"' for key, hint in cfg["fields"]]
    json_example = "{\n" + ",\n".join(lines) + "\n}"

    return f"""당신은 반려견 포털 사이트의 에디터입니다.
아래 네이버 플레이스에서 수집한 {label} 정보를 사이트 등록용으로 재작성하세요.
원문을 그대로 복사하지 말고, 사실만 유지하며 새 문장으로 작성하세요.
문장 안에 큰따옴표(")나 줄바꿈이 있으면 JSON 이스케이프 규칙을 따르세요.

{singular}명: {name}
주소: {address}
원본 소개:
{description[:3500]}

반드시 아래 JSON 객체만 출력하세요. 설명·마크다운·코드블록 없이 JSON만.
{json_example}"""


def _response_schema(category: str) -> dict[str, Any]:
    cfg = _category_cfg(category)
    properties: dict[str, Any] = {}
    for key, _ in cfg["fields"]:
        if key == "title_copy":
            properties[key] = {"type": "string"}
        else:
            properties[key] = {"type": "string", "nullable": True}
    return {
        "type": "object",
        "properties": properties,
        "required": list(cfg["required"]),
    }


def _strip_markdown_fence(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```\s*$", "", text)
    return text.strip()


def _find_balanced_json_object(text: str) -> str | None:
    start = text.find("{")
    if start < 0:
        return None
    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(text)):
        ch = text[i]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
    return None


def _repair_json(candidate: str) -> str:
    fixed = candidate
    fixed = re.sub(r",\s*}", "}", fixed)
    fixed = re.sub(r",\s*]", "]", fixed)
    return fixed


def _extract_fields_regex(text: str, field_names: tuple[str, ...]) -> dict[str, str]:
    out: dict[str, str] = {}
    for field in field_names:
        m = re.search(
            rf'"{re.escape(field)}"\s*:\s*(?:"((?:[^"\\]|\\.)*)"|null)',
            text,
            flags=re.DOTALL,
        )
        if not m:
            continue
        raw = m.group(1)
        if raw is None:
            continue
        try:
            out[field] = json.loads(f'"{raw}"')
        except json.JSONDecodeError:
            out[field] = raw.replace("\\n", "\n").replace('\\"', '"')
    return out


def _normalize_parsed(
    parsed: dict[str, Any],
    category: str,
) -> RefineResult:
    cfg = _category_cfg(category)
    fields: dict[str, str | None] = {}
    for key, _ in cfg["fields"]:
        raw = parsed.get(key)
        if raw is None or str(raw).lower() == "null":
            fields[key] = None
            continue
        value = str(raw).strip()
        if not value:
            fields[key] = None
            continue
        limit = 200 if key == "title_copy" else 2000
        fields[key] = value[:limit]

    for required in cfg["required"]:
        if not fields.get(required):
            return RefineResult(ok=False, error=f"JSON 필드 누락 ({required})")

    return RefineResult(ok=True, fields=fields)


def _parse_response(text: str, category: str) -> RefineResult:
    cfg = _category_cfg(category)
    field_names = tuple(key for key, _ in cfg["fields"])
    cleaned = _strip_markdown_fence(text)
    candidates: list[str] = []
    if cleaned:
        candidates.append(cleaned)
    balanced = _find_balanced_json_object(cleaned)
    if balanced and balanced not in candidates:
        candidates.insert(0, balanced)

    last_error = "JSON 파싱 실패"
    for candidate in candidates:
        for attempt in (candidate, _repair_json(candidate)):
            try:
                parsed = json.loads(attempt)
                if isinstance(parsed, dict):
                    return _normalize_parsed(parsed, category)
            except json.JSONDecodeError as e:
                last_error = f"JSON 파싱 실패: {e}"

    fallback = _extract_fields_regex(cleaned, field_names)
    if fallback:
        try:
            return _normalize_parsed(fallback, category)
        except Exception:
            pass

    preview = cleaned[:120].replace("\n", " ")
    return RefineResult(ok=False, error=f"{last_error} (응답: {preview}…)")


def _extract_response_text(data: dict[str, Any]) -> tuple[str, str | None]:
    candidates = data.get("candidates") or []
    if not candidates:
        block = data.get("promptFeedback", {}).get("blockReason")
        if block:
            return "", f"콘텐츠 차단: {block}"
        return "", "응답 candidates 없음"

    candidate = candidates[0]
    finish = candidate.get("finishReason")
    if finish and finish not in ("STOP", "MAX_TOKENS"):
        return "", f"생성 중단: {finish}"

    text = (
        candidate.get("content", {}).get("parts", [{}])[0].get("text", "") or ""
    ).strip()

    if not text and finish == "MAX_TOKENS":
        return "", "응답이 토큰 한도로 잘림 (MAX_TOKENS)"

    return text, None


def _is_retryable_error(error: str | None) -> bool:
    if not error:
        return False
    lowered = error.lower()
    return (
        "http 503" in lowered
        or "http 429" in lowered
        or "http 500" in lowered
        or "http 502" in lowered
        or "unavailable" in lowered
        or "json 파싱 실패" in lowered
        or "응답 텍스트 없음" in lowered
        or "네트워크 오류" in lowered
    )


def _call_gemini(
    api_key: str,
    prompt: str,
    *,
    json_mode: bool,
    category: str,
    max_output_tokens: int,
) -> RefineResult:
    generation_config: dict[str, Any] = {
        "temperature": 0.5,
        "maxOutputTokens": max_output_tokens,
    }
    if json_mode:
        generation_config["responseMimeType"] = "application/json"
        generation_config["responseSchema"] = _response_schema(category)

    try:
        res = requests.post(
            API_URL,
            params={"key": api_key},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": generation_config,
            },
            timeout=90,
        )
    except requests.RequestException as e:
        return RefineResult(ok=False, error=f"네트워크 오류: {e}")

    if not res.ok:
        detail = res.text[:240]
        return RefineResult(ok=False, error=f"HTTP {res.status_code}: {detail}")

    data = res.json()
    text, extract_error = _extract_response_text(data)
    if extract_error:
        return RefineResult(ok=False, error=extract_error)
    if not text:
        return RefineResult(ok=False, error="응답 텍스트 없음")

    return _parse_response(text, category)


def refine_place_copy(
    name: str,
    description: str,
    address: str,
    *,
    category: str = "academy",
    log: LogFn = print,
) -> RefineResult:
    """로컬 GEMINI_API_KEY로 소개글 재작성."""
    api_key = _api_key()
    if not api_key:
        return RefineResult(ok=False, error="GEMINI_API_KEY가 .env에 없습니다")
    if not description.strip():
        return RefineResult(ok=False, error="소개글(description) 없음")

    category = category if category in CATEGORY_CONFIG else "academy"
    cfg = _category_cfg(category)
    prompt = _build_prompt(name, description, address, category)
    log(f"    Gemini 로컬 변환 ({GEMINI_MODEL}, {cfg['label']})…")

    attempts: list[tuple[bool, int]] = [
        (True, 2048),
        (True, 4096),
        (False, 2048),
    ]
    last_error = "Gemini 호출 실패"

    for json_mode, max_tokens in attempts:
        last_error = "Gemini 호출 실패"
        for attempt in range(1, GEMINI_MAX_RETRIES + 1):
            result = _call_gemini(
                api_key,
                prompt,
                json_mode=json_mode,
                category=category,
                max_output_tokens=max_tokens,
            )
            if result.ok:
                log("    ✓ Gemini 변환 완료")
                return result

            last_error = result.error or last_error
            retryable = _is_retryable_error(last_error)
            if retryable and attempt < GEMINI_MAX_RETRIES:
                log(
                    f"    ⚠ Gemini ({attempt}/{GEMINI_MAX_RETRIES}): {last_error} "
                    f"→ {GEMINI_RETRY_DELAY_SEC:.0f}초 후 재시도"
                )
                time.sleep(GEMINI_RETRY_DELAY_SEC)
                continue

            log(f"    ⚠ Gemini: {last_error}")
            break

    return RefineResult(ok=False, error=last_error)


def refine_academy_copy(
    name: str,
    description: str,
    address: str,
    log: LogFn = print,
) -> RefineResult:
    """하위 호환 — academy 전용."""
    return refine_place_copy(name, description, address, category="academy", log=log)


def apply_refine_to_item(
    item: dict,
    log: LogFn = print,
    *,
    category: str = "academy",
) -> tuple[dict, bool]:
    """item에 Gemini 필드 반영. 성공 여부 반환."""
    name = item.get("name", "")
    address = item.get("address", "")
    description = item.get("description") or ""

    result = refine_place_copy(
        name,
        description,
        address,
        category=category,
        log=log,
    )
    if not result.ok or not result.fields:
        return item, False

    updated = dict(item)
    for key, value in result.fields.items():
        if value is not None:
            updated[key] = value
    return updated, True
