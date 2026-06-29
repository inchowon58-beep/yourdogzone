"""YourDogZone API 클라이언트"""

from __future__ import annotations

import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv("YOURDOGZONE_API_URL", "https://www.yourdogzone.co.kr").rstrip("/")
ADMIN_SECRET = os.getenv("ACADEMY_ADMIN_SECRET", "")
BATCH_SIZE = 5
DELAY_SEC = 2


def _headers() -> dict[str, str]:
    return {"x-admin-secret": ADMIN_SECRET, "Content-Type": "application/json"}


def fetch_registered_names() -> set[str]:
    if not ADMIN_SECRET:
        return set()
    try:
        res = requests.get(
            f"{API_URL}/api/academy/admin",
            headers={"x-admin-secret": ADMIN_SECRET},
            timeout=30,
        )
        if not res.ok:
            return set()
        data = res.json()
        return {a.get("name", "").strip() for a in data.get("academies", []) if a.get("name")}
    except requests.RequestException:
        return set()


def register_batch(items: list[dict], refine_gemini: bool = True) -> dict:
    res = requests.post(
        f"{API_URL}/api/admin/bulk-register",
        headers=_headers(),
        json={"refine_with_gemini": refine_gemini, "items": items},
        timeout=180,
    )
    res.raise_for_status()
    return res.json()


def register_all(items: list[dict], refine_gemini: bool = True) -> tuple[int, int]:
    succeeded = 0
    failed = 0
    for i in range(0, len(items), BATCH_SIZE):
        batch = items[i : i + BATCH_SIZE]
        print(f"\n[등록 배치 {i // BATCH_SIZE + 1}] {len(batch)}건 전송...")
        try:
            result = register_batch(batch, refine_gemini)
            rows = result.get("results", [result])
            for r in rows:
                if r.get("ok"):
                    succeeded += 1
                    print(f"  ✓ {r.get('name')} → {r.get('url')}")
                else:
                    failed += 1
                    print(f"  ✗ {r.get('name')}: {r.get('error')}")
        except requests.RequestException as e:
            failed += len(batch)
            print(f"  배치 실패: {e}")
        time.sleep(DELAY_SEC)
    return succeeded, failed
