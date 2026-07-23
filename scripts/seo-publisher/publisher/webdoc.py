"""네이버 서치어드바이저 웹문서 등록 — VM웹문서자동등록 모듈 재사용."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Callable

LogFn = Callable[[str], None] | None


def run_webdoc_submit(
    *,
    webdoc_dir: Path,
    site_url: str,
    urls: list[str],
    limit: int = 50,
    naver_id: str = "",
    naver_password: str = "",
    twocaptcha_api_key: str = "",
    settings_file: Path | None = None,
    on_log: LogFn = None,
) -> dict:
    def log(msg: str) -> None:
        if on_log:
            on_log(msg)

    if not webdoc_dir.is_dir():
        raise RuntimeError(f"웹문서 등록 폴더가 없습니다: {webdoc_dir}")

    batch = [u.strip() for u in urls if u.strip()][: max(0, limit)]
    if not batch:
        raise RuntimeError("등록할 URL이 없습니다.")

    settings: dict = {}
    for path in (
        settings_file,
        webdoc_dir / "gui_settings.json",
    ):
        if path and path.exists():
            try:
                settings = json.loads(path.read_text(encoding="utf-8-sig"))
                break
            except Exception:
                continue

    naver_id = (naver_id or settings.get("naver_id") or "").strip()
    naver_pw = (naver_password or settings.get("naver_password") or "").strip()
    twocaptcha = (
        twocaptcha_api_key or settings.get("twocaptcha_api_key") or ""
    ).strip()
    site = (
        site_url or settings.get("naver_site") or ""
    ).strip()
    if not site:
        raise RuntimeError("웹문서 등록용 사이트 URL이 필요합니다.")
    if not naver_id or not naver_pw:
        raise RuntimeError(
            "네이버 아이디/비밀번호를 입력하세요. "
            "(GUI 웹문서 로그인 칸 또는 gui_settings.json)"
        )

    daily_limit = int(settings.get("daily_limit") or limit)
    limit = min(limit, daily_limit, 50)
    batch = batch[:limit]
    log(f"웹문서 등록 시작: {len(batch)}건 (사이트: {site})")

    sys.path.insert(0, str(webdoc_dir.resolve()))
    # exe 환경에서도 VM 폴더의 보조 모듈(naver_captcha 등)을 찾을 수 있게
    try:
        import requests  # noqa: F401
    except ImportError as e:
        raise RuntimeError(
            "requests 패키지가 없습니다. "
            "scripts\\seo-publisher 에서 pip install -r requirements.txt 후 "
            "exe를 다시 빌드하거나, python으로 app_gui.py 를 실행하세요.\n"
            f"상세: {e}"
        ) from e

    try:
        from naver_searchadvisor import (  # type: ignore
            LoginTypingOptions,
            NaverSubmitOptions,
            submit_crawl_urls,
        )
    except ImportError as e:
        raise RuntimeError(
            f"VM웹문서자동등록 모듈을 불러오지 못했습니다: {e}\n"
            f"1) {webdoc_dir}\\requirements.txt 설치\n"
            f"2) SEO 프로그램 requirements.txt 설치 후 exe 재빌드"
        ) from e

    typing = LoginTypingOptions(
        id_min_delay=float(settings.get("type_id_min") or 0.1),
        id_max_delay=float(settings.get("type_id_max") or 0.28),
        pw_min_delay=float(settings.get("type_pw_min") or 0.08),
        pw_max_delay=float(settings.get("type_pw_max") or 0.22),
        page_wait_sec=float(settings.get("page_wait") or 60),
    )
    options = NaverSubmitOptions(
        site_url=site,
        daily_limit=limit,
        delay_min_sec=float(settings.get("delay_min") or 3),
        delay_max_sec=float(settings.get("delay_max") or 8),
        submit_log_path=webdoc_dir / "naver_submit_log.json",
        typing=typing,
    )

    report = submit_crawl_urls(
        batch,
        options,
        on_log=log,
        naver_id=naver_id,
        naver_password=naver_pw,
        twocaptcha_api_key=twocaptcha,
        typing=typing,
        keep_browser_open=False,
    )

    return {
        "requested": len(batch),
        "success": report.success_count,
        "fail": report.fail_count,
        "skipped": list(report.skipped or []),
    }
