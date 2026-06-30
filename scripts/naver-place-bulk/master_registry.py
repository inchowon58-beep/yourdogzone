"""카테고리별 마스터 수집 목록 — 검색어·세션 간 place_id 중복 제거"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).parent


def master_path(category: str) -> Path:
    return SCRIPT_DIR / f"master_{category}.json"


def _now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat()


def place_key(item: dict[str, Any]) -> str:
    """네이버 place_id 우선, 없으면 URL·이름+주소 조합."""
    pid = str(item.get("place_id") or "").strip()
    if pid:
        return f"id:{pid}"

    url = str(item.get("naver_place_url") or "").strip()
    if url:
        m = re.search(r"/place/(\d+)", url)
        if m:
            return f"id:{m.group(1)}"
        return f"url:{url.split('?')[0]}"

    name = str(item.get("name") or "").strip().lower()
    address = str(item.get("address") or "").strip().lower()
    if name and address:
        return f"na:{name}|{address}"
    if name:
        return f"n:{name}"
    return ""


def load_master(category: str) -> dict[str, Any]:
    path = master_path(category)
    if not path.exists():
        return {
            "category": category,
            "updated_at": None,
            "items": [],
        }
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        return {"category": category, "updated_at": None, "items": []}
    data.setdefault("items", [])
    data.setdefault("category", category)
    return data


def save_master(category: str, data: dict[str, Any]) -> Path:
    path = master_path(category)
    data["category"] = category
    data["updated_at"] = _now_iso()
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def merge_items_into_master(
    category: str,
    new_items: list[dict[str, Any]],
    *,
    source: str = "crawl",
) -> tuple[int, int, int]:
    """
    마스터에 신규만 추가. 반환: (신규, 중복, 마스터 총건수)
    """
    master = load_master(category)
    items: list[dict[str, Any]] = list(master.get("items") or [])
    index: dict[str, int] = {}
    for i, row in enumerate(items):
        key = place_key(row)
        if key:
            index[key] = i

    added = 0
    dup = 0
    now = _now_iso()

    for raw in new_items:
        key = place_key(raw)
        if not key:
            continue

        entry = {
            "place_id": raw.get("place_id") or "",
            "name": raw.get("name") or "",
            "address": raw.get("address") or "",
            "phone": raw.get("phone") or "",
            "description": raw.get("description") or "",
            "image_urls": raw.get("image_urls") or [],
            "naver_place_url": raw.get("naver_place_url") or "",
            "registered": False,
            "site_url": None,
            "first_seen_at": now,
            "last_seen_at": now,
            "sources": [source],
        }

        if key in index:
            dup += 1
            prev = items[index[key]]
            prev["last_seen_at"] = now
            sources = list(prev.get("sources") or [])
            if source not in sources:
                sources.append(source)
            prev["sources"] = sources
            # 비어 있던 필드만 보강
            for field in ("phone", "description", "naver_place_url", "place_id"):
                if not prev.get(field) and entry.get(field):
                    prev[field] = entry[field]
            if not prev.get("image_urls") and entry.get("image_urls"):
                prev["image_urls"] = entry["image_urls"]
            continue

        items.append(entry)
        index[key] = len(items) - 1
        added += 1

    master["items"] = items
    save_master(category, master)
    return added, dup, len(items)


def master_stats(category: str) -> dict[str, int]:
    master = load_master(category)
    items = master.get("items") or []
    registered = sum(1 for i in items if i.get("registered"))
    return {
        "total": len(items),
        "registered": registered,
        "pending": len(items) - registered,
    }


def get_pending_items(category: str) -> list[dict[str, Any]]:
    return [
        i
        for i in (load_master(category).get("items") or [])
        if not i.get("registered")
    ]


def get_registered_place_keys(category: str) -> set[str]:
    keys: set[str] = set()
    for item in load_master(category).get("items") or []:
        if item.get("registered"):
            key = place_key(item)
            if key:
                keys.add(key)
    return keys


def mark_items_registered(
    category: str,
    entries: list[tuple[dict[str, Any], str]],
) -> int:
    """
    등록 성공한 항목을 마스터에 표시.
    entries: [(원본 payload 또는 master item, site_url), ...]
    """
    if not entries:
        return 0

    master = load_master(category)
    items: list[dict[str, Any]] = list(master.get("items") or [])
    index = {place_key(row): i for i, row in enumerate(items) if place_key(row)}
    now = _now_iso()
    marked = 0

    for raw, site_url in entries:
        key = place_key(raw)
        if not key:
            continue
        if key not in index:
            items.append(
                {
                    "place_id": raw.get("place_id") or "",
                    "name": raw.get("name") or "",
                    "address": raw.get("address") or "",
                    "phone": raw.get("phone") or "",
                    "description": raw.get("description") or "",
                    "image_urls": raw.get("image_urls") or [],
                    "naver_place_url": raw.get("naver_place_url") or "",
                    "registered": True,
                    "site_url": site_url,
                    "first_seen_at": now,
                    "last_seen_at": now,
                    "registered_at": now,
                    "sources": ["register"],
                }
            )
            index[key] = len(items) - 1
            marked += 1
            continue
        row = items[index[key]]
        row["registered"] = True
        row["site_url"] = site_url
        row["registered_at"] = now
        marked += 1

    if marked:
        master["items"] = items
        save_master(category, master)
    return marked


def sync_master_from_server(
    category: str,
    *,
    names: set[str],
    name_address_pairs: set[tuple[str, str]],
) -> int:
    """사이트에 이미 올라간 업체를 마스터에 등록완료로 맞춤."""
    if not names and not name_address_pairs:
        return 0

    master = load_master(category)
    items: list[dict[str, Any]] = list(master.get("items") or [])
    now = _now_iso()
    marked = 0
    pair_keys = {
        f"{n.strip().lower()}|{a.strip().lower()}"
        for n, a in name_address_pairs
        if n.strip() and a.strip()
    }

    for row in items:
        if row.get("registered"):
            continue
        name = str(row.get("name") or "").strip()
        address = str(row.get("address") or "").strip()
        on_site = bool(name and name in names)
        if not on_site and name and address:
            on_site = f"{name.lower()}|{address.lower()}" in pair_keys
        if on_site:
            row["registered"] = True
            row["site_url"] = row.get("site_url") or "(site)"
            row["registered_at"] = row.get("registered_at") or now
            marked += 1

    if marked:
        master["items"] = items
        save_master(category, master)
    return marked


def get_known_place_ids(category: str) -> set[str]:
    """마스터에 이미 있는 네이버 place_id (수집 시 스킵용)."""
    ids: set[str] = set()
    for item in load_master(category).get("items") or []:
        pid = str(item.get("place_id") or "").strip()
        if pid:
            ids.add(pid)
            continue
        key = place_key(item)
        if key.startswith("id:"):
            ids.add(key[3:])
    return ids


def normalize_place_name(name: str) -> str:
    """업체명 비교용 — 공백 제거·소문자."""
    return re.sub(r"\s+", "", str(name or "").strip().lower())


def get_known_names(category: str) -> set[str]:
    """마스터에 이미 있는 업체명 (수집 시 클릭 없이 스킵)."""
    names: set[str] = set()
    for item in load_master(category).get("items") or []:
        name = str(item.get("name") or "").strip()
        if name:
            names.add(normalize_place_name(name))
    return names


def item_to_place_payload(item: dict[str, Any]) -> dict[str, Any]:
    """등록 API용 payload."""
    return {
        "place_id": item.get("place_id") or "",
        "name": item.get("name") or "",
        "address": item.get("address") or "",
        "phone": item.get("phone") or None,
        "description": item.get("description") or "",
        "image_urls": item.get("image_urls") or [],
        "naver_place_url": item.get("naver_place_url") or "",
    }
