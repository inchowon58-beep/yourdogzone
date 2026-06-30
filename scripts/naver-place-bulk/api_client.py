"""YourDogZone API 클라이언트"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Callable

import requests
from dotenv import load_dotenv

from gemini_refine import apply_refine_to_item
from image_uploader import prepare_register_payload
from master_registry import place_key

load_dotenv()

BATCH_SIZE = 5
DELAY_SEC = 2
LogFn = Callable[[str], None]


@dataclass
class RegisteredSiteIndex:
    names: set[str]
    name_address_pairs: set[tuple[str, str]]
    place_keys: set[str]


def _api_url() -> str:
    return os.getenv("YOURDOGZONE_API_URL", "https://www.yourdogzone.co.kr").rstrip("/")


def _admin_secret() -> str:
    return os.getenv("ACADEMY_ADMIN_SECRET", "")


def _headers() -> dict[str, str]:
    return {"x-admin-secret": _admin_secret(), "Content-Type": "application/json"}


def check_server_ready(log: LogFn = print) -> bool:
    """R2·IndexNow·서버 상태 확인."""
    api = _api_url()
    ok = True
    try:
        res = requests.get(f"{api}/api/upload", timeout=20)
        data = res.json()
        if data.get("ready"):
            log(f"  ✓ R2 준비됨 ({data.get('publicBase')})")
        else:
            ok = False
            missing = data.get("missing") or []
            log(f"  ⚠ R2 미설정 — Vercel 환경변수: {', '.join(missing)}")
    except requests.RequestException as e:
        ok = False
        log(f"  ⚠ /api/upload 확인 실패: {e}")

    try:
        res = requests.get(f"{api}/api/indexnow", timeout=15)
        data = res.json()
        if data.get("enabled"):
            log("  ✓ IndexNow 준비됨 (크롤러: 세션 종료 후 일괄 전송)")
        else:
            log("  ⚠ IndexNow 미설정 — Vercel INDEXNOW_KEY 확인")
    except requests.RequestException as e:
        log(f"  ⚠ /api/indexnow 확인 실패: {e}")

    return ok


def fetch_registered_index(
    category: str = "academy",
    log: LogFn = print,
) -> RegisteredSiteIndex:
    """사이트에 이미 등록된 업체 인덱스 (중복 등록 방지)."""
    secret = _admin_secret()
    empty = RegisteredSiteIndex(names=set(), name_address_pairs=set(), place_keys=set())
    if not secret:
        return empty
    if category == "academy":
        admin_path = "/api/academy/admin"
        list_key = "academies"
    else:
        admin_path = f"/api/listings/{category}/admin"
        list_key = "listings"
    try:
        res = requests.get(
            f"{_api_url()}{admin_path}",
            headers={"x-admin-secret": secret},
            timeout=30,
        )
        if not res.ok:
            return empty
        data = res.json()
        names: set[str] = set()
        pairs: set[tuple[str, str]] = set()
        keys: set[str] = set()
        for row in data.get(list_key, []):
            name = str(row.get("name") or "").strip()
            address = str(row.get("address") or "").strip()
            if name:
                names.add(name)
            if name and address:
                pairs.add((name, address))
            key = place_key(
                {
                    "name": name,
                    "address": address,
                    "naver_place_url": row.get("naver_place_url") or "",
                }
            )
            if key:
                keys.add(key)
        return RegisteredSiteIndex(names=names, name_address_pairs=pairs, place_keys=keys)
    except requests.RequestException as e:
        log(f"⚠ 등록 목록 조회 실패: {e}")
        return empty


def fetch_registered_names(category: str = "academy", log: LogFn = print) -> set[str]:
    return fetch_registered_index(category, log).names


def register_batch(
    items: list[dict],
    *,
    category: str = "academy",
    skip_image_mirror: bool = False,
    defer_indexnow: bool = True,
) -> dict:
    res = requests.post(
        f"{_api_url()}/api/admin/bulk-register",
        headers=_headers(),
        json={
            "category": category,
            "refine_with_gemini": False,
            "skip_image_mirror": skip_image_mirror,
            "defer_indexnow": defer_indexnow,
            "items": items,
        },
        timeout=180,
    )
    res.raise_for_status()
    return res.json()


def submit_indexnow_batch(urls: list[str], log: LogFn = print) -> bool:
    """세션에서 등록된 URL을 IndexNow에 한 번(또는 1만 건 단위) 전송."""
    clean = list(dict.fromkeys(u.strip() for u in urls if u and u.startswith("http")))
    if not clean:
        log("  IndexNow: 전송할 URL 없음")
        return False

    secret = _admin_secret()
    if not secret:
        log("  ⚠ IndexNow: ACADEMY_ADMIN_SECRET 없음 — 일괄 전송 생략")
        return False

    chunk_size = 10_000
    ok_all = True
    for start in range(0, len(clean), chunk_size):
        chunk = clean[start : start + chunk_size]
        label = f" (파트 {start // chunk_size + 1})" if len(clean) > chunk_size else ""
        log(f"\n[IndexNow 일괄 전송{label}] {len(chunk)}개 URL…")
        try:
            res = requests.post(
                f"{_api_url()}/api/indexnow",
                headers=_headers(),
                json={"urls": chunk},
                timeout=120,
            )
            data = res.json()
            if res.ok and data.get("ok"):
                log(f"  ✓ IndexNow 전송 완료 — {data.get('submitted', len(chunk))}개")
            else:
                ok_all = False
                detail = data.get("message") or data.get("error") or res.status_code
                if data.get("status"):
                    detail = f"{detail} (status={data.get('status')})"
                log(f"  ⚠ IndexNow 실패: {detail}")
        except requests.RequestException as e:
            ok_all = False
            log(f"  ⚠ IndexNow 요청 실패: {e}")
    return ok_all


def register_all(
    items: list[dict],
    refine_gemini: bool = True,
    seo_title_suffix: str = "",
    category: str = "academy",
    log: LogFn = print,
) -> tuple[int, int, list[tuple[dict, str]]]:
    api = _api_url()
    log("\n서버 상태 확인…")
    check_server_ready(log)

    prepared: list[dict] = []
    skip_mirror = False
    local_gemini_flags: list[bool] = []

    for item in items:
        log(f"\n▶ {item.get('name', '(이름 없음)')} 등록 준비")
        working = dict(item)
        gemini_ok = False

        if refine_gemini:
            if os.getenv("GEMINI_API_KEY", "").strip():
                working, gemini_ok = apply_refine_to_item(
                    working, log=log, category=category
                )
            else:
                log("    ⚠ GEMINI_API_KEY 없음 — 원문 그대로 등록")

        local_gemini_flags.append(gemini_ok)
        if seo_title_suffix:
            working["seo_title_suffix"] = seo_title_suffix
        payload = prepare_register_payload(working, api, log=log, category=category)
        if payload.get("academy_images") or payload.get("logo_image"):
            skip_mirror = True
        prepared.append(payload)

    succeeded = 0
    failed = 0
    pending_urls: list[str] = []
    successes: list[tuple[dict, str]] = []
    flag_idx = 0
    for i in range(0, len(prepared), BATCH_SIZE):
        batch = prepared[i : i + BATCH_SIZE]
        batch_flags = local_gemini_flags[i : i + BATCH_SIZE]
        log(f"\n[등록 배치 {i // BATCH_SIZE + 1}] {len(batch)}건 전송…")
        try:
            result = register_batch(batch, category=category, skip_image_mirror=skip_mirror)
            rows = result.get("results", [result])
            for j, (r, local_gemini) in enumerate(zip(rows, batch_flags)):
                orig = items[i + j]
                if r.get("ok"):
                    succeeded += 1
                    gemini_label = (
                        "Gemini 적용(로컬)"
                        if local_gemini
                        else "Gemini 미적용"
                    )
                    imgs = r.get("imageCount", 0)
                    url = r.get("url") or ""
                    if url:
                        pending_urls.append(url)
                        successes.append((orig, url))
                    log(f"  ✓ {r.get('name')} → {url} ({gemini_label}, 사진 {imgs}장)")
                    for err in r.get("imageErrors") or []:
                        log(f"    ⚠ 이미지: {str(err)[:160]}")
                else:
                    failed += 1
                    log(f"  ✗ {r.get('name')}: {r.get('error')}")
                flag_idx += 1
        except requests.RequestException as e:
            failed += len(batch)
            log(f"  배치 실패: {e}")
        time.sleep(DELAY_SEC)

    if pending_urls:
        submit_indexnow_batch(pending_urls, log=log)

    return succeeded, failed, successes


# CLI 호환
API_URL = _api_url()
ADMIN_SECRET = _admin_secret()
