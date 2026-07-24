"""카테고리별 SEO 기본 템플릿 + 키워드별 변형 (Gemini 없음).

동일 문장 반복을 줄이기 위해 키워드 해시로 문단·FAQ·표현을 섞습니다.
보호소(shelter)는 사이트 UI(ShelterRegionalTrustGuide)가 본문을 렌더하므로
발행 JSON에는 파양·무료분양 신뢰 FAQ·메타 중심으로 담습니다.
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
from publisher.adoption_forms import (
    ADOPTION_FORMS,
    COMMON_CHECKS,
    FLOW_CAT,
    FLOW_DOG,
    DEFAULT_ADOPTION_FORM,
    form_meta,
    resolve_adoption_form_id,
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


SHELTER_SITUATIONS = [
    "군입대",
    "이민·해외 이주",
    "임신·출산",
    "보호자 건강 악화",
    "보호자 신변 이상",
    "이혼·가족 변화",
    "주거 환경 변화(반려동물 불가)",
    "경제 상황의 급변",
    "장기 입원·요양",
    "돌봄 공백이 길어지는 경우",
]

SHELTER_REGION_INFO = [
    "{region}에서 {keyword}을(를) 알아볼 때, 유기 대신 사설보호소 상담으로 아이에게 새 가족을 찾아주는 방법을 먼저 확인하세요.",
    "{keyword} 상담은 비용·보호 환경·절차를 투명하게 설명하는 곳을 고르는 것이 핵심입니다. {region} 기준으로 신중히 비교하세요.",
    "어쩔 수 없는 상황의 강아지파양은 나쁜 일이 아닙니다. {region}에서 {keyword}을(를) 고민 중이라면 유기하지 말고 상담부터 시작하세요.",
    "{region} {keyword} 정보는 입소비용·보호 환경·상담 응대를 함께 확인한 뒤 선택하는 편이 안전합니다.",
    "최근 뉴스에서도 보도된 것처럼 안 좋은 곳이 있을 수 있어, {region}에서 {keyword}을(를) 알아볼 때는 한 번 더 신중하세요.",
    "{keyword}을(를) 검색 중이라면 {region} 인근 사설보호소의 입소 절차와 무료분양 의미를 먼저 정리해 보세요.",
]

SHELTER_META = [
    "{keyword} | 강아지파양·무료분양 전 확인할 입소비용·보호 환경·절차 안내",
    "{region} {keyword} — 사설보호소 입소비용 주의사항과 파양 절차를 정리했습니다.",
    "{keyword} 가이드. 유기견보호소와 다른 점, 무료분양 의미, 신뢰할 상담 포인트를 확인하세요.",
    "{region} 강아지파양·입소 전 확인 포인트 | {keyword}",
    "{keyword} — 유기 대신 새 가족을 찾는 파양·무료분양 상담 안내 ({region})",
    "{region}에서 {keyword} 알아볼 때 꼭 확인할 비용·환경·절차",
]

SHELTER_NEARBY_INTRO = [
    "{region} 인근에서도 {keyword} 상담 시 입소비용·보호 환경을 비교해 보시면 도움이 됩니다.",
    "{keyword}을(를) 검토 중이라면 {region} 주변 지역 안내도 함께 참고해 보세요.",
    "같은 조건이라도 지역마다 상담 가능 여부가 다를 수 있어, {region} 인근 {keyword} 정보를 폭넓게 확인하세요.",
]

SHELTER_BLOCK_OPENERS = [
    "{region}에서 {keyword}을(를) 고민 중이라면 유기하지 말고, 사설보호소 상담으로 아이에게 새 가족을 찾아주는 방향을 먼저 검토하세요.",
    "{keyword} 상담은 급하게 결정하기보다 비용 항목과 보호 환경을 확인한 뒤 진행하는 것이 좋습니다. {region} 기준으로 비교해 보세요.",
    "군입대·이민·임신·신변 이상처럼 함께하기 어려운 상황에서는, {region}에서 {keyword} 상담으로 새 가정을 찾는 편이 바람직할 수 있습니다.",
]

SHELTER_COST_PARAS = [
    "강아지파양 입소는 최근 뉴스에서도 보도된 것처럼 안 좋은 곳이 있을 수 있어 신중히 알아본 뒤 선택해야 합니다.",
    "입소비용이 터무니없이 비싸거나 지나치게 저렴하다면 한 번쯤 신중히 생각하고, 포함 항목과 보호 환경을 확인하세요.",
    "사설보호소는 보호·의료·케어 운영비가 들어가므로 입소 시 비용이 발생합니다. ‘싸다/비싸다’보다 무엇을 위한 비용인지가 중요합니다.",
]

SHELTER_FAQS = [
    (
        "{region} 강아지파양 상담은 어떻게 시작하나요?",
        "아이 상태·나이·중성화·접종 이력을 정리한 뒤 {region} 인근 사설보호소에 전화·온라인으로 문의하면 입소·보호 가능 여부를 안내받을 수 있습니다.",
        "{keyword} 문의는 어디서 하나요?",
        "보호소 상담 창구(전화/웹)로 {region} 기준 가능 여부와 입소비용 항목을 먼저 확인하는 것이 좋습니다.",
    ),
    (
        "강아지무료분양은 유기견·유기묘를 말하나요?",
        "아닙니다. 가정에서 생활하던 아이들이 사정으로 파양되어 새로운 가족을 찾는 경우를 뜻하는 경우가 많습니다.",
        "무료분양은 어떤 의미인가요?",
        "유기된 아이가 아니라 보호자 사정으로 파양되어 새 가정을 찾는 파양견 안내인 경우가 많습니다.",
    ),
    (
        "사설보호소는 왜 입소비용이 발생하나요?",
        "사설보호소는 보호·의료·케어 운영비가 들어가므로 입소 시 비용이 발생합니다. 너무 비싸거나 지나치게 저렴하면 항목과 보호 환경을 한 번 더 확인하세요.",
        "입소비용이 너무 비싸거나 싸면 어떻게 해야 하나요?",
        "터무니없이 높거나 지나치게 낮은 견적은 한 번쯤 신중히 생각하고, 포함 항목·보호 환경을 투명하게 설명하는지 확인하세요.",
    ),
    (
        "시 유기견보호소에도 개인 사정으로 파양할 수 있나요?",
        "시·군 유기견보호소는 개인 사정의 파양보다 실제 유기·미아 동물을 보호하는 경우가 많고, 일정 기간 후 안락사가 이뤄질 수 있습니다. 주인이 있는 아이의 파양은 사실상 어렵다고 보는 편이 맞습니다.",
        "유기견보호소와 사설보호소 차이는?",
        "유기견보호소는 유기·미아 중심이며 안락사 가능성이 있습니다. 개인 사정 파양은 사설보호소 상담이 현실적인 경우가 많습니다.",
    ),
    (
        "어쩔 수 없는 파양은 나쁜 일인가요?",
        "군입대·이민·임신·보호자 신변 이상처럼 함께하기 어려운 상황에서의 파양은, 유기하지 않고 새 가정을 찾아주는 바람직한 선택일 수 있습니다.",
        "어떤 상황에서 상담이 필요할까요?",
        "{situations}처럼 더 이상 함께하기 어려운 경우라면 유기 대신 보호소 상담을 먼저 고려하세요.",
    ),
    (
        "강아지파양 절차는 어떻게 되나요?",
        "상담 → 아이 상태 체크 → 보호소 입소 → 새로운 가족 찾기의 흐름이 일반적입니다. 급하게 결정하기보다 비용·환경을 확인한 뒤 진행하세요.",
        "입소 전 무엇을 확인해야 하나요?",
        "비용 포함 항목, 보호 환경·위생, 상담 응대 신뢰도를 확인한 뒤 선택하세요. 최근 뉴스처럼 안 좋은 곳도 있을 수 있어 신중해야 합니다.",
    ),
]


def _shelter_faqs(rng: random.Random, region: str, keyword: str) -> list[dict]:
    situations = ", ".join(_shuffle(rng, list(SHELTER_SITUATIONS))[:4])
    faqs = []
    # 4~6개로 페이지마다 FAQ 개수도 약간 다르게
    count = 4 + rng.randrange(3)
    for group in _shuffle(rng, SHELTER_FAQS)[:count]:
        use_alt = rng.random() < 0.5
        q = group[2] if use_alt else group[0]
        a = group[3] if use_alt else group[1]
        faqs.append(
            {
                "question": q.format(
                    region=region, keyword=keyword, situations=situations
                ),
                "answer": a.format(
                    region=region, keyword=keyword, situations=situations
                ),
            }
        )
    return faqs


def _shelter_blocks(rng: random.Random, region: str, keyword: str) -> list[dict]:
    """사이트 UI가 본문을 렌더하므로, JSON에는 요약 블록만 보관."""
    situations = _shuffle(rng, list(SHELTER_SITUATIONS))[:4]
    opener = _pick(rng, SHELTER_BLOCK_OPENERS).format(
        region=region, keyword=keyword
    )
    cost_paras = _shuffle(rng, list(SHELTER_COST_PARAS))[:2]
    return [
        {
            "title": f"{keyword} · 이런 상황이라면 상담하세요",
            "paragraphs": [
                opener,
                "어쩔 수 없는 상황에서의 강아지파양은 나쁜 일이 아니라 오히려 바람직한 선택일 수 있습니다.",
            ],
            "bullets": situations,
        },
        {
            "title": "사설보호소 입소비용 · 꼭 유의하세요",
            "paragraphs": cost_paras,
            "bullets": _shuffle(
                rng,
                [
                    "모든 사설보호소는 입소 시 비용이 발생할 수 있음",
                    "비용 포함 항목 투명성",
                    "보호 환경·상담 신뢰도",
                    "지나치게 높거나 낮은 견적은 재확인",
                ],
            )[:3],
        },
        {
            "title": "강아지무료분양 · 유기견이 아닙니다",
            "paragraphs": [
                _pick(
                    rng,
                    [
                        "강아지무료분양은 유기견·유기묘가 아니라, 가정에서 생활하던 아이들이 파양을 통해 새 가족을 찾는 경우를 뜻하는 경우가 많습니다.",
                        "무료분양으로 소개되는 아이들은 대개 가정견이 사정으로 파양되어 새 보호자를 기다리는 경우입니다.",
                    ],
                ),
            ],
            "bullets": _shuffle(
                rng,
                [
                    "가정견의 새 가족 찾기",
                    "아이 성향·건강 정보 공유",
                    "급하지 않은 매칭",
                    "유기견보호소 안락사 이슈와 구분",
                ],
            )[:3],
        },
        {
            "title": "시 유기견보호소와 다른 점",
            "paragraphs": [
                "시·군 유기견보호소는 개인 사정 파양보다 실제 유기·미아 동물을 보호하는 경우가 많고, 일정 기간 후 안락사가 이뤄질 수 있습니다.",
                "주인이 있는 아이의 파양은 사실상 어렵다고 보는 편이 맞으며, 개인 사정 입소는 사설보호소 상담이 현실적입니다.",
            ],
            "bullets": _shuffle(
                rng,
                [
                    "상담 → 상태 체크 → 입소 → 새 가족 찾기",
                    "유기 대신 새 가정",
                    "투명한 비용·환경 확인",
                    "개인 사정 파양은 사설보호소 중심",
                ],
            )[:3],
        },
    ]


def _cat_basic_faqs(
    rng: random.Random, region: str, keyword: str
) -> list[dict]:
    pool = [
        (
            "고양이 분양가격은 얼마인가요?",
            "아이들의 퀄리티·혈통·건강 관리에 따라 적게는 10만 원대부터 수백만 원 이상까지 달라질 수 있습니다. 포함 항목과 사후관리를 함께 확인하세요.",
        ),
        (
            "유기묘보호소 무료분양은 비용이 전혀 없나요?",
            "분양비가 무료여도 진료비·책임비 등으로 일부 비용이 발생할 수 있습니다. 완전 무비용으로 단정하지 않는 편이 안전합니다.",
        ),
        (
            "고양이 처음 키울 때 비용은?",
            "용품(화장실·모래·스크래처·이동장), 사료, 병원(검진·접종) 등 초기 정착비를 분양가와 별도로 준비하세요.",
        ),
        (
            "고양이 배변훈련은 어떻게 하나요?",
            "대부분 본능적으로 화장실을 이용합니다. 청결·모래·위치가 중요하고, 분양 직후에는 좁은 공간 적응이 도움이 됩니다.",
        ),
        (
            "접종은 꼭 해야 하나요?",
            "예방접종·구충·건강검진 기록을 분양 전 확인하고, 인수 후 병원에서 상태를 재확인하는 것을 권장합니다.",
        ),
        (
            f"{region}에서 어떤 업체를 고르면 좋을까요?",
            f"업체가 많아 고민이라면 {keyword} 페이지의 인증 추천업체 정보를 먼저 참고해 보세요. 환경·상담·계약 투명성을 기준으로 비교하세요.",
        ),
        (
            "아파트에서 키우기 좋은 고양이가 있나요?",
            "조용하고 실내 적응이 빠른 아이, 그루밍 부담이 적은 단모 등이 많이 선택됩니다. 개체 차가 크니 성격을 꼭 확인하세요.",
        ),
        (
            "키우기 쉬운 고양이는 어떤 타입인가요?",
            "온순하고 실내 생활에 잘 적응하는 아이들이 초보 집사에게 상대적으로 수월한 편입니다. 절대 기준은 없으니 상담이 중요합니다.",
        ),
    ]
    count = 5 + rng.randrange(2)
    picked = _shuffle(rng, pool)[:count]
    return [{"question": q, "answer": a} for q, a in picked]


def _cat_basic_blocks(
    rng: random.Random, region: str, keyword: str
) -> list[dict]:
    return [
        {
            "title": "키우기 쉬운 고양이 · 아파트 환경",
            "paragraphs": [
                f"{region}에서 {keyword}을(를) 알아볼 때, 초보 집사·아파트 가구는 성격과 실내 적응을 먼저 보세요.",
            ],
            "bullets": _shuffle(
                rng,
                [
                    "온순·실내 적응이 빠른 타입",
                    "그루밍 부담이 적은 단모",
                    "화장실 적응",
                    "층간·소음 고려",
                ],
            )[:4],
        },
        {
            "title": "고양이 분양가격 · 초기 비용",
            "paragraphs": [
                "분양가는 퀄리티·혈통에 따라 적게는 10만 원대부터 수백만 원 이상까지 달라질 수 있습니다.",
                "유기묘 무료분양도 진료비·책임비 등 일부 비용이 발생할 수 있습니다.",
            ],
            "bullets": ["용품", "사료", "병원·접종", "안전 환경"],
        },
        {
            "title": "배변 · 접종 · 키우는 방법",
            "paragraphs": [
                "화장실 청결·접종 일정·적응 공간을 분양 직후 우선 챙기세요.",
            ],
            "bullets": ["배변(화장실)", "접종·구충", "독립 적응 공간", "스크래처·놀이"],
        },
        {
            "title": "어떤 업체에서 입양하면 좋을까?",
            "paragraphs": [
                f"업체가 많아 고민이라면 {region} {keyword} 페이지의 추천업체 정보를 활용해 보세요.",
            ],
            "bullets": ["사육 환경", "상담 투명성", "계약·사후관리", "인증 추천 참고"],
        },
    ]


def _adoption_faqs(
    rng: random.Random,
    region: str,
    keyword: str,
    meta: dict[str, Any],
) -> list[dict]:
    subject = meta["subject"]
    species = meta["species"]
    pet = "고양이" if species == "cat" else "강아지"
    pool = [
        (
            f"{region} {subject} 분양은 어떻게 시작하나요?",
            f"원하는 조건(성격·예산·가정 환경)을 정리한 뒤 {region} 인근 분양처에 상담하고, 가능하면 사육 환경을 직접 확인하세요.",
        ),
        (
            f"{subject} 분양 전 꼭 확인할 것은?",
            "접종·건강검진 기록, 계약·건강보증, 분양가·추가비, 아이 상태를 확인하는 것이 중요합니다.",
        ),
        (
            "계약서에 무엇이 있어야 하나요?",
            "환불·건강보증 기간·사후관리·추가비용 범위를 문서로 남겨 두는 것이 안전합니다.",
        ),
        (
            f"{pet} 분양 직후 병원은 가야 하나요?",
            "가능하면 인수 후 가까운 동물병원에서 건강검진을 받는 것을 권장합니다.",
        ),
        (
            f"{subject} 특성을 모르면 어떻게 하나요?",
            f"{subject}는 {', '.join(meta['traits'][:2])} 같은 특징이 있습니다. 생활 패턴과 맞는지 상담 시 꼭 물어보세요.",
        ),
        (
            "가격이 너무 싸거나 비싸면?",
            meta["warning"],
        ),
    ]
    count = 4 + rng.randrange(3)
    picked = _shuffle(rng, pool)[:count]
    return [{"question": q, "answer": a} for q, a in picked]


def _adoption_blocks(
    rng: random.Random,
    region: str,
    keyword: str,
    meta: dict[str, Any],
) -> list[dict]:
    subject = meta["subject"]
    checks = _shuffle(rng, list(COMMON_CHECKS))[:4]
    traits = _shuffle(rng, list(meta["traits"]))[:4]
    care = _shuffle(rng, list(meta["care_notes"]))[:3]
    return [
        {
            "title": f"{subject} · 분양 전 체크",
            "paragraphs": [
                f"{region}에서 {keyword}을(를) 알아볼 때, {subject} 기준으로 건강·계약·사육 환경을 먼저 확인하세요.",
                meta["warning"],
            ],
            "bullets": checks,
        },
        {
            "title": f"{subject} 특징",
            "paragraphs": [
                f"{meta['headline_focus']}. {region} 분양 상담 시 아래 특성을 함께 물어보세요.",
            ],
            "bullets": traits,
        },
        {
            "title": "초기 케어",
            "paragraphs": care,
            "bullets": ["병원 검진", "적응 공간", "용품·일정 준비"],
        },
        {
            "title": "진행 순서",
            "paragraphs": [
                "상담 → 방문·확인 → 계약·인수 → 적응·케어 순으로 진행하는 편이 안전합니다.",
            ],
            "bullets": [
                t[0] for t in (FLOW_CAT if meta["species"] == "cat" else FLOW_DOG)
            ],
        },
    ]


def build_page(
    *,
    keyword: str,
    category: str,
    taken_slugs: list[str],
    image_url: str | None = None,
    form_id: str | None = None,
) -> dict[str, Any]:
    meta = CATEGORY_META.get(category) or CATEGORY_META["shelter"]
    label = parse_label(keyword, category)
    if not label:
        raise ValueError(f"지역명을 추출할 수 없습니다: {keyword}")

    resolved_form = (
        resolve_adoption_form_id(form_id)
        if category == "adoption"
        else None
    )
    form = form_meta(resolved_form) if resolved_form else None

    rng = _seed(f"{category}:{resolved_form or ''}:{keyword}")
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
        nearby_intro = _pick(rng, SHELTER_NEARBY_INTRO).format(
            region=label, keyword=page_keyword
        )
    elif category == "adoption" and form:
        if form["id"] == "cat_basic":
            seo_blocks = _cat_basic_blocks(rng, label, page_keyword)
            faq_items = _cat_basic_faqs(rng, label, page_keyword)
            region_info = (
                f"{label}에서 {page_keyword}을(를) 찾을 때, 키우기 쉬운 고양이·"
                f"아파트 환경·초기 비용·배변·접종을 먼저 확인하세요."
            )
            meta_description = (
                f"{page_keyword} | 고양이 분양가격·초기비용·배변·접종 가이드 ({label})"
            )
            nearby_intro = (
                f"{label} 인근에서도 고양이분양 상담 시 비용·건강·케어를 함께 비교해 보세요."
            )
        else:
            seo_blocks = _adoption_blocks(rng, label, page_keyword, form)
            faq_items = _adoption_faqs(rng, label, page_keyword, form)
            subject = form["subject"]
            region_info = (
                f"{label}에서 {page_keyword}을(를) 찾을 때, {subject} 분양은 "
                f"건강·계약·사육 환경을 먼저 확인하는 것이 중요합니다."
            )
            meta_description = (
                f"{page_keyword} | {subject} 분양 전 체크리스트 · "
                f"건강·계약·사육환경 안내 ({label})"
            )
            nearby_intro = (
                f"{label} 인근에서도 {subject} 분양 상담 시 동일하게 "
                f"환경·건강·계약을 비교해 보세요."
            )
    else:
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

    use_trust_v2 = category in {"shelter", "adoption"}
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
        "layoutVersion": "v2" if use_trust_v2 else "v1",
        "publishSource": "offline-seo",
        "isPublished": True,
        "createdAt": now,
        "updatedAt": now,
    }
    if form:
        page["formId"] = form["id"]
        page["formLabel"] = form["label"]
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
    form_id: str | None = None,
) -> list[dict[str, Any]]:
    from publisher.cdn_images import pick_random_image_url

    taken = list(existing_slugs or [])
    pages: list[dict[str, Any]] = []
    for kw in keywords:
        rng = _seed(f"{category}:{form_id or ''}:{kw}:img")
        img = pick_random_image_url(
            image_cdn, image_max, ext=image_ext, rng=rng
        )
        page = build_page(
            keyword=kw,
            category=category,
            taken_slugs=taken,
            image_url=img,
            form_id=form_id,
        )
        taken.append(page["slug"])
        pages.append(page)
    return pages


# GUI용 re-export
__all__ = [
    "build_page",
    "build_pages_for_keywords",
    "ADOPTION_FORMS",
    "DEFAULT_ADOPTION_FORM",
]