#!/usr/bin/env python3
"""
네이버 플레이스 수집 데이터 → YourDogZone 대량 등록 API 전송

사전 준비:
  pip install requests python-dotenv

환경 변수 (.env):
  YOURDOGZONE_API_URL=https://www.yourdogzone.co.kr
  ACADEMY_ADMIN_SECRET=your-secret
  GEMINI_API_KEY=...  # API 서버(Vercel)에 설정, 파이썬에서는 불필요

사용:
  python register_via_api.py --json academies.json
  python register_via_api.py --json academies.json --gemini
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv("YOURDOGZONE_API_URL", "https://www.yourdogzone.co.kr").rstrip("/")
ADMIN_SECRET = os.getenv("ACADEMY_ADMIN_SECRET", "")
BATCH_SIZE = 5
DELAY_SEC = 2


def post_batch(items: list[dict], refine_gemini: bool) -> dict:
    headers = {
        "Content-Type": "application/json",
        "x-admin-secret": ADMIN_SECRET,
    }
    payload = {
        "refine_with_gemini": refine_gemini,
        "items": items,
    }
    res = requests.post(
        f"{API_URL}/api/admin/bulk-register",
        headers=headers,
        json=payload,
        timeout=120,
    )
    res.raise_for_status()
    return res.json()


def chunks(lst: list, n: int):
    for i in range(0, len(lst), n):
        yield lst[i : i + n]


def main() -> int:
    parser = argparse.ArgumentParser(description="YourDogZone 학원 대량 등록")
    parser.add_argument("--json", required=True, help="학원 JSON 파일 경로")
    parser.add_argument("--gemini", action="store_true", help="서버 Gemini 재가공 사용")
    parser.add_argument("--dry-run", action="store_true", help="전송 없이 건수만 확인")
    args = parser.parse_args()

    if not ADMIN_SECRET:
        print("ACADEMY_ADMIN_SECRET 환경 변수를 설정하세요.", file=sys.stderr)
        return 1

    path = Path(args.json)
    data = json.loads(path.read_text(encoding="utf-8"))
    items = data if isinstance(data, list) else data.get("items") or data.get("academies") or []

    if not items:
        print("등록할 항목이 없습니다.", file=sys.stderr)
        return 1

    print(f"총 {len(items)}건, 배치 크기 {BATCH_SIZE}")
    if args.dry_run:
        return 0

    succeeded = 0
    failed = 0

    for i, batch in enumerate(chunks(items, BATCH_SIZE), start=1):
        print(f"\n[배치 {i}] {len(batch)}건 전송 중...")
        try:
            result = post_batch(batch, args.gemini)
            if "results" in result:
                for r in result["results"]:
                    if r.get("ok"):
                        succeeded += 1
                        print(f"  ✓ {r.get('name')} → {r.get('url')}")
                    else:
                        failed += 1
                        print(f"  ✗ {r.get('name')}: {r.get('error')}")
            else:
                if result.get("ok"):
                    succeeded += 1
                    print(f"  ✓ {result.get('name')} → {result.get('url')}")
                else:
                    failed += 1
                    print(f"  ✗ {result.get('name')}: {result.get('error')}")
        except requests.RequestException as e:
            failed += len(batch)
            print(f"  배치 실패: {e}", file=sys.stderr)

        time.sleep(DELAY_SEC)

    print(f"\n완료: 성공 {succeeded}, 실패 {failed}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
