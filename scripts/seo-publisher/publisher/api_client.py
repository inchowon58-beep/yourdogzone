from __future__ import annotations

import json
import time
from typing import Any, Callable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from publisher.config import Config
from publisher.slug import CATEGORY_META

LogFn = Callable[[str], None] | None


def _clean_secret(secret: str) -> str:
    return (secret or "").strip().strip('"').strip("'")


def _headers(cfg: Config) -> dict[str, str]:
    secret = _clean_secret(cfg.admin_secret)
    return {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-admin-secret": secret,
        "Authorization": f"Bearer {secret}",
        # Cloudflare 봇 차단 완화
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        ),
    }


def _is_retryable_status(code: int) -> bool:
    return code in {408, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524}


def _post_json(
    cfg: Config,
    path: str,
    payload: dict[str, Any],
    *,
    retries: int = 3,
) -> dict[str, Any]:
    if not _clean_secret(cfg.admin_secret):
        raise RuntimeError(
            "관리자 비밀키(ACADEMY_ADMIN_SECRET)가 비어 있습니다. "
            "Vercel과 동일한 값을 GUI에 입력하세요."
        )
    url = f"{cfg.api_base}{path}"
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    last_err: Exception | None = None

    for attempt in range(1, retries + 1):
        req = Request(url, data=body, headers=_headers(cfg), method="POST")
        try:
            with urlopen(req, timeout=180) as res:
                return json.loads(res.read().decode("utf-8"))
        except HTTPError as e:
            detail = e.read().decode("utf-8", errors="replace")[:500]
            if e.code == 401:
                raise RuntimeError(
                    "API 401: 관리자 비밀키가 서버와 다릅니다. "
                    "네이버 대량등록 프로그램(.env)의 ACADEMY_ADMIN_SECRET 과 "
                    f"동일하게 넣어 주세요. 응답: {detail}"
                ) from e
            last_err = RuntimeError(f"API {e.code}: {detail}")
            if attempt < retries and _is_retryable_status(e.code):
                wait = min(30, 5 * attempt)
                time.sleep(wait)
                continue
            raise last_err from e
        except URLError as e:
            last_err = RuntimeError(f"API 연결 실패: {e}")
            if attempt < retries:
                time.sleep(min(30, 5 * attempt))
                continue
            raise last_err from e

    raise last_err or RuntimeError("API 요청 실패")


def page_url(cfg: Config, category: str, slug: str) -> str:
    base = CATEGORY_META.get(category, CATEGORY_META["shelter"])["base_path"]
    return f"{cfg.site_url.rstrip('/')}{base}/region/{slug}"


def _ensure_layout_fields(page: dict[str, Any]) -> dict[str, Any]:
    """exe/구버전이라도 보호소·분양은 v2 가이드로 올라가도록 보정."""
    out = dict(page)
    out["publishSource"] = out.get("publishSource") or "offline-seo"
    cat = str(out.get("category") or "")
    if cat == "shelter":
        out["layoutVersion"] = "v2"
    elif cat == "adoption":
        out["layoutVersion"] = "v2"
        if not out.get("formId"):
            out["formId"] = "dog_basic"
            out["formLabel"] = out.get("formLabel") or "기본강아지"
    elif not out.get("layoutVersion"):
        out["layoutVersion"] = "v1"
    return out


def _publish_one(cfg: Config, page: dict[str, Any]) -> dict[str, Any]:
    """프로덕션 호환: 단건 upsert (body.page)."""
    return _post_json(
        cfg,
        "/api/admin/regional-landings",
        {"page": _ensure_layout_fields(page)},
    )


def _publish_batch(
    cfg: Config, pages: list[dict[str, Any]]
) -> dict[str, Any] | None:
    """upsert_batch 가 배포된 경우만 사용. 미지원이면 None."""
    try:
        return _post_json(
            cfg,
            "/api/admin/regional-landings",
            {
                "action": "upsert_batch",
                "pages": [_ensure_layout_fields(p) for p in pages],
                "submit_indexnow": False,
            },
        )
    except RuntimeError as e:
        msg = str(e)
        # 구버전 API: action 무시 후 page.slug 필수 오류
        if "page.slug" in msg or "page.label" in msg or "잘못된 요청" in msg:
            return None
        raise


def _publish_chunk_resilient(
    cfg: Config,
    chunk: list[dict[str, Any]],
    *,
    use_batch: bool | None,
    on_log: LogFn,
) -> tuple[list[str], list[str], int, bool | None]:
    """배치 실패(524 등) 시 단건으로 폴백. 전체 작업은 중단하지 않음."""
    urls: list[str] = []
    errors: list[str] = []
    created = 0
    mode = use_batch

    def log(msg: str) -> None:
        if on_log:
            on_log(msg)

    if mode is not False:
        try:
            data = _publish_batch(cfg, chunk)
            if data is not None:
                urls.extend(data.get("urls") or [])
                errors.extend(data.get("errors") or [])
                created += int(data.get("count") or 0)
                return urls, errors, created, True
            mode = False
            log("서버에 일괄 API 없음 → 단건 발행으로 진행")
        except Exception as e:
            msg = str(e)
            if "524" in msg or "502" in msg or "503" in msg or "504" in msg:
                log(f"배치 타임아웃/오류 → 단건으로 재시도: {e}")
                mode = True  # 다음 청크는 다시 배치 시도
            else:
                raise

    for page in chunk:
        try:
            data = _publish_one(cfg, page)
            saved = data.get("page") or {}
            slug = saved.get("slug") or page.get("slug") or ""
            category = saved.get("category") or page.get("category") or "shelter"
            urls.append(page_url(cfg, category, slug))
            created += 1
        except Exception as e:
            slug = page.get("slug") or "?"
            errors.append(f"{slug}: {e}")
            log(f"  실패 {slug}: {e}")

    return urls, errors, created, mode


def publish_pages(
    cfg: Config,
    pages: list[dict[str, Any]],
    *,
    submit_indexnow: bool = True,
    chunk_size: int | None = None,
    on_log: LogFn = None,
) -> dict[str, Any]:
    if not _clean_secret(cfg.admin_secret):
        raise RuntimeError("ACADEMY_ADMIN_SECRET 이 필요합니다.")
    if not pages:
        raise RuntimeError("발행할 페이지가 없습니다.")

    # Cloudflare 120s 한도 대비 — 서버 배치 최적화 전에도 안전하게
    size = chunk_size or cfg.chunk_size or 10
    all_urls: list[str] = []
    all_errors: list[str] = []
    created = 0
    use_batch: bool | None = None

    def log(msg: str) -> None:
        if on_log:
            on_log(msg)

    for i in range(0, len(pages), size):
        chunk = pages[i : i + size]
        log(f"발행 중… {i + 1}~{i + len(chunk)} / {len(pages)}")

        try:
            urls, errors, n, use_batch = _publish_chunk_resilient(
                cfg, chunk, use_batch=use_batch, on_log=on_log
            )
            all_urls.extend(urls)
            all_errors.extend(errors)
            created += n
        except Exception as e:
            all_errors.append(f"chunk {i + 1}-{i + len(chunk)}: {e}")
            log(f"  청크 실패 (계속 진행): {e}")

    indexnow = None
    unique_urls = list(dict.fromkeys(all_urls))
    if submit_indexnow and unique_urls:
        log(f"IndexNow 전송… {len(unique_urls)}건")
        try:
            indexnow = _post_json(cfg, "/api/indexnow", {"urls": unique_urls})
            log(f"IndexNow: {indexnow}")
        except Exception as e:
            log(f"IndexNow 실패: {e}")
            indexnow = {"ok": False, "message": str(e)}

    return {
        "count": created,
        "urls": unique_urls,
        "errors": all_errors,
        "indexnow": indexnow,
        "mode": "batch" if use_batch else "single",
    }
