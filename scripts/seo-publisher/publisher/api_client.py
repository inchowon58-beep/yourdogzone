from __future__ import annotations

import json
import socket
import time
from typing import Any, Callable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from publisher.config import Config
from publisher.slug import CATEGORY_META

LogFn = Callable[[str], None] | None

# Cloudflare ~100s 한도보다 짧게 — 무응답 장시간 대기 방지
REQUEST_TIMEOUT_SEC = 85
MAX_RETRIES = 3
DEFAULT_CHUNK = 5
INDEXNOW_CHUNK = 80


def _clean_secret(secret: str) -> str:
    return (secret or "").strip().strip('"').strip("'")


def _headers(cfg: Config) -> dict[str, str]:
    secret = _clean_secret(cfg.admin_secret)
    return {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-admin-secret": secret,
        "Authorization": f"Bearer {secret}",
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        ),
    }


def _is_retryable_status(code: int) -> bool:
    return code in {408, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524}


def _is_timeout_error(exc: BaseException) -> bool:
    msg = str(exc).lower()
    if isinstance(exc, TimeoutError | socket.timeout):
        return True
    return any(
        token in msg
        for token in ("timed out", "timeout", "524", "523", "522", "504", "503", "502")
    )


def _post_json(
    cfg: Config,
    path: str,
    payload: dict[str, Any],
    *,
    retries: int = MAX_RETRIES,
    timeout: int = REQUEST_TIMEOUT_SEC,
    on_log: LogFn = None,
    label: str = "",
) -> dict[str, Any]:
    if not _clean_secret(cfg.admin_secret):
        raise RuntimeError(
            "관리자 비밀키(ACADEMY_ADMIN_SECRET)가 비어 있습니다. "
            "Vercel과 동일한 값을 .env에 넣으세요."
        )
    url = f"{cfg.api_base}{path}"
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    last_err: Exception | None = None

    for attempt in range(1, retries + 1):
        if on_log and label:
            on_log(
                f"  API 요청{f' ({label})' if label else ''}"
                f"… 시도 {attempt}/{retries}"
            )
        req = Request(url, data=body, headers=_headers(cfg), method="POST")
        try:
            with urlopen(req, timeout=timeout) as res:
                return json.loads(res.read().decode("utf-8"))
        except HTTPError as e:
            detail = e.read().decode("utf-8", errors="replace")[:500]
            if e.code == 401:
                raise RuntimeError(
                    "API 401: 관리자 비밀키가 서버와 다릅니다. "
                    f"응답: {detail}"
                ) from e
            last_err = RuntimeError(f"API {e.code}: {detail}")
            if attempt < retries and _is_retryable_status(e.code):
                wait = min(20, 3 * attempt)
                if on_log:
                    on_log(f"  재시도 대기 {wait}s (HTTP {e.code})")
                time.sleep(wait)
                continue
            raise last_err from e
        except (URLError, TimeoutError, socket.timeout, OSError) as e:
            last_err = RuntimeError(f"API 연결 실패: {e}")
            if attempt < retries:
                wait = min(20, 3 * attempt)
                if on_log:
                    on_log(f"  재시도 대기 {wait}s ({e})")
                time.sleep(wait)
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


def _page_label(page: dict[str, Any]) -> str:
    return str(page.get("keyword") or page.get("label") or page.get("slug") or "?")


def _publish_one(
    cfg: Config, page: dict[str, Any], *, on_log: LogFn = None
) -> dict[str, Any]:
    return _post_json(
        cfg,
        "/api/admin/regional-landings",
        {"page": _ensure_layout_fields(page)},
        on_log=on_log,
        label=_page_label(page)[:24],
    )


def _publish_batch(
    cfg: Config,
    pages: list[dict[str, Any]],
    *,
    on_log: LogFn = None,
) -> dict[str, Any] | None:
    try:
        return _post_json(
            cfg,
            "/api/admin/regional-landings",
            {
                "action": "upsert_batch",
                "pages": [_ensure_layout_fields(p) for p in pages],
                "submit_indexnow": False,
            },
            on_log=on_log,
            label=f"배치 {len(pages)}건",
        )
    except RuntimeError as e:
        msg = str(e)
        if "page.slug" in msg or "page.label" in msg or "잘못된 요청" in msg:
            return None
        raise


def _publish_chunk_resilient(
    cfg: Config,
    chunk: list[dict[str, Any]],
    *,
    use_batch: bool | None,
    done_before: int,
    total: int,
    on_log: LogFn,
) -> tuple[list[str], list[str], int, bool | None]:
    """배치 실패 시 단건 폴백. 타임아웃이어도 전체 중단하지 않음."""
    urls: list[str] = []
    errors: list[str] = []
    created = 0
    mode = use_batch

    def log(msg: str) -> None:
        if on_log:
            on_log(msg)

    if mode is not False:
        try:
            data = _publish_batch(cfg, chunk, on_log=on_log)
            if data is not None:
                batch_urls = data.get("urls") or []
                urls.extend(batch_urls)
                errors.extend(data.get("errors") or [])
                created += int(data.get("count") or 0)
                for i, page in enumerate(chunk):
                    n = done_before + i + 1
                    log(f"성공: {_page_label(page)[:40]} — {n} / {total}")
                return urls, errors, created, True
            mode = False
            log("서버에 일괄 API 없음 → 단건 발행으로 진행")
        except Exception as e:
            if _is_timeout_error(e):
                log(f"배치 타임아웃/오류 → 단건으로 재시도: {e}")
                # 다음 청크도 배치 재시도하되, 이번 청크는 단건
            else:
                raise

    for i, page in enumerate(chunk):
        n = done_before + i + 1
        try:
            data = _publish_one(cfg, page, on_log=on_log)
            saved = data.get("page") or {}
            slug = saved.get("slug") or page.get("slug") or ""
            category = saved.get("category") or page.get("category") or "shelter"
            urls.append(page_url(cfg, category, slug))
            created += 1
            log(f"성공: {_page_label(page)[:40]} — {n} / {total}")
        except Exception as e:
            slug = page.get("slug") or "?"
            errors.append(f"{slug}: {e}")
            log(f"실패: {_page_label(page)[:40]} — {n} / {total} · {e}")

    return urls, errors, created, mode if mode is not None else False


def _submit_indexnow_chunked(
    cfg: Config,
    urls: list[str],
    *,
    on_log: LogFn,
) -> dict[str, Any]:
    unique = list(dict.fromkeys(urls))
    if not unique:
        return {"ok": True, "message": "URL 없음", "submitted": 0}

    results: list[dict[str, Any]] = []
    ok_total = 0
    for i in range(0, len(unique), INDEXNOW_CHUNK):
        part = unique[i : i + INDEXNOW_CHUNK]
        on_log(
            f"IndexNow 전송… {i + 1}~{i + len(part)} / {len(unique)}"
        )
        try:
            data = _post_json(
                cfg,
                "/api/indexnow",
                {"urls": part},
                timeout=60,
                retries=2,
                on_log=on_log,
                label=f"IndexNow {len(part)}건",
            )
            results.append(data)
            if data.get("ok"):
                ok_total += int(data.get("submitted") or len(part))
            on_log(f"IndexNow: {data.get('message') or data}")
        except Exception as e:
            on_log(f"IndexNow 구간 실패 (계속): {e}")
            results.append({"ok": False, "message": str(e)})
        time.sleep(0.4)

    return {
        "ok": ok_total > 0,
        "submitted": ok_total,
        "total": len(unique),
        "chunks": results,
        "message": f"IndexNow {ok_total}/{len(unique)}건",
    }


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

    size = max(1, chunk_size or cfg.chunk_size or DEFAULT_CHUNK)
    # 대량일수록 청크를 더 작게 — 524·장시간 무응답 완화
    if len(pages) >= 100:
        size = min(size, 5)
    if len(pages) >= 250:
        size = min(size, 3)

    all_urls: list[str] = []
    all_errors: list[str] = []
    created = 0
    use_batch: bool | None = None
    consecutive_timeouts = 0

    def log(msg: str) -> None:
        if on_log:
            on_log(msg)

    log(f"사이트 발행 시작 · 총 {len(pages)}건 · 청크 {size}")

    i = 0
    while i < len(pages):
        chunk = pages[i : i + size]
        log(f"발행 중… {i + 1}~{i + len(chunk)} / {len(pages)}")

        try:
            urls, errors, n, use_batch = _publish_chunk_resilient(
                cfg,
                chunk,
                use_batch=use_batch,
                done_before=i,
                total=len(pages),
                on_log=on_log,
            )
            all_urls.extend(urls)
            all_errors.extend(errors)
            created += n
            consecutive_timeouts = 0
        except Exception as e:
            all_errors.append(f"chunk {i + 1}-{i + len(chunk)}: {e}")
            log(f"  청크 실패 (계속 진행): {e}")
            if _is_timeout_error(e):
                consecutive_timeouts += 1
                if consecutive_timeouts >= 2 and size > 1:
                    size = max(1, size // 2)
                    log(f"  청크 크기 축소 → {size}")
                    consecutive_timeouts = 0
                    continue  # 같은 구간 재시도(축소된 크기)
            # 단건으로 이 청크라도 소화
            for j, page in enumerate(chunk):
                n = i + j + 1
                try:
                    data = _publish_one(cfg, page, on_log=on_log)
                    saved = data.get("page") or {}
                    slug = saved.get("slug") or page.get("slug") or ""
                    category = (
                        saved.get("category") or page.get("category") or "shelter"
                    )
                    all_urls.append(page_url(cfg, category, slug))
                    created += 1
                    log(f"성공: {_page_label(page)[:40]} — {n} / {len(pages)}")
                except Exception as pe:
                    all_errors.append(f"{page.get('slug')}: {pe}")
                    log(
                        f"실패: {_page_label(page)[:40]} — {n} / {len(pages)} · {pe}"
                    )

        i += len(chunk)
        time.sleep(0.35)

    unique_urls = list(dict.fromkeys(all_urls))
    indexnow = None
    if submit_indexnow and unique_urls:
        indexnow = _submit_indexnow_chunked(cfg, unique_urls, on_log=log)
    elif submit_indexnow:
        log("IndexNow 생략: 발행된 URL이 없습니다.")

    log(f"사이트 발행 완료: {created}건 (URL {len(unique_urls)}건)")

    return {
        "count": created,
        "urls": unique_urls,
        "errors": all_errors,
        "indexnow": indexnow,
        "mode": "batch" if use_batch else "single",
    }
