"""YourDogZone API 클라이언트"""

from __future__ import annotations

import os
import time
from typing import Callable

import requests
from dotenv import load_dotenv

from image_uploader import prepare_register_payload

load_dotenv()

BATCH_SIZE = 5
DELAY_SEC = 2
LogFn = Callable[[str], None]


def _api_url() -> str:
    return os.getenv("YOURDOGZONE_API_URL", "https://www.yourdogzone.co.kr").rstrip("/")


def _admin_secret() -> str:
    return os.getenv("ACADEMY_ADMIN_SECRET", "")


def _headers() -> dict[str, str]:
    return {"x-admin-secret": _admin_secret(), "Content-Type": "application/json"}


def check_server_ready(log: LogFn = print) -> bool:
    """R2 업로드·서버 상태 확인."""
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
    return ok


def fetch_registered_names(log: LogFn = print) -> set[str]:
    secret = _admin_secret()
    if not secret:
        return set()
    try:
        res = requests.get(
            f"{_api_url()}/api/academy/admin",
            headers={"x-admin-secret": secret},
            timeout=30,
        )
        if not res.ok:
            return set()
        data = res.json()
        return {a.get("name", "").strip() for a in data.get("academies", []) if a.get("name")}
    except requests.RequestException as e:
        log(f"⚠ 등록 목록 조회 실패: {e}")
        return set()


def register_batch(
    items: list[dict],
    refine_gemini: bool = True,
    *,
    skip_image_mirror: bool = False,
) -> dict:
    res = requests.post(
        f"{_api_url()}/api/admin/bulk-register",
        headers=_headers(),
        json={
            "refine_with_gemini": refine_gemini,
            "skip_image_mirror": skip_image_mirror,
            "items": items,
        },
        timeout=180,
    )
    res.raise_for_status()
    return res.json()


def register_all(
    items: list[dict],
    refine_gemini: bool = True,
    log: LogFn = print,
) -> tuple[int, int]:
    api = _api_url()
    log("\n서버 상태 확인…")
    check_server_ready(log)

    prepared: list[dict] = []
    skip_mirror = False
    for item in items:
        log(f"\n▶ {item.get('name', '(이름 없음)')} 등록 준비")
        payload = prepare_register_payload(item, api, log=log)
        if payload.get("academy_images"):
            skip_mirror = True
        prepared.append(payload)

    succeeded = 0
    failed = 0
    for i in range(0, len(prepared), BATCH_SIZE):
        batch = prepared[i : i + BATCH_SIZE]
        log(f"\n[등록 배치 {i // BATCH_SIZE + 1}] {len(batch)}건 전송…")
        try:
            result = register_batch(
                batch,
                refine_gemini,
                skip_image_mirror=skip_mirror,
            )
            rows = result.get("results", [result])
            for r in rows:
                if r.get("ok"):
                    succeeded += 1
                    gemini = (
                        "Gemini 적용"
                        if r.get("geminiRefined")
                        else "Gemini 미적용"
                    )
                    imgs = r.get("imageCount", 0)
                    log(f"  ✓ {r.get('name')} → {r.get('url')} ({gemini}, 사진 {imgs}장)")
                    if r.get("geminiSkipReason"):
                        log(f"    ⚠ Gemini: {r['geminiSkipReason']}")
                    for err in r.get("imageErrors") or []:
                        log(f"    ⚠ 이미지: {str(err)[:160]}")
                else:
                    failed += 1
                    log(f"  ✗ {r.get('name')}: {r.get('error')}")
        except requests.RequestException as e:
            failed += len(batch)
            log(f"  배치 실패: {e}")
        time.sleep(DELAY_SEC)
    return succeeded, failed


# CLI 호환
API_URL = _api_url()
ADMIN_SECRET = _admin_secret()
