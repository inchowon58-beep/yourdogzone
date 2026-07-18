import type { PetSpecies } from "@/lib/tools/feeding";

export type FoodLevel = "danger" | "caution" | "safe";

export type FoodItem = {
  slug: string;
  name: string;
  emoji: string;
  image: string;
  imageAlt: string;
  dog: FoodLevel;
  cat: FoodLevel;
  oneLiner: string;
  /** 종별 한 줄 요약 */
  verdict: Record<PetSpecies, string>;
  why: string;
  /** 종별 추가 포인트 */
  speciesNote: Partial<Record<PetSpecies, string>>;
  symptoms: string[];
  actionSteps: string[];
  myths: { q: string; a: string }[];
  safeAlternatives: string[];
  keywords: string[];
};

export const FOOD_LEVEL_LABEL: Record<FoodLevel, string> = {
  danger: "위험",
  caution: "주의",
  safe: "가능",
};

export const FOOD_LEVEL_HINT: Record<FoodLevel, string> = {
  danger: "절대 급여 금지",
  caution: "조건·소량만",
  safe: "적정량 OK",
};

export const FOOD_LEVEL_TONE: Record<
  FoodLevel,
  { bg: string; text: string; ring: string; soft: string }
> = {
  danger: {
    bg: "bg-red-600",
    text: "text-red-700",
    ring: "ring-red-200",
    soft: "bg-red-50",
  },
  caution: {
    bg: "bg-amber-500",
    text: "text-amber-800",
    ring: "ring-amber-200",
    soft: "bg-amber-50",
  },
  safe: {
    bg: "bg-emerald-600",
    text: "text-emerald-800",
    ring: "ring-emerald-200",
    soft: "bg-emerald-50",
  },
};

/** 로컬 정적 이미지 (public/tools/food) — 외부 CDN 의존 제거 */
export const PET_FOODS: FoodItem[] = [
  {
    slug: "chocolate",
    name: "초콜릿",
    emoji: "🍫",
    image:
      "/tools/food/chocolate.jpg",
    imageAlt: "다크 초콜릿 조각",
    dog: "danger",
    cat: "danger",
    oneLiner: "테오브로민·카페인 — 소량도 심장·신경계에 독성",
    verdict: {
      dog: "다크·카카오 함량이 높을수록 위험도가 급상승합니다.",
      cat: "고양이도 동일하게 위험하며, 체중이 작아 더 빨리 위험 용량에 도달합니다.",
    },
    why: "카카오에 들어 있는 테오브로민과 카페인은 사람과 달리 개·고양이가 매우 천천히 분해합니다. 심박이 빨라지고 중추신경이 과흥분되며, 심한 경우 발작·부정맥으로 이어질 수 있습니다. 화이트 초콜릿은 상대적으로 카카오가 적지만 ‘안전’은 아니며, 지방·당분 부담도 큽니다.",
    speciesNote: {
      dog: "소형견은 쿠키 한 조각만으로도 중독량에 가까워질 수 있습니다.",
      cat: "고양이는 단맛을 잘 느끼지 못해도 호기심으로 먹을 수 있으니 보관에 주의하세요.",
    },
    symptoms: [
      "구토·설사",
      "과도한 침·헐떡임",
      "과흥분·떨림",
      "빠른 심장박동",
      "심한 경우 발작·허탈",
    ],
    actionSteps: [
      "먹은 시각·제품(다크/밀크/코코아 가루)·대략 양을 기록",
      "억지로 토하게 하지 말고 곧바로 동물병원·응급센터에 연락",
      "포장지·남은 조각을 가져가면 독성 추정에 도움이 됩니다",
    ],
    myths: [
      {
        q: "밀크 초콜릿은 괜찮다?",
        a: "카카오 함량이 낮을 뿐 ‘안전’이 아닙니다. 체중 대비 양에 따라 충분히 위험합니다.",
      },
      {
        q: "한 입만 먹었는데?",
        a: "한 입이라도 제품·체중에 따라 병원 상담이 맞습니다. 기다려 보다가 악화되는 경우가 많습니다.",
      },
    ],
    safeAlternatives: ["강아지/고양이 전용 간식", "동결건조 육류 트릿", "소량 블루베리"],
    keywords: ["초콜릿", "테오브로민", "카페인"],
  },
  {
    slug: "grape",
    name: "포도",
    emoji: "🍇",
    image:
      "/tools/food/grape.jpg",
    imageAlt: "신선한 포도송이",
    dog: "danger",
    cat: "danger",
    oneLiner: "소량이라도 급성 신장 손상의 보고가 있어요",
    verdict: {
      dog: "한 알만으로도 일부 개체에서 신부전이 보고됩니다. ‘안전한 양’이 정해져 있지 않습니다.",
      cat: "고양이 사례 보고는 개보다 적지만, 동일하게 급여를 금지하는 것이 안전합니다.",
    },
    why: "포도·건포도의 정확한 독성 성분은 아직 완전히 규명되지 않았지만, 섭취 후 급성 신장 손상이 반복적으로 보고됩니다. 씨 없는 포도·껍질 제거와도 무관하며, ‘우리 아이는 예전에 먹어도 괜찮았다’는 경험이 안전을 보장하지 않습니다.",
    speciesNote: {
      dog: "과일 바구니·식탁 위 포도를 특히 주의하세요.",
      cat: "주스·잼·건포도 베이커리에도 성분이 들어갈 수 있습니다.",
    },
    symptoms: ["반복 구토", "무기력·식욕 저하", "복통", "소변량 감소·무뇨", "갈증 증가"],
    actionSteps: [
      "섭취가 확인되면 양이 적어도 즉시 병원에 알리세요",
      "최근 음수량·소변 상태를 함께 전달하면 진료에 도움이 됩니다",
      "임의로 이뇨제·민간요법을 쓰지 마세요",
    ],
    myths: [
      {
        q: "씨만 빼면 괜찮다?",
        a: "독성은 씨와 무관하게 보고됩니다. 과육도 위험합니다.",
      },
    ],
    safeAlternatives: ["사과 과육(씨 제거)", "블루베리 소량", "전용 과일맛 펫트릿"],
    keywords: ["포도", "신부전", "독성"],
  },
  {
    slug: "raisin",
    name: "건포도",
    emoji: "🍇",
    image:
      "/tools/food/raisin.jpg",
    imageAlt: "건포도",
    dog: "danger",
    cat: "danger",
    oneLiner: "농축된 포도 — 쿠키·시리얼에 숨겨져 있어요",
    verdict: {
      dog: "베이커리·시리얼·그래놀라에 섞여 사고로 먹는 경우가 많습니다.",
      cat: "고양이도 급여 금지. 사람 간식을 절대 공유하지 마세요.",
    },
    why: "건포도는 수분이 빠져 성분이 농축된 형태로, 포도과 독성의 대표 위험 식품입니다. 시나몬 건포도 빵, 시리얼, 에너지바 등 ‘안 보이는 재료’로 들어가는 경우가 많아 보호자가 늦게 알아차리기 쉽습니다.",
    speciesNote: {},
    symptoms: ["구토", "설사", "무기력", "소변 이상", "탈수"],
    actionSteps: [
      "포장 성분표를 확인하며 섭취 시각을 병원에 전달",
      "증상이 없어도 조기 처치가 예후를 바꿉니다",
    ],
    myths: [
      {
        q: "유기농 건포도는 괜찮다?",
        a: "재배 방식과 무관하게 위험합니다.",
      },
    ],
    safeAlternatives: ["펫 전용 져키", "당근 스틱", "호박 퓨레 소량"],
    keywords: ["건포도", "포도"],
  },
  {
    slug: "onion",
    name: "양파",
    emoji: "🧅",
    image:
      "/tools/food/onion.jpg",
    imageAlt: "자른 양파",
    dog: "danger",
    cat: "danger",
    oneLiner: "황화합물이 적혈구를 파괴 → 용혈성 빈혈",
    verdict: {
      dog: "생·익힘·분말·국물 모두 위험합니다. ‘조금’도 누적될 수 있어요.",
      cat: "고양이는 개보다 더 민감하다는 보고가 있어 절대 공유하지 마세요.",
    },
    why: "양파 속 n-프로필 디설파이드 등 황화합물은 적혈구막을 손상시켜 용혈을 일으킵니다. 찌개·카레·볶음밥·분말 시즈닝처럼 눈에 잘 안 띄는 형태로도 섭취됩니다. 증상이 수일 뒤에 나타날 수 있어, 괜찮아 보여도 방심하면 안 됩니다.",
    speciesNote: {
      cat: "고양이에게는 더 적은 양으로도 문제가 될 수 있습니다.",
    },
    symptoms: [
      "무기력·운동 싫어함",
      "창백한 잇몸",
      "빠른 호흡",
      "붉은·갈색 소변",
      "식욕 저하",
    ],
    actionSteps: [
      "국물·소스까지 포함해 섭취량을 추정해 병원에 알리세요",
      "빈혈 여부를 혈액검사로 확인하는 것이 중요합니다",
    ],
    myths: [
      {
        q: "익히면 독이 없어진다?",
        a: "가열해도 독성 성분은 남습니다.",
      },
    ],
    safeAlternatives: ["플레인 닭가슴살(무조미)", "호박", "펫 전용 습식"],
    keywords: ["양파", "빈혈", "용혈"],
  },
  {
    slug: "garlic",
    name: "마늘",
    emoji: "🧄",
    image:
      "/tools/food/garlic.jpg",
    imageAlt: "마늘 쪽",
    dog: "danger",
    cat: "danger",
    oneLiner: "양파와 같은 알리움 속 — ‘건강에 좋다’는 속설 주의",
    verdict: {
      dog: "천연 구충·면역 속설이 있지만 반려동물에게는 빈혈 위험이 우선입니다.",
      cat: "보충제·수제 간식 레시피에도 마늘이 들어가는 경우가 있으니 성분 확인이 필수입니다.",
    },
    why: "마늘은 양파와 같은 알리움(Allium) 속으로, 적혈구 손상을 유발할 수 있습니다. 분말·오일·추출물 형태는 농축되어 더 위험할 수 있습니다. SNS의 ‘천연 레시피’를 그대로 따라 하지 마세요.",
    speciesNote: {},
    symptoms: ["무기력", "구토", "빈혈 징후", "심박수 증가"],
    actionSteps: [
      "보충제·수제 간식 성분표를 병원에 보여 주세요",
      "반복 소량 급여도 누적 독성이 될 수 있습니다",
    ],
    myths: [
      {
        q: "소량은 면역에 좋다?",
        a: "반려동물 영양학에서는 이득보다 위험이 큽니다. 추천하지 않습니다.",
      },
    ],
    safeAlternatives: ["수의사 추천 영양제", "오메가3(펫용)", "덴탈 트릿"],
    keywords: ["마늘", "알리움"],
  },
  {
    slug: "green-onion",
    name: "파·부추",
    emoji: "🌿",
    image:
      "/tools/food/green-onion.jpg",
    imageAlt: "대파",
    dog: "danger",
    cat: "danger",
    oneLiner: "파·쪽파·부추도 양파 패밀리입니다",
    verdict: {
      dog: "찌개 건더기·계란말이 파 등 ‘한 입’ 사고가 흔합니다.",
      cat: "주방에서 떨어지는 파 조각을 줍지 못하게 치우세요.",
    },
    why: "파·쪽파·부추·마늘쫑 등도 알리움 계열로 적혈구 손상 위험이 있습니다. ‘향만 냈다’ 수준의 국물이라도 다량·반복이면 부담이 됩니다.",
    speciesNote: {},
    symptoms: ["구토", "설사", "무기력", "빈혈 징후"],
    actionSteps: ["섭취 형태(생/익힘/국물)를 구분해 병원에 전달"],
    myths: [],
    safeAlternatives: ["무조미 채소(당근·호박)", "펫 습식"],
    keywords: ["파", "부추"],
  },
  {
    slug: "xylitol",
    name: "자일리톨",
    emoji: "🍬",
    image:
      "/tools/food/xylitol.jpg",
    imageAlt: "껌과 사탕",
    dog: "danger",
    cat: "caution",
    oneLiner: "개에게는 초응급 — 껌·일부 땅콩버터·베이커리에 숨음",
    verdict: {
      dog: "섭취 후 급격한 저혈당·간손상이 올 수 있어 즉시 응급 대응이 필요합니다.",
      cat: "개만큼 보고가 많진 않지만, 감미료 제품은 공유하지 않는 것이 원칙입니다.",
    },
    why: "자일리톨(xylitol)은 개에서 인슐린을 급격히 분비시켜 저혈당을 일으키고, 고용량에서는 간손상과 연관됩니다. 무설탕 껌, 일부 땅콩버터, 당뇨용 과자, 액체 약 등에 들어 있습니다. 성분표의 ‘xylitol’ ‘자일리톨’ ‘자일리토’를 반드시 확인하세요.",
    speciesNote: {
      dog: "체중 대비 아주 소량으로도 위험할 수 있습니다.",
    },
    symptoms: ["구토", "무기력", "비틀거림", "경련", "허탈"],
    actionSteps: [
      "섭취 즉시 응급 동물병원으로 이동",
      "제품명·성분표 사진을 찍어두세요",
      "가정에서 설탕물만 먹이는 ‘민간응급’에만 의존하지 마세요",
    ],
    myths: [
      {
        q: "천연 감미료니까 안전하다?",
        a: "사람에게 비교적 안전한 것과 반려동물 독성은 완전히 다릅니다.",
      },
    ],
    safeAlternatives: ["자일리톨 무첨가 펫트릿", "플레인 동결건조 육류"],
    keywords: ["자일리톨", "저혈당", "껌"],
  },
  {
    slug: "alcohol",
    name: "알코올",
    emoji: "🍷",
    image:
      "/tools/food/alcohol.jpg",
    imageAlt: "와인 잔",
    dog: "danger",
    cat: "danger",
    oneLiner: "술·발효 반죽·일부 디저트까지 포함",
    verdict: {
      dog: "소량도 중추신경 억제·저혈당·산증을 유발할 수 있습니다.",
      cat: "체구가 작아 위험 용량에 더 빨리 도달합니다.",
    },
    why: "에탄올은 반려동물에게 중독 증상을 일으킵니다. 맥주·와인뿐 아니라 발효 중인 빵 반죽(부풀어 오르며 알코올·가스를 만듦), 럼이 들어간 케이크 등도 위험합니다.",
    speciesNote: {},
    symptoms: ["비틀거림", "구토", "호흡 저하", "저체온", "허탈"],
    actionSteps: ["섭취량과 음료 종류를 알리고 즉시 진료"],
    myths: [],
    safeAlternatives: ["펫 전용 음수 가향(수의사 확인)", "일반 물"],
    keywords: ["알코올", "술"],
  },
  {
    slug: "caffeine",
    name: "카페인",
    emoji: "☕",
    image:
      "/tools/food/caffeine.jpg",
    imageAlt: "커피 잔",
    dog: "danger",
    cat: "danger",
    oneLiner: "커피·에너지음료·티백·원두 찌꺼기까지",
    verdict: {
      dog: "원두·찌꺼기를 주워 먹는 사고가 흔합니다.",
      cat: "테이블 위 잔을 핥지 못하게 치우세요.",
    },
    why: "카페인은 메틸잔틴 계열로 심장·신경계를 자극합니다. 커피·차·에너지음료·카페인 알약·커피 찌꺼기 모두 해당됩니다.",
    speciesNote: {},
    symptoms: ["과흥분", "떨림", "빈맥", "구토", "발열"],
    actionSteps: ["제품과 대략 양을 기록 후 병원 문의"],
    myths: [],
    safeAlternatives: ["펫 전용 음료", "시원한 물"],
    keywords: ["카페인", "커피"],
  },
  {
    slug: "macadamia",
    name: "마카다미아",
    emoji: "🥜",
    image:
      "/tools/food/macadamia.jpg",
    imageAlt: "견과류",
    dog: "danger",
    cat: "caution",
    oneLiner: "개에서 보행 이상·떨림이 특징적으로 보고됩니다",
    verdict: {
      dog: "소량에서도 무기력·뒷다리 힘 빠짐이 나타날 수 있습니다.",
      cat: "고지방 견과류는 췌장 부담 — 급여하지 마세요.",
    },
    why: "마카다미아 넛츠는 개에서 독성으로 잘 알려져 있으며, 정확한 기전은 완전히 밝혀지지 않았습니다. 초콜릿과 섞인 제품은 위험이 배가됩니다.",
    speciesNote: {},
    symptoms: ["무기력", "구토", "뒷다리 힘 빠짐", "떨림", "발열"],
    actionSteps: ["섭취 확인 시 병원 상담 — 대개 보조 치료로 회복하지만 조기 평가가 안전"],
    myths: [],
    safeAlternatives: ["펫 전용 져키", "단호박"],
    keywords: ["마카다미아", "견과"],
  },
  {
    slug: "avocado",
    name: "아보카도",
    emoji: "🥑",
    image:
      "/tools/food/avocado.jpg",
    imageAlt: "아보카도",
    dog: "caution",
    cat: "caution",
    oneLiner: "페르신·고지방·씨 질식 위험",
    verdict: {
      dog: "과육 소량보다 씨·껍질·과다 지방이 더 큰 문제입니다.",
      cat: "고지방은 췌장염 위험을 높입니다. 급여하지 않는 편이 낫습니다.",
    },
    why: "아보카도의 페르신(persin)은 종에 따라 독성 민감도가 다릅니다. 개·고양이에서는 대량·씨 질식·췌장 부담이 현실적인 위험입니다.",
    speciesNote: {},
    symptoms: ["구토", "설사", "무기력", "복통"],
    actionSteps: ["씨를 삼켰다면 즉시 병원 — 장폐색 가능성"],
    myths: [
      {
        q: "슈퍼푸드니까 매일 주면 좋다?",
        a: "사람 기준 영양 트렌드를 반려동물에게 그대로 적용하면 안 됩니다.",
      },
    ],
    safeAlternatives: ["블루베리", "당근", "펫 습식"],
    keywords: ["아보카도", "페르신"],
  },
  {
    slug: "raw-salmon",
    name: "생연어·생식 생선",
    emoji: "🍣",
    image:
      "/tools/food/raw-salmon.jpg",
    imageAlt: "연어 회",
    dog: "caution",
    cat: "caution",
    oneLiner: "기생충·세균·비타민B1 파괴 효소 이슈",
    verdict: {
      dog: "충분히 익히면 좋은 단백질원이 될 수 있습니다. 생 급여는 위험 부담이 큽니다.",
      cat: "생식이 유행이지만, 위생·균형·기생충 관리 없는 생연어는 추천하지 않습니다.",
    },
    why: "익히지 않은 연어 등 일부 생선은 기생충·세균 위험이 있고, 일부 생생선은 티아미나아제(비타민 B1 분해) 문제로 장기 급여 시 신경 증상이 보고됩니다. ‘신선한 회’가 반려동물에게도 신선·안전이라는 뜻은 아닙니다.",
    speciesNote: {
      cat: "고양이는 생선 향에 강하게 끌리므로 주방에서 특히 주의하세요.",
    },
    symptoms: ["구토", "설사", "발열", "무기력", "장기 시 신경증상 가능"],
    actionSteps: ["생으로 먹었다면 24~48시간 상태 관찰, 이상 시 진료"],
    myths: [
      {
        q: "야생성이니까 생식이 본능에 맞다?",
        a: "가정 고양이는 위생·영양 균형이 통제된 환경이 더 안전합니다.",
      },
    ],
    safeAlternatives: ["충분히 익힌 연어(무조미)", "펫 전용 연어 습식"],
    keywords: ["생연어", "생식"],
  },
  {
    slug: "chicken-bone",
    name: "조리된 뼈",
    emoji: "🦴",
    image:
      "/tools/food/chicken-bone.jpg",
    imageAlt: "닭고기",
    dog: "danger",
    cat: "danger",
    oneLiner: "익힌 뼈는 쉽게 쪼개져 소화기를 찌릅니다",
    verdict: {
      dog: "치킨 뼈·갈비뼈 ‘남은 거’ 공유는 응급실로 가는 대표 원인입니다.",
      cat: "작은 뼈 조각도 식도·장에 위험합니다.",
    },
    why: "조리 과정에서 뼈가 건조·취약해져 날카롭게 부러집니다. 식도 열상, 위장 천공, 변비·폐색을 유발할 수 있습니다. 생뼈 급여도 논쟁적이며, 가정에서 임의 급여는 권하지 않습니다.",
    speciesNote: {},
    symptoms: ["구역질·헛구역질", "침 과다", "통증", "식욕 저하", "혈변·변비"],
    actionSteps: ["삼킴이 의심되면 즉시 병원 — 엑스레이/내시경 평가"],
    myths: [
      {
        q: "이가 튼튼해진다?",
        a: "덴탈 효과가 있더라도 천공 위험이 훨씬 큽니다. 전용 덴탈케어를 쓰세요.",
      },
    ],
    safeAlternatives: ["덴탈껌(크기 맞는 제품)", "당근", "수의사 추천 츄"],
    keywords: ["닭뼈", "뼈"],
  },
  {
    slug: "moldy-food",
    name: "곰팡이·상한 음식",
    emoji: "🧫",
    image:
      "/tools/food/moldy-food.jpg",
    imageAlt: "상한 음식 개념 이미지",
    dog: "danger",
    cat: "danger",
    oneLiner: "곰팡이 독소는 신경 증상을 유발할 수 있어요",
    verdict: {
      dog: "쓰레기통·컴포스트를 뒤지는 사고에 주의하세요.",
      cat: "남긴 통조림을 실온에 오래 두지 마세요.",
    },
    why: "일부 곰팡이가 만드는 독소(마이코톡신)는 떨림·경련 등 신경계 증상을 유발할 수 있습니다. ‘조금 상한 정도’라도 반려동물에게는 위험할 수 있습니다.",
    speciesNote: {},
    symptoms: ["구토", "떨림", "경련", "무기력", "발열"],
    actionSteps: ["응급으로 간주하고 즉시 진료"],
    myths: [],
    safeAlternatives: ["신선한 펫푸드", "개봉 후 냉장·기한 준수"],
    keywords: ["곰팡이", "상한음식"],
  },
  {
    slug: "apple",
    name: "사과",
    emoji: "🍎",
    image:
      "/tools/food/apple.jpg",
    imageAlt: "사과",
    dog: "caution",
    cat: "caution",
    oneLiner: "과육은 OK 후보 — 씨·꼭지·과다 당분은 NO",
    verdict: {
      dog: "얇게 썰어 씨·심을 제거한 과육만 소량.",
      cat: "고양이는 과일에 큰 관심이 없어도, 줄 때는 동일 규칙을 적용하세요.",
    },
    why: "사과 과육은 수분·식이섬유를 제공하지만, 씨에는 시안화물 전구물질이 있고 심·꼭지는 질식·소화 부담 위험이 있습니다. 당분이 있어 비만·당뇨 관리 중이면 더욱 제한하세요.",
    speciesNote: {},
    symptoms: ["과다 시 설사", "가스"],
    actionSteps: ["처음엔 1~2조각만 주고 변 상태를 확인"],
    myths: [],
    safeAlternatives: ["블루베리", "당근"],
    keywords: ["사과"],
  },
  {
    slug: "banana",
    name: "바나나",
    emoji: "🍌",
    image:
      "/tools/food/banana.jpg",
    imageAlt: "바나나",
    dog: "caution",
    cat: "caution",
    oneLiner: "칼륨·섬유질 OK, 당분 높아 간식 칼로리 관리 필수",
    verdict: {
      dog: "하루 간식 칼로리(보통 일일 열량의 10% 이내) 안에서 얇은 슬라이스.",
      cat: "필수는 아닙니다. 줘도 아주 소량만.",
    },
    why: "바나나는 부드럽게 으깨 약 복용에 쓰이기도 하지만, 당분이 높아 체중 관리견·묘에게는 독이 될 수 있습니다. 껍질은 소화에 부담이므로 급여하지 마세요.",
    speciesNote: {},
    symptoms: ["과다 시 설사"],
    actionSteps: ["으깬 바나나 ½작은술부터"],
    myths: [],
    safeAlternatives: ["호박 퓨레", "펫트릿"],
    keywords: ["바나나"],
  },
  {
    slug: "strawberry",
    name: "딸기",
    emoji: "🍓",
    image:
      "/tools/food/strawberry.jpg",
    imageAlt: "딸기",
    dog: "caution",
    cat: "caution",
    oneLiner: "씻고 꼭지 제거 후 소량 — 농약·당분 주의",
    verdict: {
      dog: "항산화 간식으로 인기. 그래도 ‘사람 기준 한 컵’은 과합니다.",
      cat: "관심 없으면 억지로 줄 필요 없습니다.",
    },
    why: "딸기는 비타민·항산화 성분이 있지만 당분과 잔류 농약 가능성이 있습니다. 흐르는 물에 깨끗이 씻고 꼭지를 제거하세요.",
    speciesNote: {},
    symptoms: ["과다 시 설사"],
    actionSteps: ["1~2알부터"],
    myths: [],
    safeAlternatives: ["블루베리", "오이"],
    keywords: ["딸기"],
  },
  {
    slug: "sweet-potato",
    name: "고구마",
    emoji: "🍠",
    image:
      "/tools/food/sweet-potato.jpg",
    imageAlt: "고구마",
    dog: "caution",
    cat: "caution",
    oneLiner: "쪄서·무조미·소량 — 당분·섬유질 과다 주의",
    verdict: {
      dog: "훈련 보상·소화 보조로 쓰이지만 ‘고구마만’ 주식은 금지.",
      cat: "육식 성향이 강해 필수 아님. 줘도 아주 소량.",
    },
    why: "익힌 고구마는 수용성 섬유와 에너지를 제공하지만 당 지수가 높아 비만·췌장·당뇨 관리 시 제한이 필요합니다. 버터·설탕·맛탕은 절대 안 됩니다.",
    speciesNote: {},
    symptoms: ["과다 시 가스·설사 또는 변비"],
    actionSteps: ["찐 고구마를 식혀 작은 큐브로"],
    myths: [
      {
        q: "고구마만 먹이면 건강하다?",
        a: "완전 영양이 아닙니다. 사료를 대체하면 영양 결핍이 옵니다.",
      },
    ],
    safeAlternatives: ["단호박", "당근"],
    keywords: ["고구마"],
  },
  {
    slug: "egg",
    name: "계란",
    emoji: "🥚",
    image:
      "/tools/food/egg.jpg",
    imageAlt: "계란",
    dog: "caution",
    cat: "caution",
    oneLiner: "완숙은 좋은 단백질 — 생계란·소금·기름은 NO",
    verdict: {
      dog: "완전 익혀 간식으로. 매일 통란보다는 주 몇 회로.",
      cat: "익힌 계란 흰자/노른자 소량은 가능. 생은 비추천.",
    },
    why: "익힌 계란은 아미노산 프로필이 우수합니다. 생계란은 살모넬라 위험과 아비딘(비오틴 흡수 방해) 이슈가 있습니다. 간장·마요·버터 조리본은 나트륨·지방 폭탄입니다.",
    speciesNote: {},
    symptoms: ["과다 시 소화 불편", "생 급여 시 식중독 위험"],
    actionSteps: ["완숙란을 으깨어 사료에 소량 토핑"],
    myths: [],
    safeAlternatives: ["펫 전용 습식", "익힌 닭가슴살"],
    keywords: ["계란"],
  },
  {
    slug: "cheese",
    name: "치즈",
    emoji: "🧀",
    image:
      "/tools/food/cheese.jpg",
    imageAlt: "치즈",
    dog: "caution",
    cat: "caution",
    oneLiner: "훈련용 ‘한 콩’은 OK 후보 — 유당·나트륨·지방 체크",
    verdict: {
      dog: "저염·저지방 치즈를 손톱 크기로. 매일 간식으로는 부적합.",
      cat: "유당불내증·췌장 부담 가능성 — 더 엄격히 제한.",
    },
    why: "치즈는 훈련 보상에 자주 쓰이지만 유당, 소금, 지방이 높습니다. 블루치즈 등 곰팡이 치즈·양파/마늘 시즈닝 치즈는 위험합니다.",
    speciesNote: {},
    symptoms: ["설사", "구토", "췌장염 위험(고지방)"],
    actionSteps: ["저지방 코티지/모짜렐라를 극소량만"],
    myths: [],
    safeAlternatives: ["동결건조 트릿", "당근"],
    keywords: ["치즈"],
  },
  {
    slug: "milk",
    name: "우유",
    emoji: "🥛",
    image:
      "/tools/food/milk.jpg",
    imageAlt: "우유 잔",
    dog: "caution",
    cat: "caution",
    oneLiner: "성체 대다수는 유당 분해가 어려워요",
    verdict: {
      dog: "‘고소한 간식’으로 주기보다 펫밀크·물을 권장.",
      cat: "만화 속 고양이+우유 이미지는 과학과 다릅니다. 설사의 단골 원인.",
    },
    why: "이유 후 락타아제가 줄어 유당불내증이 흔합니다. 새끼에게 주는 모유 대체도 전용 분유를 써야 하며, 일반 우유의 영양 비율은 맞지 않습니다.",
    speciesNote: {
      cat: "젖당 없는 펫밀크라도 ‘필수’는 아닙니다. 깨끗한 물이 기본입니다.",
    },
    symptoms: ["설사", "가스", "복통"],
    actionSteps: ["일반 우유 중단 후 펫밀크로 대체 여부 상담"],
    myths: [
      {
        q: "고양이는 우유를 좋아하니까 줘야 한다?",
        a: "좋아하는 것과 소화할 수 있는 것은 다릅니다.",
      },
    ],
    safeAlternatives: ["물", "수의사 추천 펫밀크"],
    keywords: ["우유", "유당"],
  },
  {
    slug: "peanut-butter",
    name: "땅콩버터",
    emoji: "🥜",
    image:
      "/tools/food/peanut-butter.jpg",
    imageAlt: "땅콩버터",
    dog: "caution",
    cat: "caution",
    oneLiner: "성분표 첫 줄이 ‘땅콩’인지, 자일리톨인지부터",
    verdict: {
      dog: "무가당·무자일리톨만, 티스푼 이하. 장난감에 얇게 발라 사용.",
      cat: "필수도 아니고 고지방 — 굳이 줄 필요 없음.",
    },
    why: "순수 땅콩버터는 약 먹일 때 유용할 수 있지만, 일부 제품의 자일리톨은 개에게 치명적입니다. 고지방·고칼로리라 비만·췌장염 위험도 있습니다.",
    speciesNote: {},
    symptoms: ["과다 시 설사", "췌장 부담", "자일리톨 시 응급 증상"],
    actionSteps: ["구매 전 성분표 사진 확인 습관화"],
    myths: [],
    safeAlternatives: ["펫 전용 버터텍스처 트릿", "호박 퓨레"],
    keywords: ["땅콩버터", "자일리톨"],
  },
  {
    slug: "carrot",
    name: "당근",
    emoji: "🥕",
    image:
      "/tools/food/carrot.jpg",
    imageAlt: "당근",
    dog: "safe",
    cat: "safe",
    oneLiner: "저칼로리 씹기 간식 — 질식 방지 크기만 맞추면 굿",
    verdict: {
      dog: "생으로 아삭하게, 또는 살짝 쪄서. 훈련 보상으로 훌륭합니다.",
      cat: "육식을 선호하지만, 아주 소량의 익힌 당근은 대부분 무해합니다.",
    },
    why: "베타카로틴·식이섬유가 있고 칼로리가 낮아 체중 관리에도 유리합니다. 너무 큰 덩어리는 질식 위험이 있으니 길이·두께를 조절하세요.",
    speciesNote: {},
    symptoms: ["과다 시 묽은 변"],
    actionSteps: ["손가락 크기 스틱으로 잘라 급여"],
    myths: [],
    safeAlternatives: ["오이", "단호박"],
    keywords: ["당근"],
  },
  {
    slug: "blueberry",
    name: "블루베리",
    emoji: "🫐",
    image:
      "/tools/food/blueberry.jpg",
    imageAlt: "블루베리",
    dog: "safe",
    cat: "safe",
    oneLiner: "항산화 간식의 모범생 — 하루 몇 알이면 충분",
    verdict: {
      dog: "씻어서 그대로. 얼려서 여름 간식으로도 인기.",
      cat: "관심 있으면 1~2알. 없어도 문제 없습니다.",
    },
    why: "항산화 물질이 풍부하고 칼로리가 낮습니다. 건블루베리·당절임·파이 필링은 당·첨가물 때문에 비추천입니다.",
    speciesNote: {},
    symptoms: ["과다 시 설사"],
    actionSteps: ["하루 몇 알 이내"],
    myths: [],
    safeAlternatives: ["딸기 소량", "사과 과육"],
    keywords: ["블루베리"],
  },
  {
    slug: "pumpkin",
    name: "호박",
    emoji: "🎃",
    image:
      "/tools/food/pumpkin.jpg",
    imageAlt: "호박",
    dog: "safe",
    cat: "safe",
    oneLiner: "무가당 호박 퓨레는 가벼운 변 트러블 보조로 유명",
    verdict: {
      dog: "캔 호박(pumpkin only) 또는 찐 호박. 파이 믹스는 금지.",
      cat: "수의사 지도 아래 소량 토핑으로 쓰이기도 합니다.",
    },
    why: "수용성 섬유가 변을 부드럽게 또는 단단하게 조절하는 데 도움이 될 수 있습니다. 다만 원인 질환을 가리는 ‘임시 처치’일 뿐, 만성 증상은 진료가 필요합니다.",
    speciesNote: {},
    symptoms: ["과다 시 변비 또는 설사"],
    actionSteps: ["작은 숟가락부터, 2~3일 관찰"],
    myths: [],
    safeAlternatives: ["고구마 소량", "당근"],
    keywords: ["호박", "단호박"],
  },
  {
    slug: "cucumber",
    name: "오이",
    emoji: "🥒",
    image:
      "/tools/food/cucumber.jpg",
    imageAlt: "오이",
    dog: "safe",
    cat: "safe",
    oneLiner: "수분 가득 저칼로리 — 다이어트 중 씹는 재미",
    verdict: {
      dog: "얇게 썰어 시원하게. 여름철 인기 간식.",
      cat: "대부분 관심 적음. 줘도 해롭지 않은 편.",
    },
    why: "칼로리가 매우 낮고 수분이 많아 체중 관리에 유리합니다. 조미료·김치 오이는 나트륨 때문에 안 됩니다.",
    speciesNote: {},
    symptoms: ["과다 시 묽은 변"],
    actionSteps: ["씨 많은 중심부보다 과육 위주로 얇게"],
    myths: [],
    safeAlternatives: ["당근", "블루베리"],
    keywords: ["오이"],
  },
  {
    slug: "rice",
    name: "흰쌀밥",
    emoji: "🍚",
    image:
      "/tools/food/rice.jpg",
    imageAlt: "흰쌀밥",
    dog: "safe",
    cat: "caution",
    oneLiner: "자극 적은 임시 식이 재료 — 장기 단독 급여는 금지",
    verdict: {
      dog: "수의사 지도의 블랜드 다이어트(닭+쌀 등)에 자주 사용.",
      cat: "완전 육식에 가깝게 설계된 종 — 쌀만으로는 영양이 크게 부족.",
    },
    why: "소화가 비교적 잘 되어 급성 위장 증상 시 단기 처방식으로 쓰입니다. 하지만 비타민·미네랄·아미노산 균형이 없어 장기 주식으로 부적합합니다.",
    speciesNote: {
      cat: "고양이에게 탄수화물 과다 식단은 권장되지 않습니다.",
    },
    symptoms: ["장기 단독 시 영양 불균형"],
    actionSteps: ["2~3일 이상 임의 처방식은 수의사와 상의"],
    myths: [],
    safeAlternatives: ["수의사 처방 처방식", "펫 습식"],
    keywords: ["쌀밥", "처방식"],
  },
  {
    slug: "tuna",
    name: "참치(사람용)",
    emoji: "🐟",
    image:
      "/tools/food/tuna.jpg",
    imageAlt: "참치",
    dog: "caution",
    cat: "caution",
    oneLiner: "가끔 토핑은 OK 후보 — 매일·염분·수은은 NO",
    verdict: {
      dog: "무조미·물기가 있는 제품만 극소량. 기름·고추 참치는 금지.",
      cat: "고양이 ‘참치만’ 편식은 영양 결핍의 지름길. 전용 사료가 기본.",
    },
    why: "사람용 참치 캔은 나트륨이 높고, 참치 종류에 따라 수은 축적 우려가 있습니다. 고양이에게 참치만 주면 비타민E 결핍 등 문제가 보고됩니다.",
    speciesNote: {
      cat: "캣푸드 참치 맛은 영양이 맞춰진 제품인지 확인하세요.",
    },
    symptoms: ["나트륨 과다 시 갈증·구토", "편식·영양결핍(장기)"],
    actionSteps: ["주 1회 이하 토핑, 평소는 완전영양 사료"],
    myths: [
      {
        q: "고양이는 참치를 주식으로 해도 된다?",
        a: "안 됩니다. 완전영양 고양이 사료가 기본입니다.",
      },
    ],
    safeAlternatives: ["고양이/강아지 전용 습식", "익힌 닭가슴살"],
    keywords: ["참치", "수은"],
  },
];

export function getFoodBySlug(slug: string): FoodItem | undefined {
  return PET_FOODS.find((f) => f.slug === slug);
}

export function levelFor(food: FoodItem, species: PetSpecies): FoodLevel {
  return species === "cat" ? food.cat : food.dog;
}

export function foodsByLevel(
  species: PetSpecies,
  level: FoodLevel
): FoodItem[] {
  return PET_FOODS.filter((f) => levelFor(f, species) === level);
}
