from __future__ import annotations

import json
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


def _post_json(cfg: Config, path: str, payload: dict[str, Any]) -> dict[str, Any]:
    if not _clean_secret(cfg.admin_secret):
        raise RuntimeError(
            "관리자 비밀키(ACADEMY_ADMIN_SECRET)가 비어 있습니다. "
            "Vercel과 동일한 값을 GUI에 입력하세요."
        )
    url = f"{cfg.api_base}{path}"
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
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
        raise RuntimeError(f"API {e.code}: {detail}") from e
    except URLError as e:
        raise RuntimeError(f"API 연결 실패: {e}") from e


def page_url(cfg: Config, category: str, slug: str) -> str:
    base = CATEGORY_META.get(category, CATEGORY_META["shelter"])["base_path"]
    return f"{cfg.site_url.rstrip('/')}{base}/region/{slug}"


def _publish_one(cfg: Config, page: dict[str, Any]) -> dict[str, Any]:
    """프로덕션 호환: 단건 upsert (body.page)."""
    return _post_json(
        cfg,
        "/api/admin/regional-landings",
        {"page": page},
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
                "pages": pages,
                "submit_indexnow": False,
            },
        )
    except RuntimeError as e:
        msg = str(e)
        # 구버전 API: action 무시 후 page.slug 필수 오류
        if "page.slug" in msg or "page.label" in msg or "잘못된 요청" in msg:
            return None
        raise


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

    size = chunk_size or cfg.chunk_size
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

        if use_batch is not False:
            data = _publish_batch(cfg, chunk)
            if data is not None:
                use_batch = True
                urls = data.get("urls") or []
                all_urls.extend(urls)
                all_errors.extend(data.get("errors") or [])
                created += int(data.get("count") or 0)
                continue
            use_batch = False
            log("서버에 일괄 API 없음 → 단건 발행으로 진행")

        for page in chunk:
            try:
                data = _publish_one(cfg, page)
                saved = data.get("page") or {}
                slug = saved.get("slug") or page.get("slug") or ""
                category = saved.get("category") or page.get("category") or "shelter"
                url = page_url(cfg, category, slug)
                all_urls.append(url)
                created += 1
            except Exception as e:
                slug = page.get("slug") or "?"
                all_errors.append(f"{slug}: {e}")
                log(f"  실패 {slug}: {e}")

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
