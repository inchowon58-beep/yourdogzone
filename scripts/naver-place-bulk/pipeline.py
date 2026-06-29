"""수집·등록 파이프라인 (CLI / GUI 공용)"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Callable

from api_client import register_all
from naver_crawler import NaverPlaceCrawler, PlaceData

SCRIPT_DIR = Path(__file__).parent
LogFn = Callable[[str], None]


@dataclass
class PipelineSettings:
    api_url: str = "https://www.yourdogzone.co.kr"
    admin_secret: str = ""
    searches: list[dict] = field(default_factory=list)
    max_per_search: int = 3
    delay_seconds: float = 2.0
    refine_with_gemini: bool = True
    headless: bool = True

    def apply_env(self) -> None:
        os.environ["YOURDOGZONE_API_URL"] = self.api_url.rstrip("/")
        os.environ["ACADEMY_ADMIN_SECRET"] = self.admin_secret

    def to_config_dict(self) -> dict:
        return {
            "searches": self.searches,
            "delay_seconds": self.delay_seconds,
            "refine_with_gemini": self.refine_with_gemini,
        }


def parse_search_lines(text: str, default_max: int) -> list[dict]:
    searches: list[dict] = []
    for line in text.strip().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "|" in line:
            query, max_str = line.rsplit("|", 1)
            query = query.strip()
            try:
                max_n = int(max_str.strip())
            except ValueError:
                max_n = default_max
        else:
            query = line
            max_n = default_max
        searches.append({"query": query, "max": max_n})
    return searches


def load_settings_from_files(script_dir: Path | None = None) -> PipelineSettings:
    base = script_dir or SCRIPT_DIR
    settings = PipelineSettings()

    env_path = base / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            key, val = key.strip(), val.strip()
            if key == "YOURDOGZONE_API_URL":
                settings.api_url = val
            elif key == "ACADEMY_ADMIN_SECRET":
                settings.admin_secret = val

    config_path = base / "config.json"
    if config_path.exists():
        data = json.loads(config_path.read_text(encoding="utf-8"))
        settings.searches = data.get("searches", [])
        settings.delay_seconds = float(data.get("delay_seconds", 2))
        settings.refine_with_gemini = bool(data.get("refine_with_gemini", True))
        if settings.searches:
            settings.max_per_search = int(settings.searches[0].get("max", 3))

    return settings


def save_settings(settings: PipelineSettings, script_dir: Path | None = None) -> None:
    base = script_dir or SCRIPT_DIR
    (base / ".env").write_text(
        f"YOURDOGZONE_API_URL={settings.api_url.rstrip('/')}\n"
        f"ACADEMY_ADMIN_SECRET={settings.admin_secret}\n",
        encoding="utf-8",
    )
    (base / "config.json").write_text(
        json.dumps(settings.to_config_dict(), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _fetch_registered_names(log: LogFn) -> set[str]:
    from api_client import fetch_registered_names

    return fetch_registered_names(log)


def crawl_places(settings: PipelineSettings, log: LogFn) -> list[PlaceData]:
    if not settings.searches:
        raise ValueError("검색어를 1개 이상 입력하세요.")

    log("=" * 48)
    log("네이버 지도 수집 시작")
    log("=" * 48)

    import sys

    class _LogWriter:
        def __init__(self, fn: LogFn):
            self.fn = fn

        def write(self, s: str) -> None:
            if s and s.strip():
                self.fn(s.rstrip())

        def flush(self) -> None:
            pass

    old_stdout = sys.stdout
    sys.stdout = _LogWriter(log)  # type: ignore[assignment]
    crawler = NaverPlaceCrawler(
        headless=settings.headless,
        delay=settings.delay_seconds,
    )
    try:
        places = crawler.crawl_many(
            settings.searches,
            default_max=settings.max_per_search,
        )
    finally:
        sys.stdout = old_stdout
        crawler.close()

    log(f"\n수집 완료: {len(places)}곳")
    return places


def save_places_json(places: list[PlaceData], log: LogFn) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = SCRIPT_DIR / f"crawled_{timestamp}.json"
    payload = [p.to_api_payload() for p in places]
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    log(f"저장: {path.name}")
    return path


def register_places(
    places: list[PlaceData],
    settings: PipelineSettings,
    log: LogFn,
    *,
    skip_existing: bool = True,
) -> tuple[int, int]:
    if not settings.admin_secret:
        raise ValueError("관리자 비밀키(ACADEMY_ADMIN_SECRET)를 입력하세요.")

    settings.apply_env()

    targets = places
    if skip_existing:
        existing = _fetch_registered_names(log)
        targets = [p for p in places if p.name.strip() not in existing]
        skipped = len(places) - len(targets)
        if skipped:
            log(f"이미 등록된 학원 {skipped}곳 건너뜀")

    if not targets:
        log("등록할 새 학원이 없습니다.")
        return 0, 0

    log(f"\n등록 시작 ({len(targets)}건, Gemini={'ON' if settings.refine_with_gemini else 'OFF'})")
    items = [p.to_api_payload() for p in targets]
    ok, fail = register_all(items, refine_gemini=settings.refine_with_gemini, log=log)
    log(f"\n등록 결과: 성공 {ok} | 실패 {fail}")
    log(f"확인: {settings.api_url.rstrip('/')}/services/academy")
    return ok, fail


def register_from_json(path: Path, settings: PipelineSettings, log: LogFn) -> tuple[int, int]:
    data = json.loads(path.read_text(encoding="utf-8"))
    items = data if isinstance(data, list) else data.get("items", [])
    places = [
        PlaceData(
            name=i["name"],
            address=i["address"],
            phone=i.get("phone") or "",
            description=i.get("description") or "",
            image_urls=i.get("image_urls") or [],
            naver_place_url=i.get("naver_place_url") or "",
        )
        for i in items
        if i.get("name") and i.get("address")
    ]
    log(f"JSON에서 {len(places)}건 로드: {path.name}")
    return register_places(places, settings, log)


def run_collect(settings: PipelineSettings, log: LogFn) -> Path | None:
    settings.apply_env()
    places = crawl_places(settings, log)
    if not places:
        log("수집된 학원이 없습니다.")
        return None
    return save_places_json(places, log)


def run_collect_and_register(settings: PipelineSettings, log: LogFn) -> bool:
    settings.apply_env()
    places = crawl_places(settings, log)
    if not places:
        log("수집된 학원이 없습니다.")
        return False
    save_places_json(places, log)
    ok, fail = register_places(places, settings, log)
    return fail == 0 and ok > 0


def list_crawled_files() -> list[Path]:
    return sorted(SCRIPT_DIR.glob("crawled_*.json"), reverse=True)
