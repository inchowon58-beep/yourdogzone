"""수집·등록 파이프라인 (CLI / GUI 공용)"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field, replace
from datetime import datetime
from pathlib import Path
from typing import Callable

from api_client import register_all
from master_registry import (
    get_known_place_ids,
    get_pending_items,
    get_registered_place_keys,
    item_to_place_payload,
    mark_items_registered,
    master_stats,
    merge_items_into_master,
    place_key,
    sync_master_from_server,
)
from naver_crawler import NaverPlaceCrawler, PlaceData

SCRIPT_DIR = Path(__file__).parent
LogFn = Callable[[str], None]

LISTING_CATEGORIES: dict[str, dict[str, str]] = {
    "academy": {
        "label": "애견미용학원",
        "search_hint": "애견미용학원",
        "default_suffix": "반려견 미용 추천",
    },
    "adoption": {
        "label": "강아지분양",
        "search_hint": "강아지분양",
        "default_suffix": "강아지분양",
    },
    "shelter": {
        "label": "강아지보호소",
        "search_hint": "강아지보호소",
        "default_suffix": "강아지보호소",
    },
    "funeral": {
        "label": "강아지장례식장",
        "search_hint": "강아지장례",
        "default_suffix": "강아지장례",
    },
    "breeder": {
        "label": "브리더정보",
        "search_hint": "애견브리더",
        "default_suffix": "브리더",
    },
    "hospital": {
        "label": "동물병원",
        "search_hint": "동물병원",
        "default_suffix": "동물병원",
    },
}


def category_label(category: str) -> str:
    return LISTING_CATEGORIES.get(category, {}).get("label", category)


def format_category_option(category: str) -> str:
    return f"{category_label(category)} ({category})"


def parse_category_option(text: str) -> str:
    text = text.strip()
    if text in LISTING_CATEGORIES:
        return text
    if "(" in text and text.endswith(")"):
        key = text.rsplit("(", 1)[-1].rstrip(")")
        if key in LISTING_CATEGORIES:
            return key
    return "academy"


@dataclass
class PipelineSettings:
    api_url: str = "https://www.yourdogzone.co.kr"
    admin_secret: str = ""
    gemini_api_key: str = ""
    seo_title_suffix: str = ""
    category: str = "academy"
    searches: list[dict] = field(default_factory=list)
    max_per_search: int = 3
    delay_seconds: float = 2.0
    refine_with_gemini: bool = True
    use_chrome_profile: bool = True

    def apply_env(self) -> None:
        os.environ["YOURDOGZONE_API_URL"] = self.api_url.rstrip("/")
        os.environ["ACADEMY_ADMIN_SECRET"] = self.admin_secret
        if self.gemini_api_key:
            os.environ["GEMINI_API_KEY"] = self.gemini_api_key

    def to_config_dict(self) -> dict:
        return {
            "category": self.category,
            "searches": self.searches,
            "delay_seconds": self.delay_seconds,
            "refine_with_gemini": self.refine_with_gemini,
            "use_chrome_profile": self.use_chrome_profile,
            "seo_title_suffix": self.seo_title_suffix,
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
            elif key == "GEMINI_API_KEY":
                settings.gemini_api_key = val

    config_path = base / "config.json"
    if config_path.exists():
        data = json.loads(config_path.read_text(encoding="utf-8"))
        settings.searches = data.get("searches", [])
        settings.delay_seconds = float(data.get("delay_seconds", 2))
        settings.refine_with_gemini = bool(data.get("refine_with_gemini", True))
        settings.use_chrome_profile = bool(data.get("use_chrome_profile", True))
        settings.seo_title_suffix = str(data.get("seo_title_suffix", "") or "")
        settings.category = str(data.get("category", "academy") or "academy")
        if settings.searches:
            settings.max_per_search = int(settings.searches[0].get("max", 3))

    return settings


def save_settings(settings: PipelineSettings, script_dir: Path | None = None) -> None:
    base = script_dir or SCRIPT_DIR
    (base / ".env").write_text(
        f"YOURDOGZONE_API_URL={settings.api_url.rstrip('/')}\n"
        f"ACADEMY_ADMIN_SECRET={settings.admin_secret}\n"
        f"GEMINI_API_KEY={settings.gemini_api_key}\n",
        encoding="utf-8",
    )
    (base / "config.json").write_text(
        json.dumps(settings.to_config_dict(), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _log_master_stats(category: str, log: LogFn) -> None:
    stats = master_stats(category)
    if stats["total"] == 0:
        return
    log(
        f"  마스터 목록: 총 {stats['total']}곳 | "
        f"등록완료 {stats['registered']} | 미등록 {stats['pending']}"
    )


def _merge_places_to_master(
    places: list[PlaceData],
    category: str,
    log: LogFn,
    *,
    source: str = "crawl",
) -> tuple[int, int, int]:
    payloads = [p.to_api_payload() for p in places]
    added, dup, total = merge_items_into_master(category, payloads, source=source)
    log(
        f"\n마스터 병합 ({category_label(category)}): "
        f"신규 {added} | 중복 {dup} | 마스터 총 {total}곳"
    )
    _log_master_stats(category, log)
    return added, dup, total


def _filter_for_register(
    items: list[dict],
    category: str,
    site_index,
    log: LogFn,
) -> list[dict]:
    registered_keys = get_registered_place_keys(category)
    targets: list[dict] = []
    skip_name = 0
    skip_master = 0
    skip_site_key = 0

    for item in items:
        name = str(item.get("name") or "").strip()
        key = place_key(item)
        if name and name in site_index.names:
            skip_name += 1
            continue
        if key and key in site_index.place_keys:
            skip_site_key += 1
            continue
        if key and key in registered_keys:
            skip_master += 1
            continue
        targets.append(item)

    if skip_name:
        log(f"사이트 중복(업체명) {skip_name}곳 건너뜀")
    if skip_site_key:
        log(f"사이트 중복(place_id/주소) {skip_site_key}곳 건너뜀")
    if skip_master:
        log(f"이미 등록 완료 {skip_master}곳 건너뜀")
    return targets


def _sync_server_to_master(category: str, log: LogFn) -> None:
    from api_client import fetch_registered_index

    index = fetch_registered_index(category, log)
    if not index.names:
        return
    marked = sync_master_from_server(
        category,
        names=index.names,
        name_address_pairs=index.name_address_pairs,
    )
    if marked:
        log(f"사이트와 마스터 동기화: {marked}곳 등록완료 처리")
    _log_master_stats(category, log)


def _fetch_registered_names(category: str, log: LogFn) -> set[str]:
    from api_client import fetch_registered_names

    return fetch_registered_names(category, log)


def crawl_places(
    settings: PipelineSettings,
    log: LogFn,
    on_browser_ready: Callable[[str], None] | None = None,
) -> list[PlaceData]:
    if not settings.searches:
        raise ValueError("검색어를 1개 이상 입력하세요.")

    log("=" * 48)
    log("네이버 지도 수집 시작")
    log("=" * 48)
    _log_master_stats(settings.category, log)

    known_ids = get_known_place_ids(settings.category)
    crawler = NaverPlaceCrawler(
        delay=settings.delay_seconds,
        use_profile=settings.use_chrome_profile,
        log=log,
        on_user_ready=on_browser_ready,
    )
    try:
        places = crawler.crawl_many(
            settings.searches,
            default_max=settings.max_per_search,
            skip_place_ids=known_ids,
        )
    finally:
        crawler.close()

    log(f"\n수집 완료: {len(places)}곳")
    return places


def save_places_json(
    places: list[PlaceData],
    log: LogFn,
    *,
    category: str = "academy",
) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = SCRIPT_DIR / f"crawled_{category}_{timestamp}.json"
    payload = {
        "category": category,
        "items": [p.to_api_payload() for p in places],
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    log(f"저장: {path.name} ({category_label(category)})")
    return path


def _register_item_dicts(
    items: list[dict],
    settings: PipelineSettings,
    log: LogFn,
    *,
    skip_existing: bool = True,
) -> tuple[int, int]:
    if not settings.admin_secret:
        raise ValueError("관리자 비밀키(ACADEMY_ADMIN_SECRET)를 입력하세요.")

    settings.apply_env()

    _sync_server_to_master(settings.category, log)

    targets = items
    if skip_existing:
        from api_client import fetch_registered_index

        site_index = fetch_registered_index(settings.category, log)
        targets = _filter_for_register(items, settings.category, site_index, log)

    if not targets:
        log(f"등록할 새 {category_label(settings.category)} 항목이 없습니다.")
        return 0, 0

    log(
        f"\n등록 시작 — {category_label(settings.category)} ({settings.category}), "
        f"{len(targets)}건, Gemini 로컬={'ON' if settings.refine_with_gemini else 'OFF'})"
    )
    if settings.seo_title_suffix.strip():
        log(f"  타이틀 추가 문구: {settings.seo_title_suffix.strip()}")

    ok, fail, successes = register_all(
        targets,
        refine_gemini=settings.refine_with_gemini,
        seo_title_suffix=settings.seo_title_suffix.strip(),
        category=settings.category,
        log=log,
    )
    if successes:
        marked = mark_items_registered(settings.category, successes)
        log(f"마스터 등록 완료 표시: {marked}건")

    log(f"\n등록 결과: 성공 {ok} | 실패 {fail}")
    _log_master_stats(settings.category, log)
    service_path = (
        "/services/academy"
        if settings.category == "academy"
        else f"/services/{settings.category}"
    )
    log(f"확인: {settings.api_url.rstrip('/')}{service_path}")
    return ok, fail


def register_places(
    places: list[PlaceData],
    settings: PipelineSettings,
    log: LogFn,
    *,
    skip_existing: bool = True,
) -> tuple[int, int]:
    items = [p.to_api_payload() for p in places]
    return _register_item_dicts(items, settings, log, skip_existing=skip_existing)


def register_from_json(path: Path, settings: PipelineSettings, log: LogFn) -> tuple[int, int]:
    data = json.loads(path.read_text(encoding="utf-8"))
    category = settings.category
    if isinstance(data, dict):
        category = str(data.get("category") or settings.category)
        items = data.get("items", [])
    else:
        items = data

    valid = [i for i in items if i.get("name") and i.get("address")]
    log(f"JSON에서 {len(valid)}건 로드: {path.name} ({category_label(category)})")

    added, dup, total = merge_items_into_master(
        category, valid, source=path.name
    )
    log(f"마스터 병합: 신규 {added} | 중복 {dup} | 마스터 총 {total}곳")

    return register_master_pending(replace(settings, category=category), log)


def register_master_pending(
    settings: PipelineSettings,
    log: LogFn,
) -> tuple[int, int]:
    """마스터 JSON에서 미등록 항목만 사이트에 등록."""
    pending = [item_to_place_payload(i) for i in get_pending_items(settings.category)]
    log(
        f"마스터 미등록 항목: {len(pending)}곳 ({category_label(settings.category)})"
    )
    if not pending:
        log("등록할 미등록 항목이 없습니다.")
        return 0, 0
    return _register_item_dicts(pending, settings, log)


def run_collect(
    settings: PipelineSettings,
    log: LogFn,
    on_browser_ready: Callable[[str], None] | None = None,
) -> Path | None:
    settings.apply_env()
    places = crawl_places(settings, log, on_browser_ready=on_browser_ready)
    if not places:
        log(f"수집된 {category_label(settings.category)} 항목이 없습니다.")
        return None
    path = save_places_json(places, log, category=settings.category)
    _merge_places_to_master(places, settings.category, log)
    return path


def run_collect_and_register(
    settings: PipelineSettings,
    log: LogFn,
    on_browser_ready: Callable[[str], None] | None = None,
) -> bool:
    """수집 → 마스터 병합 → 중복 제거 후 미등록 신규만 사이트 등록."""
    settings.apply_env()
    places = crawl_places(settings, log, on_browser_ready=on_browser_ready)

    if places:
        save_places_json(places, log, category=settings.category)
        _merge_places_to_master(places, settings.category, log)
        log(f"\n③ 이번 수집: {len(places)}곳 (마스터에 반영됨)")
    else:
        log(
            f"\n③ 이번 수집 신규 없음 — "
            f"이미 수집한 업체이거나 검색 결과가 없습니다."
        )

    log("\n④ 사이트 등록 (미등록 신규만, 중복 자동 제외)")
    ok, fail = register_master_pending(settings, log)
    if ok == 0 and fail == 0:
        log("등록할 새 업체가 없습니다. (모두 이미 등록됨)")
        return True
    return fail == 0


def list_crawled_files() -> list[Path]:
    return sorted(SCRIPT_DIR.glob("crawled_*.json"), reverse=True)
