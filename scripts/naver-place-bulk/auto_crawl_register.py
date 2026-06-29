#!/usr/bin/env python3
"""
네이버 지도 검색 → 플레이스 수집 → YourDogZone 자동 등록 (Gemini 재가공 포함)

사용:
  python auto_crawl_register.py
  python auto_crawl_register.py --query "부천 애견미용학원" --max 3
  python auto_crawl_register.py --config config.json --dry-run
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

from api_client import ADMIN_SECRET, fetch_registered_names, register_all
from naver_crawler import NaverPlaceCrawler

load_dotenv()

SCRIPT_DIR = Path(__file__).parent
DEFAULT_CONFIG = SCRIPT_DIR / "config.json"


def load_config(path: Path) -> dict:
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    example = SCRIPT_DIR / "config.example.json"
    if example.exists():
        data = json.loads(example.read_text(encoding="utf-8"))
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"config.json 이 없어 {path} 를 생성했습니다. 검색어를 수정하세요.")
    return data


def save_crawled(places: list, path: Path) -> None:
    payload = [p.to_api_payload() if hasattr(p, "to_api_payload") else p for p in places]
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"수집 결과 저장: {path}")


def main() -> int:
    parser = argparse.ArgumentParser(description="네이버 플레이스 자동 수집·등록")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG), help="설정 JSON 경로")
    parser.add_argument("--query", help="단일 검색어 (config 대신 사용)")
    parser.add_argument("--max", type=int, default=5, help="검색당 최대 수집 수")
    parser.add_argument("--dry-run", action="store_true", help="수집만 하고 등록 안 함")
    parser.add_argument("--no-gemini", action="store_true", help="Gemini 재가공 끄기")
    parser.add_argument("--show-browser", action="store_true", help="브라우저 창 표시")
    args = parser.parse_args()

    if not args.dry_run and not ADMIN_SECRET:
        print("오류: .env 에 ACADEMY_ADMIN_SECRET 을 설정하세요.", file=sys.stderr)
        return 1

    config = load_config(Path(args.config))

    if args.query:
        searches = [{"query": args.query, "max": args.max}]
    else:
        searches = config.get("searches", [])
        if not searches:
            print("config.json 의 searches 배열에 검색어를 넣으세요.", file=sys.stderr)
            return 1

    delay = float(config.get("delay_seconds", 2))
    refine_gemini = not args.no_gemini and config.get("refine_with_gemini", True)
    headless = not args.show_browser

    print("=" * 50)
    print("네이버 플레이스 자동 수집 시작")
    print("=" * 50)

    crawler = NaverPlaceCrawler(headless=headless, delay=delay)
    try:
        places = crawler.crawl_many(searches, default_max=args.max)
    finally:
        crawler.close()

    if not places:
        print("\n수집된 학원이 없습니다. 검색어를 바꿔 보세요.")
        return 1

    existing = fetch_registered_names()
    new_places = [p for p in places if p.name.strip() not in existing]
    skipped = len(places) - len(new_places)

    if skipped:
        print(f"\n이미 등록된 학원 {skipped}곳 건너뜀")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_path = SCRIPT_DIR / f"crawled_{timestamp}.json"
    save_crawled(new_places if new_places else places, out_path)

    if not new_places:
        print("등록할 새 학원이 없습니다.")
        return 0

    if args.dry_run:
        print(f"\n[dry-run] {len(new_places)}건 수집 완료. 등록은 생략.")
        return 0

    print(f"\n등록 시작 ({len(new_places)}건, Gemini={'ON' if refine_gemini else 'OFF'})...")
    items = [p.to_api_payload() for p in new_places]
    ok, fail = register_all(items, refine_gemini=refine_gemini)

    print(f"\n{'=' * 50}")
    print(f"완료: 수집 {len(places)} | 등록 성공 {ok} | 실패 {fail}")
    print(f"확인: https://www.yourdogzone.co.kr/services/academy")
    print("=" * 50)
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
