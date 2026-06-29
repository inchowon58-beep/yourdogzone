"""네이버 이미지 다운로드 → 사이트 R2 업로드 (등록 전 PC에서 처리)"""

from __future__ import annotations

import re
import time
from typing import Callable
from urllib.parse import parse_qs, unquote, urlparse

import requests

LogFn = Callable[[str], None]

DOWNLOAD_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "image/*,*/*;q=0.8",
    "Referer": "https://map.naver.com/",
}


def resolve_naver_image_url(image_url: str) -> str:
    """search.pstatic.net 프록시 → ldb-phinf 등 실제 URL."""
    try:
        parsed = urlparse(image_url.strip())
        if "pstatic.net" in parsed.netloc or "naver" in parsed.netloc:
            qs = parse_qs(parsed.query)
            src_list = qs.get("src")
            if src_list and src_list[0]:
                return unquote(src_list[0])
    except Exception:
        pass
    return image_url.strip()


def normalize_image_urls(urls: list[str], max_count: int = 3) -> list[str]:
    """수집 직후 저장용 — 프록시 URL을 원본 URL로 변환."""
    out: list[str] = []
    seen: set[str] = set()
    for raw in urls:
        direct = resolve_naver_image_url(raw)
        if not direct.startswith("http"):
            continue
        if direct in seen:
            continue
        seen.add(direct)
        out.append(direct)
        if len(out) >= max_count:
            break
    return out


def upload_image_to_r2(
    image_url: str,
    api_url: str,
    log: LogFn = print,
) -> str | None:
    """이미지 1장 다운로드 후 /api/upload presign → R2 PUT."""
    candidates = []
    for url in (resolve_naver_image_url(image_url), image_url.strip()):
        if url and url not in candidates:
            candidates.append(url)

    for url in candidates:
        try:
            res = requests.get(url, headers=DOWNLOAD_HEADERS, timeout=45)
            if not res.ok:
                log(f"    ⚠ 다운로드 실패 ({res.status_code}): {url[:72]}…")
                continue

            content = res.content
            if len(content) < 500:
                log(f"    ⚠ 이미지 용량 너무 작음: {url[:72]}…")
                continue

            content_type = (res.headers.get("Content-Type") or "image/jpeg").split(";")[0]
            ext = ".jpg"
            if "png" in content_type:
                ext = ".png"
            elif "webp" in content_type:
                ext = ".webp"
            elif "gif" in content_type:
                ext = ".gif"

            filename = f"academy-{int(time.time() * 1000)}{ext}"
            presign_res = requests.post(
                f"{api_url.rstrip('/')}/api/upload",
                json={
                    "filename": filename,
                    "contentType": content_type,
                    "fileSize": len(content),
                },
                timeout=30,
            )
            if not presign_res.ok:
                log(f"    ⚠ R2 presign 실패: {presign_res.text[:120]}")
                return None

            data = presign_res.json()
            upload_url = data.get("uploadUrl")
            public_url = data.get("publicUrl")
            put_type = data.get("contentType") or content_type
            if not upload_url or not public_url:
                log("    ⚠ presign 응답에 uploadUrl/publicUrl 없음")
                return None

            put_res = requests.put(
                upload_url,
                data=content,
                headers={"Content-Type": put_type},
                timeout=90,
            )
            if not put_res.ok:
                log(f"    ⚠ R2 PUT 실패 ({put_res.status_code})")
                continue

            return str(public_url)
        except requests.RequestException as e:
            log(f"    ⚠ 업로드 오류: {e}")
            continue

    return None


def mirror_images_for_register(
    image_urls: list[str],
    api_url: str,
    log: LogFn = print,
    max_count: int = 3,
) -> list[str]:
    """등록 API 호출 전 이미지를 R2 URL로 변환."""
    direct_urls = normalize_image_urls(image_urls, max_count=max_count)
    if not direct_urls:
        return []

    log(f"    이미지 R2 업로드 ({len(direct_urls)}장)…")
    uploaded: list[str] = []
    for i, url in enumerate(direct_urls, start=1):
        short = re.sub(r"^https?://", "", url)[:56]
        log(f"      [{i}/{len(direct_urls)}] {short}…")
        public = upload_image_to_r2(url, api_url, log=log)
        if public:
            uploaded.append(public)
        time.sleep(0.4)

    if uploaded:
        log(f"    ✓ R2 이미지 {len(uploaded)}장 준비 완료")
    else:
        log("    ⚠ R2 이미지 업로드 실패 — 사진 없이 등록 시도")

    return uploaded


def prepare_register_payload(
    item: dict,
    api_url: str,
    log: LogFn = print,
) -> dict:
    """등록 payload — 이미지는 R2 URL로 치환."""
    payload = dict(item)
    raw_urls = payload.pop("image_urls", None) or []
    if not raw_urls:
        return payload

    r2_urls = mirror_images_for_register(raw_urls, api_url, log=log)
    if r2_urls:
        payload["logo_image"] = r2_urls[0]
        payload["academy_images"] = r2_urls[1:3]
    return payload
