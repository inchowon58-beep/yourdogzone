/**
 * 강아지분양 SEO 콘텐츠 양식 (로컬 발행 formId 와 동기화)
 * URL 카테고리는 adoption 고정, formId 만 견종/기본 문구를 바꿉니다.
 */
export type AdoptionSpecies = "dog" | "cat";

export type AdoptionContentForm = {
  id: string;
  label: string;
  species: AdoptionSpecies;
  subject: string;
  traits: string[];
  careNotes: string[];
  headlineFocus: string;
  warning: string;
};

export const ADOPTION_CONTENT_FORMS: Record<string, AdoptionContentForm> = {
  dog_basic: {
    id: "dog_basic",
    label: "기본강아지",
    species: "dog",
    subject: "강아지",
    traits: [
      "성격·활동량에 맞는 견종·개체 선택",
      "접종·건강 검진 이력 확인",
      "분양 계약·환불·사후관리 조건",
      "가정 환경(공간·동거인·다른 반려동물) 점검",
    ],
    careNotes: [
      "초기 적응기에는 산책·배변·분리불안을 천천히 익히세요.",
      "분양 직후 동물병원 건강검진을 권장합니다.",
      "사료·용품·예방접종 일정을 미리 정리해 두면 안정적입니다.",
    ],
    headlineFocus: "신뢰할 수 있는 강아지분양",
    warning:
      "가격만 보고 급하게 결정하지 말고, 업체 환경·아이 상태·계약 조건을 직접 확인하세요.",
  },
  cat_basic: {
    id: "cat_basic",
    label: "기본고양이",
    species: "cat",
    subject: "고양이",
    traits: [
      "키우기 쉬운 온순·실내 적응형",
      "아파트에서 키우기 좋은 조용한 성향",
      "배변(화장실) 적응·청결 관리",
      "접종·구충·건강검진 확인",
    ],
    careNotes: [
      "초기에는 독립된 적응 공간을 마련해 주세요.",
      "분양 직후 동물병원 건강검진·접종 일정을 확인하세요.",
      "화장실·스크래처·방충망을 미리 준비하세요.",
    ],
    headlineFocus: "고양이 처음 키운다면",
    warning:
      "분양가는 퀄리티·혈통에 따라 10만 원대~수백만 원 이상일 수 있고, 무료분양도 진료비·책임비가 발생할 수 있습니다.",
  },
  maine_coon: {
    id: "maine_coon",
    label: "메인쿤",
    species: "cat",
    subject: "메인쿤",
    traits: [
      "대형묘 · 성장 기간이 긴 편",
      "온순하고 사람과 친화적인 성향이 많음",
      "정기 그루밍·빗질이 중요",
      "활동 공간·캣타워 여유가 필요",
    ],
    careNotes: [
      "성장기 영양·관절 케어를 신경 쓰는 편이 좋습니다.",
      "장모종이라 털빠짐·엉킴 관리가 필요합니다.",
      "분양 전 부모묘·혈통·건강 검사 이력을 확인하세요.",
    ],
    headlineFocus: "메인쿤 분양 전 체크포인트",
    warning:
      "대형묘 특성을 모르고 분양받으면 공간·비용 부담이 커질 수 있습니다.",
  },
  nevskaya_masquerade: {
    id: "nevskaya_masquerade",
    label: "네바마스커레이드",
    species: "cat",
    subject: "네바마스커레이드",
    traits: [
      "시베리안 계열 · 마스크 포인트 외형",
      "온순하고 가정 친화적인 성향",
      "중장모 · 계절성 털갈이",
      "알레르기 민감 가정은 사전 상담 권장",
    ],
    careNotes: [
      "마스크·포인트 색 발현은 성장하며 달라질 수 있습니다.",
      "정기 빗질과 귀·눈 위생 관리가 중요합니다.",
      "분양처의 혈통·건강 관리 체계를 확인하세요.",
    ],
    headlineFocus: "네바마스커레이드 분양 가이드",
    warning:
      "희귀 견종처럼 과대광고·비정상 가격이 있을 수 있어 신중히 비교하세요.",
  },
  munchkin: {
    id: "munchkin",
    label: "먼치킨",
    species: "cat",
    subject: "먼치킨",
    traits: [
      "짧은 다리 · 귀여운 외형이 특징",
      "호기심 많고 활동적인 개체 많음",
      "관절·척추 건강 확인이 중요",
      "실내 캣타워·낮은 점프 환경 고려",
    ],
    careNotes: [
      "단족 특성과 관련된 건강 이슈를 분양 전 꼭 확인하세요.",
      "과도한 점프·비만 관리에 신경 쓰면 좋습니다.",
      "부모묘 건강·번식 이력 투명성을 확인하세요.",
    ],
    headlineFocus: "먼치킨 분양 전 꼭 확인할 것",
    warning: "외형만 강조하고 건강 설명을 피하는 곳은 피하세요.",
  },
  ragdoll: {
    id: "ragdoll",
    label: "랙돌",
    species: "cat",
    subject: "랙돌",
    traits: [
      "온순·느긋한 성격으로 가정묘에 인기",
      "중장모 · 정기 그루밍 필요",
      "사람을 잘 따르는 성향",
      "실내 생활 중심이 적합",
    ],
    careNotes: [
      "털 관리와 헤어볼 예방을 준비하세요.",
      "심장·건강 검진 이력을 분양 시 확인하는 것이 좋습니다.",
      "적응기에는 조용한 공간이 도움됩니다.",
    ],
    headlineFocus: "랙돌 분양 · 성격과 케어",
    warning: "성격이 온순해도 개체 차는 있으니 직접 만나보고 결정하세요.",
  },
  russian_blue: {
    id: "russian_blue",
    label: "러시안블루",
    species: "cat",
    subject: "러시안블루",
    traits: [
      "은회색 단모 · 초록 눈 포인트",
      "조용하고 예민한 성향이 있을 수 있음",
      "한 사람과 깊게 유대하는 경우 많음",
      "안정적인 루틴·환경이 중요",
    ],
    careNotes: [
      "환경 변화에 민감할 수 있어 적응 공간을 천천히 넓히세요.",
      "단모라도 주기적 빗질이 도움이 됩니다.",
      "분양 전 성격·합사 가능 여부를 상담하세요.",
    ],
    headlineFocus: "러시안블루 분양 가이드",
    warning:
      "예민한 성향을 고려하지 않으면 적응에 시간이 더 걸릴 수 있습니다.",
  },
  goldendoodle: {
    id: "goldendoodle",
    label: "골든두들",
    species: "dog",
    subject: "골든두들",
    traits: [
      "골든리트리버 × 푸들 믹스",
      "친화력·지능이 높은 편",
      "털 빠짐이 적은 개체가 많아 인기",
      "정기 미용·그루밍이 필요",
    ],
    careNotes: [
      "세대(F1/F1b 등)·부모견 성향을 확인하세요.",
      "활동량이 있어 산책·놀이 시간을 확보하는 편이 좋습니다.",
      "미용 주기·알러지·고관절 등 건강 이력을 점검하세요.",
    ],
    headlineFocus: "골든두들 분양 전 체크리스트",
    warning:
      "‘저알러지’만 강조하고 부모·건강 정보를 숨기는 곳은 주의하세요.",
  },
  coton_de_tulear: {
    id: "coton_de_tulear",
    label: "꼬똥드툴레아",
    species: "dog",
    subject: "꼬똥드툴레아",
    traits: [
      "작고 밝은 성격의 반려견",
      "흰 솜털 같은 장모 · 미용 관리 중요",
      "가족과 유대가 깊은 편",
      "아파트·실내 생활에도 잘 맞는 경우 많음",
    ],
    careNotes: [
      "장모 관리(빗질·미용)를 분양 전부터 준비하세요.",
      "슬개골·치아 등 소형견 건강 포인트를 확인하세요.",
      "사회화·분리불안 예방 훈련을 초기에 시작하세요.",
    ],
    headlineFocus: "꼬똥드툴레아 분양 가이드",
    warning:
      "외형만 예쁘게 보여주고 사육·건강 설명을 생략하는 곳은 피하세요.",
  },
  pomsky: {
    id: "pomsky",
    label: "폼스키",
    species: "dog",
    subject: "폼스키",
    traits: [
      "포메라니안 × 시베리안허스키 믹스",
      "외형이 개체마다 크게 다를 수 있음",
      "활동량·보컬(울음/하울링) 성향 확인 필요",
      "털갈이·그루밍 관리",
    ],
    careNotes: [
      "성견 예상 크기·털색은 부모견·형제를 참고하세요.",
      "에너지가 높은 개체가 많아 산책·놀이가 중요합니다.",
      "믹스 특성상 ‘사진과 똑같은 개체’를 보장하기 어렵습니다.",
    ],
    headlineFocus: "폼스키 분양 · 현실적으로 확인하세요",
    warning:
      "허스키 느낌만 강조한 과장 광고·비정상 고가가 있을 수 있습니다.",
  },
};

export const DEFAULT_ADOPTION_FORM_ID = "dog_basic";

export function resolveAdoptionContentForm(
  formId?: string | null
): AdoptionContentForm {
  if (formId && ADOPTION_CONTENT_FORMS[formId]) {
    return ADOPTION_CONTENT_FORMS[formId];
  }
  return ADOPTION_CONTENT_FORMS[DEFAULT_ADOPTION_FORM_ID];
}

export const ADOPTION_COMMON_CHECKS = [
  "업체·브리더 방문 또는 화상으로 사육 환경 확인",
  "접종·구충·건강검진 기록 요청",
  "계약서(환불·건강보증·사후관리) 문구 확인",
  "분양가·추가비(용품·미용·배송) 투명성",
  "인수 전 아이 상태(눈·코·피부·활력) 직접 확인",
] as const;
