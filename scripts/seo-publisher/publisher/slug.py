from __future__ import annotations

import hashlib
import re
from typing import Iterable

# lib/academy/regional-slug.ts 와 동기화
ROMANIZE: dict[str, str] = {
    "서울": "seoul",
    "경기": "gyeonggi",
    "인천": "incheon",
    "부산": "busan",
    "대구": "daegu",
    "광주": "gwangju",
    "대전": "daejeon",
    "울산": "ulsan",
    "세종": "sejong",
    "강원": "gangwon",
    "충북": "chungbuk",
    "충남": "chungnam",
    "전북": "jeonbuk",
    "전남": "jeonnam",
    "경북": "gyeongbuk",
    "경남": "gyeongnam",
    "제주": "jeju",
    "강남": "gangnam",
    "강북": "gangbuk",
    "강서": "gangseo",
    "강동": "gangdong",
    "송파": "songpa",
    "마포": "mapo",
    "노원": "nowon",
    "안산": "ansan",
    "부천": "bucheon",
    "부평": "bupyeong",
    "수원": "suwon",
    "성남": "seongnam",
    "고양": "goyang",
    "용인": "yongin",
    "화성": "hwaseong",
    "시흥": "siheung",
    "광명": "gwangmyeong",
    "평택": "pyeongtaek",
    "김포": "gimpo",
    "의정부": "uijeongbu",
    "파주": "paju",
    "남양주": "namyangju",
    "안양": "anyang",
    "군포": "gunpo",
    "하남": "hanam",
    "오산": "osan",
    "이천": "icheon",
    "안성": "anseong",
    "의왕": "uiwang",
    "양주": "yangju",
    "구리": "guri",
    "포천": "pocheon",
    "동두천": "dongducheon",
    "과천": "gwacheon",
    "연천": "yeoncheon",
    "가평": "gapyeong",
    "양평": "yangpyeong",
    "여주": "yeoju",
    "분당": "bundang",
    "일산": "ilsan",
    "창원": "changwon",
    "천안": "cheonan",
    "청주": "cheongju",
    "전주": "jeonju",
}

SLUG_SUFFIX: dict[str, str] = {
    "academy": "dog-grooming-academy",
    "adoption": "dog-adoption",
    "shelter": "dog-shelter",
    "funeral": "pet-funeral",
    "breeder": "dog-breeder",
    "hospital": "pet-hospital",
}

KEYWORD_NOISE: dict[str, re.Pattern[str]] = {
    "academy": re.compile(
        r"애견미용학원|애견\s*미용학원|강아지미용학원|애견미용|미용학원|학원|반려견|강아지",
        re.I,
    ),
    "adoption": re.compile(
        r"애견샵|애견\s*샵|강아지분양|강아지\s*분양|견종\s*분양|강아지입양|입양|분양|반려견|강아지|업체",
        re.I,
    ),
    "shelter": re.compile(
        r"강아지보호소|강아지\s*보호소|강아지파양|유기견보호소|유기동물|입양센터|보호센터|유기견|구조견|보호소|파양|반려견|강아지",
        re.I,
    ),
    "funeral": re.compile(
        r"강아지장례식장|강아지\s*장례식장|강아지장례|반려견\s*장례|펫\s*장례|장례식장|장례|반려견|강아지",
        re.I,
    ),
    "breeder": re.compile(
        r"브리더정보|애견브리더|견종\s*브리더|브리더|반려견|강아지",
        re.I,
    ),
    "hospital": re.compile(
        r"동물병원|반려동물\s*병원|24시\s*동물병원|병원|반려동물|반려견|강아지",
        re.I,
    ),
}

CATEGORY_META: dict[str, dict[str, str]] = {
    "shelter": {
        "title": "강아지보호소",
        "singular": "보호소",
        "default_suffix": "강아지보호소",
        "base_path": "/services/shelter",
    },
    "academy": {
        "title": "애견미용학원",
        "singular": "학원",
        "default_suffix": "애견미용학원",
        "base_path": "/services/academy",
    },
    "adoption": {
        "title": "강아지분양",
        "singular": "분양업체",
        "default_suffix": "강아지분양",
        "base_path": "/services/adoption",
    },
    "funeral": {
        "title": "강아지장례식장",
        "singular": "장례식장",
        "default_suffix": "강아지장례식장",
        "base_path": "/services/funeral",
    },
    "breeder": {
        "title": "브리더",
        "singular": "브리더",
        "default_suffix": "브리더",
        "base_path": "/services/breeder",
    },
    "hospital": {
        "title": "동물병원",
        "singular": "동물병원",
        "default_suffix": "동물병원",
        "base_path": "/services/hospital",
    },
}


def parse_label(keyword: str, category: str) -> str:
    noise = KEYWORD_NOISE.get(category) or KEYWORD_NOISE["shelter"]
    text = noise.sub(" ", keyword.strip())
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return keyword.strip().split()[0] if keyword.strip() else ""
    return text.split()[0]


def romanize_label(label: str) -> str:
    key = label.strip()
    if key in ROMANIZE:
        return ROMANIZE[key]
    ascii_ = re.sub(r"[^a-z0-9]+", "-", key.lower()).strip("-")
    if ascii_:
        return ascii_
    digest = hashlib.md5(key.encode("utf-8")).hexdigest()[:12]
    return f"region-{digest}"


def build_slug(label: str, category: str) -> str:
    suffix = SLUG_SUFFIX.get(category, "page")
    return f"{romanize_label(label)}-{suffix}"


def build_unique_slug(
    label: str, category: str, taken: Iterable[str]
) -> str:
    taken_set = set(taken)
    base = build_slug(label, category)
    if base not in taken_set:
        return base
    n = 2
    while f"{base}-{n}" in taken_set:
        n += 1
    return f"{base}-{n}"


def parse_keywords(text: str, count: int | None = None) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for line in text.splitlines():
        for part in re.split(r"[,;|]", line):
            kw = part.strip()
            if len(kw) < 2:
                continue
            key = kw.lower()
            if key in seen:
                continue
            seen.add(key)
            out.append(kw)
            if count is not None and len(out) >= count:
                return out
    return out
