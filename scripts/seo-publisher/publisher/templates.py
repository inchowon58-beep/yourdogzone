"""카테고리별 SEO 기본 템플릿 + 키워드별 변형 (Gemini 없음).

동일 문장 반복을 줄이기 위해 키워드 해시로 문단·FAQ·표현을 섞습니다.
"""

from __future__ import annotations

import hashlib
import random
from datetime import datetime, timezone
from typing import Any

from publisher.slug import (
    CATEGORY_META,
    build_unique_slug,
    parse_label,
)


def _seed(keyword: str) -> random.Random:
    digest = hashlib.md5(keyword.strip().encode("utf-8")).hexdigest()
    return random.Random(int(digest[:16], 16))


def _pick(rng: random.Random, options: list[str]) -> str:
    return options[rng.randrange(len(options))]


def _shuffle(rng: random.Random, items: list[Any]) -> list[Any]:
    out = list(items)
    rng.shuffle(out)
    return out


# --- 강아지보호소 기본 블록 ---

SHELTER_INTROS = [
    "{region}에서 {keyword} 정보를 찾는 분을 위해, 보호·입양·파양 상담 흐름을 정리했습니다.",
    "{keyword}을(를) 알아보고 계시다면 {region} 인근 보호소 이용 전 확인하면 좋은 포인트를 모았습니다.",
    "{region} {keyword} 관련 문의가 많을 때, 방문 전 준비할 서류와 상담 순서를 안내합니다.",
    "가족 사정으로 {keyword}을(를) 고민 중이라면 {region} 기준으로 현실적인 절차를 확인하세요.",
]

SHELTER_SECTION_TITLES = [
    [
        "{region} 보호소 상담 전 체크",
        "입소·보호 절차 요약",
        "새 가족 매칭 시 유의사항",
        "자주 묻는 질문 전에 알면 좋은 점",
    ],
    [
        "{region}에서 먼저 확인할 정보",
        "파양·보호 상담 흐름",
        "건강·케어 확인 포인트",
        "방문 예약과 연락 팁",
    ],
    [
        "{keyword} 핵심 안내",
        "{region} 보호 환경 이해하기",
        "비용·서류 준비",
        "입양 연결 시 체크리스트",
    ],
]

SHELTER_PARAS_A = [
    "{region} 보호소 상담은 아이 상태·나이·중성화 여부·접종 이력을 미리 정리해 두면 더 빠릅니다.",
    "전화·온라인으로 1차 안내를 받은 뒤, 필요 시 방문 예약으로 이어지는 경우가 많습니다.",
    "갑작스러운 파양이라면 임시 보호 가능 여부와 대기 기간을 먼저 문의하는 편이 좋습니다.",
]

SHELTER_PARAS_B = [
    "입소 전 건강검진·기본 접종 여부를 확인하면 이후 케어 계획을 세우기 쉽습니다.",
    "보호 공간·산책·급여 방식은 시설마다 달라, {region} 인근 여러 곳을 비교해 보는 것도 도움이 됩니다.",
    "아이 성향(분리불안·사회성)을 솔직히 전달할수록 매칭 성공률이 높아집니다.",
]

SHELTER_PARAS_C = [
    "새 가족을 찾을 때는 입양 가정 조건·사후 연락 가능 여부를 함께 확인하세요.",
    "비용은 보호·의료·운송 범위에 따라 달라질 수 있어, 항목별로 물어보는 것이 안전합니다.",
    "{region} 외 지역 이동이 필요하면 픽업·이동 가능 여부를 사전에 조율하세요.",
]

SHELTER_BULLETS = [
    ["기본 접종·중성화 기록", "최근 식습관·알러지", "성격·사회화 정도"],
    ["방문 가능 요일·시간", "임시 보호 가능 여부", "입양 공고 진행 방식"],
    ["필요 서류(신분증 등)", "예상 케어 비용 범위", "사후 상담 채널"],
]

SHELTER_FAQS = [
    (
        "{keyword} 상담은 어떻게 시작하나요?",
        "{region} 인근 보호소에 전화·온라인으로 아이 정보를 전달하면 입소·보호 가능 여부를 안내받을 수 있습니다.",
        "{keyword} 문의는 어디서 하나요?",
        "보호소 상담 창구(전화/웹)로 {region} 기준 가능 여부를 먼저 확인하는 것이 좋습니다.",
    ),
    (
        "방문 없이 진행할 수 있나요?",
        "1차는 비대면 상담이 가능하고, 필요 시 방문·픽업을 안내하는 곳이 많습니다.",
        "직접 가지 않아도 되나요?",
        "상황 설명 후 원격 상담으로 가능 여부를 확인한 뒤, 방문이 필요하면 일정을 잡으면 됩니다.",
    ),
    (
        "비용은 어느 정도인가요?",
        "보호·의료·케어 범위에 따라 달라 상담 시 항목별로 확인하는 것이 정확합니다.",
        "비용 안내를 받을 수 있나요?",
        "시설·아이 상태에 따라 달라져, 상담 단계에서 투명하게 견적을 요청하세요.",
    ),
    (
        "입양 연결은 얼마나 걸리나요?",
        "아이 상태와 입양 가정 매칭에 따라 다르며, 공고·상담 기간을 여유 있게 잡는 것이 좋습니다.",
        "새 가족을 찾는 데 시간이 얼마나 필요하나요?",
        "매칭 속도와 지역 수요에 따라 달라지므로, 진행 상황을 주기적으로 확인하세요.",
    ),
]

SHELTER_REGION_INFO = [
    "{region}은(는) 반려견 보호·입양 문의가 꾸준한 지역으로, {keyword} 관련 상담 시 인근 시설 여유를 함께 확인하면 좋습니다.",
    "{region} 일대에서 {keyword}을(를) 찾을 때는 교통·방문 가능 시간을 미리 맞춰 두면 상담이 원활합니다.",
    "{keyword} 수요가 있는 {region}에서는 보호 공간 상황에 따라 대기나 연계가 필요할 수 있습니다.",
]

SHELTER_META = [
    "{keyword} 안내 - {region} 강아지보호소 상담·입소·입양 매칭 정보를 확인하세요.",
    "{region} {keyword} | 보호·파양·입양 전 확인하면 좋은 절차와 체크리스트.",
    "{keyword} - {region} 인근 보호소 이용 전 준비사항과 상담 팁을 정리했습니다.",
]


def _shelter_blocks(rng: random.Random, region: str, keyword: str) -> list[dict]:
    titles = _pick(rng, SHELTER_SECTION_TITLES)
    titles = [t.format(region=region, keyword=keyword) for t in titles]
    para_sets = [
        [p.format(region=region, keyword=keyword) for p in SHELTER_PARAS_A],
        [p.format(region=region, keyword=keyword) for p in SHELTER_PARAS_B],
        [p.format(region=region, keyword=keyword) for p in SHELTER_PARAS_C],
        [
            _pick(rng, SHELTER_INTROS).format(region=region, keyword=keyword),
            _pick(rng, SHELTER_REGION_INFO).format(region=region, keyword=keyword),
        ],
    ]
    bullets = _shuffle(rng, SHELTER_BULLETS)
    blocks = []
    for i, title in enumerate(titles[:4]):
        paragraphs = _shuffle(rng, para_sets[i % len(para_sets)])[:2]
        blocks.append(
            {
                "title": title,
                "paragraphs": paragraphs,
                "bullets": bullets[i % len(bullets)],
            }
        )
    return blocks


def _shelter_faqs(rng: random.Random, region: str, keyword: str) -> list[dict]:
    faqs = []
    for group in _shuffle(rng, SHELTER_FAQS)[:3]:
        use_alt = rng.random() < 0.5
        q = group[2] if use_alt else group[0]
        a = group[3] if use_alt else group[1]
        faqs.append(
            {
                "question": q.format(region=region, keyword=keyword),
                "answer": a.format(region=region, keyword=keyword),
            }
        )
    return faqs


def build_page(
    *,
    keyword: str,
    category: str,
    taken_slugs: list[str],
    image_url: str | None = None,
) -> dict[str, Any]:
    meta = CATEGORY_META.get(category) or CATEGORY_META["shelter"]
    label = parse_label(keyword, category)
    if not label:
        raise ValueError(f"지역명을 추출할 수 없습니다: {keyword}")

    rng = _seed(f"{category}:{keyword}")
    slug = build_unique_slug(label, category, taken_slugs)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    page_keyword = keyword.strip()

    if category == "shelter":
        seo_blocks = _shelter_blocks(rng, label, page_keyword)
        faq_items = _shelter_faqs(rng, label, page_keyword)
        region_info = _pick(rng, SHELTER_REGION_INFO).format(
            region=label, keyword=page_keyword
        )
        meta_description = _pick(rng, SHELTER_META).format(
            region=label, keyword=page_keyword
        )
        nearby_intro = (
            f"{label} 인근 지역 보호소·연계 시설도 함께 참고하면 "
            f"{page_keyword} 상담에 도움이 됩니다."
        )
    else:
        # 타 카테고리: 보호소와 동일 골격 + 카테고리명만 치환 (최소 지원)
        title_word = meta["title"]
        seo_blocks = [
            {
                "title": f"{label} {title_word} 안내",
                "paragraphs": [
                    f"{page_keyword} 정보를 찾는 분을 위해 {label} 기준으로 핵심 안내를 정리했습니다.",
                    f"방문·상담 전 운영 시간과 예약 여부를 확인하면 더 수월합니다.",
                ],
                "bullets": ["상담 가능 시간", "위치·주차", "준비 서류"],
            },
            {
                "title": f"{label}에서 확인하면 좋은 점",
                "paragraphs": [
                    f"{title_word}마다 서비스 범위가 달라 비교가 필요합니다.",
                    _pick(rng, SHELTER_PARAS_B).format(
                        region=label, keyword=page_keyword
                    ),
                ],
                "bullets": ["서비스 범위", "비용 안내", "후기·인증"],
            },
            {
                "title": "이용 전 체크리스트",
                "paragraphs": [
                    f"{page_keyword} 관련 문의 시 원하는 조건을 구체적으로 전달하세요.",
                ],
                "bullets": ["원하는 일정", "예산 범위", "연락 방법"],
            },
        ]
        faq_items = [
            {
                "question": f"{page_keyword} 상담은 어떻게 하나요?",
                "answer": f"{label} {title_word}에 전화·온라인으로 문의하면 안내받을 수 있습니다.",
            },
            {
                "question": "예약이 필요한가요?",
                "answer": "시설에 따라 다르니 방문 전 예약 여부를 확인해 주세요.",
            },
        ]
        region_info = f"{label} {title_word} 이용을 검토 중이라면 {page_keyword} 키워드로 지역 정보를 함께 확인하세요."
        meta_description = f"{page_keyword} - {label} {title_word} 안내"
        nearby_intro = f"{label} 인근 {title_word} 정보도 참고해 보세요."

    page: dict[str, Any] = {
        "category": category,
        "slug": slug,
        "label": label,
        "keyword": page_keyword,
        "regionBig": "",
        "query": label,
        "regionInfo": region_info,
        "nearbyIntro": nearby_intro,
        "nearbySlugs": [],
        "nearbyAreas": [],
        "nearbyStations": [],
        "seoBlocks": seo_blocks,
        "faqItems": faq_items,
        "metaDescription": meta_description,
        "isPublished": True,
        "createdAt": now,
        "updatedAt": now,
    }
    if image_url:
        page["imageUrl"] = image_url
    return page


def build_pages_for_keywords(
    keywords: list[str],
    category: str,
    existing_slugs: list[str] | None = None,
    *,
    image_cdn: str = "",
    image_max: int = 0,
    image_ext: str = "webp",
) -> list[dict[str, Any]]:
    from publisher.cdn_images import pick_random_image_url

    taken = list(existing_slugs or [])
    pages: list[dict[str, Any]] = []
    for kw in keywords:
        rng = _seed(f"{category}:{kw}:img")
        img = pick_random_image_url(
            image_cdn, image_max, ext=image_ext, rng=rng
        )
        page = build_page(
            keyword=kw,
            category=category,
            taken_slugs=taken,
            image_url=img,
        )
        taken.append(page["slug"])
        pages.append(page)
    return pages
