/** 스마트 펫샵 선택 · 맞춤 분양 큐레이션 */

export type AnimalPref = "dog" | "cat" | "any";
export type GenderPref = "female" | "male" | "any";

export type ChannelId = "visit" | "delivery" | "import" | "rescue";

export type TimingId =
  | "immediate"
  | "reserve_ok"
  | "within_1m"
  | "within_3m"
  | "flexible";

export type ShopPriorityId =
  | "cheap"
  | "quality"
  | "large_store"
  | "breed_local";

export type ConcernId =
  | "health"
  | "price"
  | "fake"
  | "allergy"
  | "aftercare";

export type PetshopAnswers = {
  animals: AnimalPref[];
  breed: string;
  breedAny: boolean;
  regionBig: string;
  regionSmall: string;
  regionAny: boolean;
  gender: GenderPref;
  channels: ChannelId[];
  timing: TimingId | null;
  shopPriorities: ShopPriorityId[];
  concerns: ConcernId[];
  hasPet: boolean | null;
  adoptWhen: string;
  adoptWhere: string;
  adoptCost: string;
  petGender: string;
  petBreed: string;
  contactName: string;
  contactPhone: string;
  memo: string;
};

export type AdviceBlock = {
  id: string;
  title: string;
  body: string;
  checkpoints: string[];
};

export type MatchedShop = {
  id: string;
  name: string;
  slug?: string;
  category?: string;
  region: string;
  address: string;
  phone: string | null;
  kakaoUrl: string | null;
  image: string | null;
  tags: string[];
  isPartner: boolean;
  isPremium?: boolean;
  href: string;
  matchReason: string;
};

export type CurationResult = {
  reportTitle: string;
  summaryLine: string;
  advice: AdviceBlock[];
  shops: MatchedShop[];
  crmPayload: Record<string, unknown>;
  crmText: string;
};

export const ANIMAL_OPTIONS: { id: AnimalPref; label: string }[] = [
  { id: "dog", label: "강아지" },
  { id: "cat", label: "고양이" },
  { id: "any", label: "상관없음" },
];

export const GENDER_OPTIONS: { id: GenderPref; label: string }[] = [
  { id: "female", label: "암컷" },
  { id: "male", label: "수컷" },
  { id: "any", label: "상관없음" },
];

export const CHANNEL_OPTIONS: {
  id: ChannelId;
  label: string;
  hint: string;
}[] = [
  {
    id: "visit",
    label: "방문 분양",
    hint: "매장에 직접 가서 아이를 보고 데려오기",
  },
  {
    id: "delivery",
    label: "내가 있는 곳까지 배송",
    hint: "집·지정 장소로 안전하게 데려다주는 방식",
  },
  {
    id: "import",
    label: "수입견 / 수입묘",
    hint: "해외·특수 혈통 라인 관심 시",
  },
  {
    id: "rescue",
    label: "책임·무료 분양",
    hint: "유기·파양 연계 등 책임 분양",
  },
];

export const TIMING_OPTIONS: {
  id: TimingId;
  label: string;
  hint: string;
}[] = [
  {
    id: "immediate",
    label: "지금 즉시 분양",
    hint: "오늘·며칠 안에도 데려오고 싶어요",
  },
  {
    id: "reserve_ok",
    label: "예약 분양도 괜찮아요",
    hint: "좋은 아이면 기다리며 예약해도 됩니다",
  },
  {
    id: "within_1m",
    label: "한 달 안에",
    hint: "시즌·가격 변동을 조금 보면서 결정",
  },
  {
    id: "within_3m",
    label: "1~3개월 여유",
    hint: "여유 있게 비교·예약하며 고를래요",
  },
  {
    id: "flexible",
    label: "시기는 관계없어요",
    hint: "조건만 맞으면 언제든 OK",
  },
];

export const SHOP_PRIORITY_OPTIONS: {
  id: ShopPriorityId;
  label: string;
  hint: string;
}[] = [
  {
    id: "cheap",
    label: "분양가격이 최대한 저렴한 곳",
    hint: "시세·프로모션을 우선 비교하고 싶어요",
  },
  {
    id: "quality",
    label: "가격보다 아이의 인물이 최고인 곳",
    hint: "얼굴·성격·건강감이 더 중요해요",
  },
  {
    id: "large_store",
    label: "여러 마리를 볼 수 있는 대형 매장",
    hint: "한곳에서 다양하게 비교하고 싶어요",
  },
  {
    id: "breed_local",
    label: "동네여도 원하는 견종만 있으면 OK",
    hint: "규모보다 희망 품종 보유가 우선",
  },
];

export const CONCERN_OPTIONS: {
  id: ConcernId;
  label: string;
  short: string;
}[] = [
  {
    id: "health",
    label: "건강 및 질병 문제 (선천적 질병 등)",
    short: "건강·선천질환",
  },
  {
    id: "price",
    label: "분양 가격 및 숨겨진 추가 비용",
    short: "가격·추가비용",
  },
  {
    id: "fake",
    label: "허위매물·낚시성 광고에 대한 불신",
    short: "허위매물",
  },
  {
    id: "allergy",
    label: "털 알러지 및 주거 환경 문제",
    short: "알러지·주거",
  },
  {
    id: "aftercare",
    label: "사후 보증 및 관리 문제",
    short: "사후보증",
  },
];

export const SUGGESTED_BREEDS = [
  "말티즈",
  "푸들",
  "포메라니안",
  "비숑프리제",
  "치와와",
  "시츄",
  "요크셔테리어",
  "보스턴테리어",
  "화이트테리어",
  "웰시코기",
  "골든리트리버",
  "래브라도리트리버",
  "시바견",
  "진돗개",
  "프렌치불독",
  "렉돌",
  "페르시안",
  "스코티시폴드",
  "러시안블루",
  "브리티시숏헤어",
  "코리안숏헤어",
  "믹스견",
  "믹스묘",
];

export const ADOPT_WHEN_OPTIONS = [
  "6개월 이내",
  "1년 이내",
  "1~3년 전",
  "3~5년 전",
  "5년 이상 전",
];

export const ADOPT_WHERE_OPTIONS = [
  "펫샵",
  "분양 플랫폼",
  "브리더",
  "지인·지인소개",
  "보호소·유기동물",
  "기타",
];

export const ADOPT_COST_OPTIONS = [
  "무료·책임분양",
  "50만 원 미만",
  "50~100만 원",
  "100~200만 원",
  "200~300만 원",
  "300만 원 이상",
  "기억나지 않음",
];

/** 관리자가 등록·수정할 수 있는 안심제휴 펫샵 (추후 DB/관리자 연동용 구조) */
export type PartnerShopConfig = {
  id: string;
  name: string;
  regionBig: string;
  regionSmall: string;
  address: string;
  phone: string | null;
  kakaoUrl: string | null;
  image: string | null;
  tags: string[];
  href: string;
  animals: AnimalPref[];
  channels: ChannelId[];
  highlightConcerns: ConcernId[];
  active: boolean;
  pinned: boolean;
};

export const PARTNER_SHOPS: PartnerShopConfig[] = [
  {
    id: "partner-ud-seoul",
    name: "유아독존 안심분양 상담센터",
    regionBig: "서울",
    regionSmall: "강남구",
    address: "서울 강남권 · 전국 제휴샵 매칭 상담",
    phone: null,
    kakaoUrl: null,
    image: null,
    tags: ["#안심제휴", "#허위매물제로", "#철저한건강보증", "#상담매칭"],
    href: "/services/adoption",
    animals: ["dog", "cat", "any"],
    channels: ["visit", "delivery", "import"],
    highlightConcerns: ["health", "fake", "aftercare", "price"],
    active: true,
    pinned: true,
  },
];

export function emptyAnswers(): PetshopAnswers {
  return {
    animals: [],
    breed: "",
    breedAny: false,
    regionBig: "",
    regionSmall: "",
    regionAny: false,
    gender: "any",
    channels: [],
    timing: null,
    shopPriorities: [],
    concerns: [],
    hasPet: null,
    adoptWhen: "",
    adoptWhere: "",
    adoptCost: "",
    petGender: "",
    petBreed: "",
    contactName: "",
    contactPhone: "",
    memo: "",
  };
}

export function canProceedStep(
  step: number,
  a: PetshopAnswers
): { ok: boolean; message?: string } {
  if (step === 1) {
    if (!a.animals.length) return { ok: false, message: "희망 동물을 선택해 주세요." };
    if (!a.breedAny && !a.breed.trim())
      return { ok: false, message: "희망 견종/묘종을 입력하거나 ‘상관없음’을 체크해 주세요." };
    if (!a.regionAny && !a.regionBig)
      return { ok: false, message: "희망 지역을 선택하거나 ‘지역 관계없음’을 체크해 주세요." };
    return { ok: true };
  }
  if (step === 2) {
    if (!a.channels.length)
      return { ok: false, message: "선호하는 분양 방식을 하나 이상 선택해 주세요." };
    return { ok: true };
  }
  if (step === 3) {
    if (!a.timing)
      return { ok: false, message: "희망 분양 시기를 선택해 주세요." };
    if (!a.shopPriorities.length)
      return {
        ok: false,
        message: "샵을 고를 때 중요한 점을 하나 이상 선택해 주세요.",
      };
    return { ok: true };
  }
  if (step === 4) {
    if (!a.concerns.length)
      return { ok: false, message: "가장 걱정되는 항목을 하나 이상 선택해 주세요." };
    return { ok: true };
  }
  if (step === 5) {
    if (a.hasPet === null)
      return { ok: false, message: "현재 반려 여부를 선택해 주세요." };
    if (a.hasPet) {
      if (!a.adoptWhen.trim() || !a.adoptWhere.trim())
        return {
          ok: false,
          message: "입양 시기와 경로를 알려 주시면 매칭이 더 정확해져요.",
        };
    }
    return { ok: true };
  }
  return { ok: true };
}

const ADVICE_BY_CONCERN: Record<ConcernId, AdviceBlock> = {
  health: {
    id: "health",
    title: "건강·선천질환 체크포인트",
    body: "분양 전 부모견/부모묘 이력, 필수 접종·구충, 유전성 질환 검사 여부를 문서로 확인하세요. ‘건강합니다’ 구두 약속만으로는 부족합니다.",
    checkpoints: [
      "분양 계약서에 건강보증 기간·범위가 명시되어 있는지",
      "최근 수의사 검진 기록·접종 수첩을 직접 확인",
      "품종별 다발 질환(슬개골, 심장, 호흡기 등) 검사 여부",
    ],
  },
  price: {
    id: "price",
    title: "가격·추가비용 투명성",
    body: "분양가 외에 중성화, 마이크로칩, 운송, ‘케어패키지’ 등 필수 추가비가 있는지 미리 목록으로 받아 두세요.",
    checkpoints: [
      "견적서에 포함된 항목 / 별도 청구 항목 구분",
      "계약금·잔금·환불 조건 서면 확인",
      "동일 품종·연령대 시세와 비교 (과도한 할인도 주의)",
    ],
  },
  fake: {
    id: "fake",
    title: "허위매물·낚시성 광고 대응",
    body: "사진만 보고 송금하지 마세요. 실물·부모견 확인, 사업자·매장 주소, 후기 교차검증이 안심 분양의 기본입니다.",
    checkpoints: [
      "방문 또는 화상으로 실물 확인 후 계약",
      "동일 사진이 여러 업체·플랫폼에 중복되는지 검색",
      "유아독존 안심제휴·등록 업체 우선 검토",
    ],
  },
  allergy: {
    id: "allergy",
    title: "알러지·주거 환경 점검",
    body: "‘저알러지 견종’도 개인차가 큽니다. 가족 알러지 테스트, 환기·청소 루틴, 아파트 규약을 먼저 점검하세요.",
    checkpoints: [
      "가능하면 짧은 만남으로 알러지 반응 확인",
      "털갈이·그루밍 주기와 주거 형태 맞추기",
      "단지·임대 계약상 반려동물 가능 여부",
    ],
  },
  aftercare: {
    id: "aftercare",
    title: "사후 보증·관리",
    body: "분양 후 상담 창구, 건강 이상 시 절차, 훈련·미용 연계 지원이 있는지 확인하면 장기적으로 훨씬 안심됩니다.",
    checkpoints: [
      "보증 기간·연락 채널(카톡·전화) 명시",
      "이상 증상 시 병원·샵 협진 프로세스",
      "초기 적응·훈련 가이드 제공 여부",
    ],
  },
};

function animalLabel(ids: AnimalPref[]) {
  if (ids.includes("any") || (ids.includes("dog") && ids.includes("cat")))
    return "강아지·고양이";
  if (ids.includes("dog")) return "강아지";
  if (ids.includes("cat")) return "고양이";
  return "반려동물";
}

function channelLabels(ids: ChannelId[]) {
  return ids
    .map((id) => CHANNEL_OPTIONS.find((c) => c.id === id)?.label)
    .filter(Boolean) as string[];
}

function timingLabel(id: TimingId | null) {
  if (!id) return null;
  return TIMING_OPTIONS.find((t) => t.id === id)?.label ?? null;
}

function shopPriorityLabels(ids: ShopPriorityId[]) {
  return ids
    .map((id) => SHOP_PRIORITY_OPTIONS.find((p) => p.id === id)?.label)
    .filter(Boolean) as string[];
}

function concernLabels(ids: ConcernId[]) {
  return ids
    .map((id) => CONCERN_OPTIONS.find((c) => c.id === id)?.short)
    .filter(Boolean) as string[];
}

const ADVICE_BY_TIMING: Partial<Record<TimingId, AdviceBlock>> = {
  immediate: {
    id: "timing-immediate",
    title: "즉시 분양 시 체크",
    body: "바로 데려가려면 ‘지금 있는 아이’ 기준으로 건강·접종·계약서를 당일 확인하세요. 급한 마음에 사진만 보고 계약하지 않는 것이 중요합니다.",
    checkpoints: [
      "오늘·이번 주 분양 가능 개체 리스트를 먼저 요청",
      "즉시 분양가도 시즌·재고에 따라 다르니 동일 품종 시세 비교",
      "데려간 날 케이지·사료·병원 연계까지 준비",
    ],
  },
  reserve_ok: {
    id: "timing-reserve",
    title: "예약 분양 활용 팁",
    body: "예약은 원하는 인물·성별을 고르기 좋고, 시기에 따라 분양가가 달라질 수 있습니다. 예약금·인도일·환불 조건을 문서로 받으세요.",
    checkpoints: [
      "예약금 비율·환불·일정 변경 조건 확인",
      "부모견/성장 사진·영상 주기적 공유 여부",
      "인도 예정일과 배송·방문 방식 확정",
    ],
  },
  within_1m: {
    id: "timing-1m",
    title: "한 달 안 분양 계획",
    body: "한 달 여유면 시즌 프로모션과 재고 변동을 보며 가격·인물을 함께 비교하기 좋습니다.",
    checkpoints: [
      "2~3곳 견적을 같은 기준으로 받아 비교",
      "희망 주차에 맞춰 예약·즉시 물량 둘 다 문의",
    ],
  },
  within_3m: {
    id: "timing-3m",
    title: "여유 일정 분양",
    body: "1~3개월이면 원하는 인물 예약과 가격대 조율이 모두 가능합니다. 다만 너무 미루면 인기 개체는 먼저 나갈 수 있어요.",
    checkpoints: [
      "우선순위(가격 vs 인물)를 상담사에게 미리 전달",
      "중간 점검 일정(화상·방문)을 잡아 두기",
    ],
  },
};

const ADVICE_BY_PRIORITY: Partial<Record<ShopPriorityId, AdviceBlock>> = {
  cheap: {
    id: "prio-cheap",
    title: "저렴한 분양가 중심일 때",
    body: "최저가만 보면 숨은 추가비·건강 리스크가 생길 수 있습니다. ‘최종 데려가는 총비용’으로 비교하세요.",
    checkpoints: [
      "분양가 + 접종·칩·중성화·배송비 합산 견적",
      "과도한 할인·당일 특가는 건강보증 범위를 재확인",
    ],
  },
  quality: {
    id: "prio-quality",
    title: "아이 인물·퀄리티 우선",
    body: "가격보다 인물이 중요하면, 실물·영상으로 성격·이목구비를 확인하고 부모견 라인도 함께 보세요.",
    checkpoints: [
      "여러 개체 비교 후 결정 (한 장 사진만으로 결정 금지)",
      "성격·활동량·얼굴형 우선순위를 상담에 명시",
    ],
  },
  large_store: {
    id: "prio-large",
    title: "대형 매장에서 고를 때",
    body: "여러 마리를 한곳에서 볼 수 있어 비교에 유리합니다. 대신 위생·개체 관리 상태를 꼼꼼히 보세요.",
    checkpoints: [
      "케이지·환기·청결 상태와 직원 응대 확인",
      "원하는 품종 재고가 많은지 방문 전 문의",
    ],
  },
  breed_local: {
    id: "prio-breed-local",
    title: "동네 샵 + 희망 품종",
    body: "규모보다 희망 견종/묘종 보유가 우선이라면, 가까운 제휴샵부터 재고를 확인하고 없으면 배송·연계 분양을 열어 두세요.",
    checkpoints: [
      "희망 품종·성별·나이 조건을 먼저 알리고 재고 확인",
      "동네 샵에 없으면 인근·배송 가능 제휴샵 매칭 요청",
    ],
  },
};

export function buildAdvice(
  concerns: ConcernId[],
  timing: TimingId | null,
  priorities: ShopPriorityId[]
): AdviceBlock[] {
  const blocks: AdviceBlock[] = [];
  if (timing && ADVICE_BY_TIMING[timing]) {
    blocks.push(ADVICE_BY_TIMING[timing]!);
  }
  for (const p of priorities) {
    const block = ADVICE_BY_PRIORITY[p];
    if (block) blocks.push(block);
  }
  const ordered = concerns.length
    ? concerns
    : (["health", "fake"] as ConcernId[]);
  for (const id of ordered) blocks.push(ADVICE_BY_CONCERN[id]);
  return blocks;
}

export function matchPartnerShops(a: PetshopAnswers): MatchedShop[] {
  const wantsDog = a.animals.includes("dog") || a.animals.includes("any");
  const wantsCat = a.animals.includes("cat") || a.animals.includes("any");

  return PARTNER_SHOPS.filter((p) => p.active)
    .filter((p) => {
      if (a.regionAny || !a.regionBig) return true;
      if (p.pinned) return true;
      return p.regionBig === a.regionBig;
    })
    .filter((p) => {
      if (a.animals.includes("any") || !a.animals.length) return true;
      if (wantsDog && p.animals.some((x) => x === "dog" || x === "any"))
        return true;
      if (wantsCat && p.animals.some((x) => x === "cat" || x === "any"))
        return true;
      return p.animals.includes("any");
    })
    .sort((x, y) => Number(y.pinned) - Number(x.pinned))
    .map((p) => {
      const overlap = p.highlightConcerns.filter((c) =>
        a.concerns.includes(c)
      );
      const reason =
        overlap.length > 0
          ? `선택하신 우려(${overlap
              .map((c) => CONCERN_OPTIONS.find((o) => o.id === c)?.short)
              .join(", ")})에 맞는 안심제휴 매칭`
          : "유아독존 안심제휴 · 우선 상담 매칭";
      return {
        id: p.id,
        name: p.name,
        region: `${p.regionBig} ${p.regionSmall}`.trim(),
        address: p.address,
        phone: p.phone,
        kakaoUrl: p.kakaoUrl,
        image: p.image,
        tags: p.tags,
        isPartner: true,
        href: p.href,
        matchReason: reason,
      } satisfies MatchedShop;
    });
}

export function tagsForListing(opts: {
  isPremium: boolean;
  channels: ChannelId[];
  concerns: ConcernId[];
  shopPriorities?: ShopPriorityId[];
  serviceInfo: string | null;
}): string[] {
  const tags: string[] = [];
  if (opts.isPremium) tags.push("#추천분양업체");
  if (opts.channels.includes("visit")) tags.push("#방문분양");
  if (opts.channels.includes("delivery")) tags.push("#배송가능");
  if (opts.channels.includes("import") || /수입/.test(opts.serviceInfo || ""))
    tags.push("#수입견묘");
  if (opts.channels.includes("rescue") || /책임|무료|유기|파양/.test(opts.serviceInfo || ""))
    tags.push("#책임무료분양");
  if (opts.shopPriorities?.includes("cheap")) tags.push("#가성비");
  if (opts.shopPriorities?.includes("quality")) tags.push("#인물우선");
  if (opts.shopPriorities?.includes("large_store")) tags.push("#대형매장");
  if (opts.shopPriorities?.includes("breed_local")) tags.push("#희망견종");
  if (opts.concerns.includes("fake")) tags.push("#허위매물제로");
  if (opts.concerns.includes("health")) tags.push("#철저한건강보증");
  if (opts.concerns.includes("aftercare")) tags.push("#사후케어");
  if (!tags.length) tags.push("#펫샵분양");
  return [...new Set(tags)].slice(0, 4);
}

export function buildCrmPayload(
  a: PetshopAnswers,
  shops: MatchedShop[]
): { payload: Record<string, unknown>; text: string } {
  const genderLabel =
    GENDER_OPTIONS.find((g) => g.id === a.gender)?.label ?? "상관없음";
  const payload = {
    tool: "petshop-curation",
    toolLabel: "유아독존 펫샵선택도우미",
    submittedAt: new Date().toISOString(),
    preference: {
      animals: a.animals.map((id) => animalLabel([id])),
      breed: a.breedAny ? "견종/묘종 상관없음" : a.breed.trim(),
      region: a.regionAny
        ? "지역 관계없음"
        : [a.regionBig, a.regionSmall].filter(Boolean).join(" "),
      gender: genderLabel,
      channels: channelLabels(a.channels),
      timing: timingLabel(a.timing),
      shopPriorities: shopPriorityLabels(a.shopPriorities),
      concerns: concernLabels(a.concerns),
    },
    petHistory: {
      hasPet: a.hasPet,
      adoptWhen: a.adoptWhen || null,
      adoptWhere: a.adoptWhere || null,
      adoptCost: a.adoptCost || null,
      petGender: a.petGender || null,
      petBreed: a.petBreed || null,
    },
    contact: {
      name: a.contactName.trim() || null,
      phone: a.contactPhone.trim() || null,
      memo: a.memo.trim() || null,
    },
    matchedShops: shops.map((s) => ({
      id: s.id,
      name: s.name,
      region: s.region,
      isPartner: s.isPartner,
      href: s.href,
    })),
  };

  const lines = [
    "[유아독존 펫샵선택도우미 상담요약]",
    `희망동물: ${animalLabel(a.animals)}`,
    `희망품종: ${a.breedAny ? "상관없음" : a.breed.trim() || "-"}`,
    `희망지역: ${
      a.regionAny
        ? "관계없음"
        : [a.regionBig, a.regionSmall].filter(Boolean).join(" ") || "-"
    }`,
    `성별선호: ${genderLabel}`,
    `분양경로: ${channelLabels(a.channels).join(", ") || "-"}`,
    `희망시기: ${timingLabel(a.timing) || "-"}`,
    `샵우선순위: ${shopPriorityLabels(a.shopPriorities).join(", ") || "-"}`,
    `주요우려: ${concernLabels(a.concerns).join(", ") || "-"}`,
    `기존반려: ${
      a.hasPet === true ? "예" : a.hasPet === false ? "아니오" : "-"
    }`,
  ];
  if (a.hasPet) {
    lines.push(
      `  - 입양시기: ${a.adoptWhen || "-"}`,
      `  - 입양경로: ${a.adoptWhere || "-"}`,
      `  - 당시비용: ${a.adoptCost || "-"}`,
      `  - 성별/품종: ${[a.petGender, a.petBreed].filter(Boolean).join(" / ") || "-"}`
    );
  }
  if (a.contactName || a.contactPhone) {
    lines.push(
      `연락처: ${a.contactName || "-"} / ${a.contactPhone || "-"}`
    );
  }
  if (a.memo.trim()) lines.push(`메모: ${a.memo.trim()}`);
  if (shops.length) {
    lines.push("매칭샵:");
    shops.slice(0, 5).forEach((s, i) => {
      lines.push(`  ${i + 1}. ${s.name} (${s.region})${s.isPartner ? " · 안심제휴" : ""}`);
    });
  }
  lines.push(`작성시각: ${new Date().toLocaleString("ko-KR")}`);

  return { payload, text: lines.join("\n") };
}

export function buildCurationResult(
  a: PetshopAnswers,
  listingShops: MatchedShop[]
): CurationResult {
  const partners = matchPartnerShops(a);
  const partnerIds = new Set(partners.map((p) => p.id));
  const merged = [
    ...partners,
    ...listingShops.filter((s) => !partnerIds.has(s.id)),
  ].slice(0, 8);

  const breedLabel = a.breedAny ? "품종 무관" : a.breed.trim() || "희망 품종";
  const regionLabel = a.regionAny
    ? "전국"
    : [a.regionBig, a.regionSmall].filter(Boolean).join(" ") || "희망 지역";
  const timing = timingLabel(a.timing) || "시기 미정";
  const prio = shopPriorityLabels(a.shopPriorities).slice(0, 2).join(" · ");

  const { payload, text } = buildCrmPayload(a, merged);

  return {
    reportTitle: `${animalLabel(a.animals)} 맞춤 분양 큐레이션 리포트`,
    summaryLine: `${regionLabel} · ${breedLabel} · ${timing}${
      prio ? ` · ${prio}` : ""
    } 기준으로 가이드와 제휴샵을 정리했습니다.`,
    advice: buildAdvice(a.concerns, a.timing, a.shopPriorities),
    shops: merged,
    crmPayload: payload,
    crmText: text,
  };
}
