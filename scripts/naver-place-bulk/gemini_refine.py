"""PC 로컬에서 Gemini API로 학원 소개글 재작성 (gemini-2.5-flash)"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from typing import Callable

import requests

LogFn = Callable[[str], None]

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)


@dataclass
class RefineResult:
    ok: bool
    title_copy: str | None = None
    curriculum: str | None = None
    tuition_info: str | None = None
    error: str | None = None


def _api_key() -> str:
    return os.getenv("GEMINI_API_KEY", "").strip()


def _build_prompt(name: str, description: str, address: str) -> str:
    return f"""당신은 반려견 포털 사이트의 에디터입니다.
아래 네이버 플레이스에서 수집한 애견미용학원 정보를 사이트 등록용으로 재작성하세요.
원문을 그대로 복사하지 말고, 사실만 유지하며 새 문장으로 작성하세요.

학원명: {name}
주소: {address}
원본 소개:
{description[:4000]}

반드시 아래 JSON 형식만 출력하세요. 다른 텍스트는 넣지 마세요.
{{
  "title_copy": "한 줄 카피 (40자 내외)",
  "curriculum": "교육 과정·특징 소개 (3~5문장)",
  "tuition_info": "수강료·혜택 안내 (없으면 null)"
}}"""


def _parse_response(text: str) -> RefineResult:
    try:
        match = re.search(r"\{[\s\S]*\}", text)
        parsed = json.loads(match.group(0) if match else text)
        title_copy = str(parsed.get("title_copy", "")).strip()
        curriculum = str(parsed.get("curriculum", "")).strip()
        tuition_raw = parsed.get("tuition_info")
        tuition_info = (
            None
            if tuition_raw is None or str(tuition_raw).lower() == "null"
            else str(tuition_raw).strip()[:1000]
        )
        if not title_copy or not curriculum:
            return RefineResult(ok=False, error="JSON 필드 누락 (title_copy, curriculum)")
        return RefineResult(
            ok=True,
            title_copy=title_copy[:200],
            curriculum=curriculum[:2000],
            tuition_info=tuition_info,
        )
    except (json.JSONDecodeError, AttributeError) as e:
        return RefineResult(ok=False, error=f"JSON 파싱 실패: {e}")


def _call_gemini(api_key: str, prompt: str, json_mode: bool) -> RefineResult:
    generation_config: dict = {
        "temperature": 0.7,
        "maxOutputTokens": 1024,
    }
    if json_mode:
        generation_config["responseMimeType"] = "application/json"

    try:
        res = requests.post(
            API_URL,
            params={"key": api_key},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": generation_config,
            },
            timeout=60,
        )
    except requests.RequestException as e:
        return RefineResult(ok=False, error=f"네트워크 오류: {e}")

    if not res.ok:
        detail = res.text[:200]
        return RefineResult(
            ok=False,
            error=f"HTTP {res.status_code}: {detail}",
        )

    data = res.json()
    text = (
        data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "")
        .strip()
    )
    if not text:
        return RefineResult(ok=False, error="응답 텍스트 없음")

    return _parse_response(text)


def refine_academy_copy(
    name: str,
    description: str,
    address: str,
    log: LogFn = print,
) -> RefineResult:
    """로컬 GEMINI_API_KEY로 소개글 재작성."""
    api_key = _api_key()
    if not api_key:
        return RefineResult(ok=False, error="GEMINI_API_KEY가 .env에 없습니다")
    if not description.strip():
        return RefineResult(ok=False, error="소개글(description) 없음")

    prompt = _build_prompt(name, description, address)
    log(f"    Gemini 로컬 변환 ({GEMINI_MODEL})…")

    for json_mode in (True, False):
        result = _call_gemini(api_key, prompt, json_mode)
        if result.ok:
            log("    ✓ Gemini 변환 완료")
            return result
        log(f"    ⚠ Gemini: {result.error}")

    return RefineResult(
        ok=False,
        error=result.error or "Gemini 호출 실패",
    )


def apply_refine_to_item(
    item: dict,
    log: LogFn = print,
) -> tuple[dict, bool]:
    """item에 title_copy/curriculum/tuition_info 반영. 성공 여부 반환."""
    name = item.get("name", "")
    address = item.get("address", "")
    description = item.get("description") or ""

    result = refine_academy_copy(name, description, address, log=log)
    if not result.ok:
        return item, False

    updated = dict(item)
    updated["title_copy"] = result.title_copy
    updated["curriculum"] = result.curriculum
    updated["tuition_info"] = result.tuition_info
    return updated, True
