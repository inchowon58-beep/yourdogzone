"""CLI — 지역 SEO 템플릿 대량 발행

  python publish.py --category shelter --keywords keywords.txt
  python publish.py --category shelter --keywords keywords.txt --no-publish
  python publish.py --category shelter --keywords keywords.txt --webdoc
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

for p in (
    ROOT / ".env",
    ROOT.parent.parent / ".env.local",
    ROOT.parent.parent / ".env",
    ROOT.parent / "naver-place-bulk" / ".env",
):
    if p.exists():
        load_dotenv(p, override=False, encoding="utf-8-sig")

from publisher.config import load_config  # noqa: E402
from publisher.pipeline import run_pipeline  # noqa: E402
from publisher.slug import CATEGORY_META  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="유아독존 지역 SEO 대량 발행")
    parser.add_argument(
        "--category",
        default="shelter",
        choices=list(CATEGORY_META.keys()),
        help="지역 SEO 카테고리 (기본: shelter)",
    )
    parser.add_argument("--keywords", required=True, help="키워드 txt")
    parser.add_argument("--count", type=int, default=None)
    parser.add_argument(
        "--image-cdn",
        default=None,
        help="이미지 폴더 URL (예: https://image.cattery.co.kr/dogboho/)",
    )
    parser.add_argument(
        "--image-max",
        type=int,
        default=None,
        help="최대 번호 (79 → 01~79 랜덤)",
    )
    parser.add_argument("--image-ext", default=None, help="확장자 (기본 webp)")
    parser.add_argument("--no-publish", action="store_true", help="API 발행 생략")
    parser.add_argument("--no-indexnow", action="store_true")
    parser.add_argument(
        "--webdoc",
        action="store_true",
        help="발행 후 네이버 웹문서 등록(최대 50)",
    )
    parser.add_argument("--webdoc-limit", type=int, default=50)
    args = parser.parse_args()

    cfg = load_config()
    result = run_pipeline(
        cfg=cfg,
        category=args.category,
        keywords_file=Path(args.keywords),
        count=args.count,
        image_cdn=args.image_cdn or cfg.image_cdn,
        image_max=args.image_max if args.image_max is not None else cfg.image_max,
        image_ext=args.image_ext or cfg.image_ext,
        do_publish=not args.no_publish,
        do_indexnow=not args.no_indexnow,
        do_webdoc=args.webdoc,
        webdoc_limit=args.webdoc_limit,
        on_log=print,
    )
    print(f"[ok] generated={result['generated']} urls={len(result.get('urls') or [])}")
    print(f"[ok] urls_file={result.get('urls_file')}")
    for u in (result.get("urls") or [])[:20]:
        print(f"  {u}")
    if len(result.get("urls") or []) > 20:
        print(f"  … 외 {len(result['urls']) - 20}건")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
