"""등록된 URL을 네이버 서치어드바이저 웹페이지 수집 요청으로 제출."""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Callable

from naver_searchadvisor import (
    NaverSubmitOptions,
    get_today_submit_count,
    submit_crawl_urls,
)

SCRIPT_DIR = Path(__file__).parent

if TYPE_CHECKING:
    from pipeline import PipelineSettings

LogFn = Callable[[str], None]
LoginConfirmedFn = Callable[[], bool]
LoginReadyFn = Callable[[], None]


def _resolve_site_url(settings: "PipelineSettings") -> str:
    site = (settings.naver_site_url or settings.api_url or "").strip()
    if not site:
        raise ValueError("서치어드바이저 사이트 URL 또는 사이트 URL을 입력하세요.")
    return site.rstrip("/")


def submit_urls_to_searchadvisor(
    urls: list[str],
    settings: "PipelineSettings",
    log: LogFn,
    *,
    existing_driver=None,
    login_confirmed: LoginConfirmedFn | None = None,
    on_ready_for_login: LoginReadyFn | None = None,
    stop_event=None,
) -> tuple[int, int]:
    """등록 성공 URL만 서치어드바이저 수집 요청. (성공, 실패) 반환."""
    clean = list(dict.fromkeys(u.strip() for u in urls if u and u.startswith("http")))
    if not clean:
        return 0, 0
    if not settings.naver_submit_enabled:
        return 0, 0

    site = _resolve_site_url(settings)
    log_path = SCRIPT_DIR / "naver_submit_log.json"
    daily = max(1, min(50, int(settings.naver_daily_limit or 50)))
    already = get_today_submit_count(log_path)
    remaining = max(0, daily - already)

    log("\n⑤ 네이버 서치어드바이저 웹페이지 수집 요청")
    log(f"  사이트: {site} | 오늘 {already}/{daily}건 사용 | 이번 대상 {len(clean)}건")

    if remaining <= 0:
        log(f"  ⚠ 오늘 일일 한도({daily}건)를 모두 사용했습니다. 내일 다시 시도하세요.")
        return 0, len(clean)

    opts = NaverSubmitOptions(
        site_url=site,
        daily_limit=daily,
        delay_min_sec=10.0,
        delay_max_sec=15.0,
        submit_log_path=log_path,
    )

    def stop_requested() -> bool:
        return bool(stop_event and stop_event.is_set())

    report = submit_crawl_urls(
        clean,
        opts,
        on_log=log,
        login_confirmed=login_confirmed,
        on_ready_for_login=on_ready_for_login,
        stop_requested=stop_requested if stop_event else None,
        keep_browser_open=False,
        existing_driver=existing_driver,
    )

    ok = report.success_count
    fail = report.fail_count + len(report.skipped)
    if report.skipped:
        log(f"  ⊘ 일일 한도로 스킵: {len(report.skipped)}건")
    log(f"  수집 요청 결과: 성공 {ok} | 실패 {fail}")
    return ok, fail
