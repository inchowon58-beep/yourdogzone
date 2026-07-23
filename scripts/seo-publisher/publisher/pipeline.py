from __future__ import annotations

from pathlib import Path
from typing import Callable

from publisher.api_client import publish_pages
from publisher.cdn_images import image_pool_info
from publisher.config import Config
from publisher.slug import parse_keywords
from publisher.templates import build_pages_for_keywords
from publisher.webdoc import run_webdoc_submit

LogFn = Callable[[str], None] | None


def run_pipeline(
    *,
    cfg: Config,
    category: str,
    keyword_text: str = "",
    keywords_file: Path | None = None,
    count: int | None = None,
    image_cdn: str = "",
    image_max: int = 0,
    image_ext: str = "webp",
    do_publish: bool = True,
    do_indexnow: bool = True,
    do_webdoc: bool = False,
    webdoc_limit: int = 50,
    on_log: LogFn = None,
) -> dict:
    def log(msg: str) -> None:
        if on_log:
            on_log(msg)

    if keywords_file:
        text = keywords_file.read_text(encoding="utf-8-sig")
    else:
        text = keyword_text
    keywords = parse_keywords(text, count)
    if not keywords:
        raise RuntimeError("키워드가 없습니다.")

    cdn = (image_cdn or cfg.image_cdn or "").strip()
    try:
        max_num = int(image_max or cfg.image_max or 0)
    except (TypeError, ValueError):
        max_num = 0
    ext = (image_ext or cfg.image_ext or "webp").strip() or "webp"
    info = image_pool_info(cdn, max_num, ext)
    if info["mode"] == "cdn_random":
        log(
            f"이미지 CDN: {info['cdnBase']} · {info['range']}.{ext} 중 페이지별 랜덤"
        )
    else:
        log("이미지: 미설정 (폴더 URL + 최대번호 입력 시 적용)")

    log(f"키워드 {len(keywords)}건 · 카테고리={category} · 템플릿 생성(Gemini 없음)")
    pages = build_pages_for_keywords(
        keywords,
        category,
        image_cdn=cdn,
        image_max=max_num,
        image_ext=ext,
    )
    log(f"페이지 초안 {len(pages)}건 생성 완료")

    urls: list[str] = []
    result: dict = {
        "category": category,
        "generated": len(pages),
        "pages": pages,
        "urls": [],
        "errors": [],
        "publish": None,
        "webdoc": None,
        "image_info": info,
    }

    if do_publish:
        pub = publish_pages(
            cfg,
            pages,
            submit_indexnow=do_indexnow,
            on_log=log,
        )
        result["publish"] = pub
        result["urls"] = pub.get("urls") or []
        result["errors"] = pub.get("errors") or []
        urls = result["urls"]
        log(f"사이트 발행 완료: {pub.get('count')}건")
    else:
        from publisher.api_client import page_url

        urls = [page_url(cfg, category, p["slug"]) for p in pages]
        result["urls"] = urls
        log("생성만 수행 (API 발행 생략)")

    if do_webdoc:
        if not urls:
            raise RuntimeError("웹문서 등록할 URL이 없습니다. 먼저 발행하세요.")
        log(f"웹문서 등록 진행 (최대 {webdoc_limit}건)…")
        result["webdoc"] = run_webdoc_submit(
            webdoc_dir=cfg.webdoc_dir,
            site_url=cfg.naver_site or cfg.site_url,
            urls=urls,
            limit=webdoc_limit,
            naver_id=cfg.naver_id,
            naver_password=cfg.naver_password,
            twocaptcha_api_key=cfg.twocaptcha_api_key,
            settings_file=cfg.tool_root / "gui_settings.json",
            on_log=log,
        )
        log(
            "웹문서 등록 결과: "
            f"성공 {result['webdoc'].get('success')} / "
            f"실패 {result['webdoc'].get('fail')}"
        )

    # URL 목록 저장
    out_dir = cfg.tool_root / "output"
    out_dir.mkdir(parents=True, exist_ok=True)
    urls_file = out_dir / f"last_urls_{category}.txt"
    urls_file.write_text("\n".join(urls) + ("\n" if urls else ""), encoding="utf-8")
    result["urls_file"] = str(urls_file)
    return result
