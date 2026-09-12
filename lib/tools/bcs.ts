/** 반려동물 BCS(Body Condition Score) 자가 진단 — 9점 척도 */

export type PetSpecies = "dog" | "cat";

export type BcsScore = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type BcsAnswerId = string;

export type BcsQuestion = {
  id: "ribs" | "waist" | "belly";
  title: string;
  hint: string;
  options: { id: BcsAnswerId; label: string; detail: string; score: BcsScore }[];
};

export type BcsGuide = {
  score: BcsScore;
  /** 5단계 요약 (1=마름 … 5=고도비만) */
  stage5: 1 | 2 | 3 | 4 | 5;
  stage5Label: string;
  nickname: string;
  emoji: string;
  color: "sky" | "emerald" | "amber" | "orange" | "rose";
  summary: string;
  tips: string[];
  caution: string;
};

const RIBS_OPTIONS: BcsQuestion["options"] = [
  {
    id: "ribs-bones",
    label: "뼈가 툭툭 만져져요",
    detail: "살집 거의 없이 갈비·척추·골반이 뚜렷",
    score: 1,
  },
  {
    id: "ribs-easy",
    label: "살짝만 눌러도 갈비가 잘 만져져요",
    detail: "얇은 지방 아래 갈비가 쉽게 느껴짐",
    score: 3,
  },
  {
    id: "ribs-ideal",
    label: "살짝 누르면 갈비가 느껴져요",
    detail: "과도한 힘 없이 고르게 만져지는 정도",
    score: 5,
  },
  {
    id: "ribs-hard",
    label: "꾹 눌러야 겨우 만져져요",
    detail: "지방이 덮여 갈비가 잘 안 잡힘",
    score: 7,
  },
  {
    id: "ribs-none",
    label: "아무리 눌러도 갈비가 안 만져져요",
    detail: "두꺼운 지방층으로 뼈가 거의 안 느껴짐",
    score: 9,
  },
];

const WAIST_OPTIONS: BcsQuestion["options"] = [
  {
    id: "waist-extreme",
    label: "허리가 심하게 잘록해요",
    detail: "갈비 뒤가 깊게 들어가 뼈대가 도드라짐",
    score: 2,
  },
  {
    id: "waist-clear",
    label: "위에서 보면 허리가 또렷해요",
    detail: "모래시계처럼 허리 라인이 분명",
    score: 4,
  },
  {
    id: "waist-ideal",
    label: "허리가 자연스럽게 들어가 보여요",
    detail: "옆구리에서 엉덩이로 살짝 좁아짐",
    score: 5,
  },
  {
    id: "waist-soft",
    label: "허리가 거의 안 보여요",
    detail: "등 라인이 밋밋하거나 살짝만 좁아짐",
    score: 7,
  },
  {
    id: "waist-none",
    label: "허리가 없고 통통해요",
    detail: "위에서 보면 둥근 타원·직사각형에 가까움",
    score: 9,
  },
];

const BELLY_OPTIONS: BcsQuestion["options"] = [
  {
    id: "belly-tuck-deep",
    label: "배가 바짝 올라가 있어요",
    detail: "옆에서 보면 배가 깊게 tuck-in",
    score: 2,
  },
  {
    id: "belly-tuck",
    label: "배가 살짝 올라가 보여요",
    detail: "갈비 아래에서 사타구니 쪽으로 올라가 보임",
    score: 4,
  },
  {
    id: "belly-ideal",
    label: "배가 적당히 올라가 있어요",
    detail: "처지지 않고 자연스러운 라인",
    score: 5,
  },
  {
    id: "belly-flat",
    label: "배가 거의 일자예요",
    detail: "옆에서 보면 배가 처지지 않지만 tuck도 약함",
    score: 6,
  },
  {
    id: "belly-sag",
    label: "배가 둥글게 처져 보여요",
    detail: "복부 지방이 늘어져 아래로 볼록",
    score: 8,
  },
];

export function bcsQuestions(species: PetSpecies): BcsQuestion[] {
  const who = species === "dog" ? "강아지" : "고양이";
  return [
    {
      id: "ribs",
      title: "갈비뼈는 어떻게 만져지나요?",
      hint: `${who}의 갈비 부위를 손바닥으로 부드럽게 쓸어보세요. (아프지 않게!)`,
      options: RIBS_OPTIONS,
    },
    {
      id: "waist",
      title: "위에서 본 허리 라인은?",
      hint: "서서(또는 엎드려) 위에서 내려다본 옆구리·허리 모양이에요.",
      options: WAIST_OPTIONS,
    },
    {
      id: "belly",
      title: "옆에서 본 배 라인은?",
      hint: "옆모습을 보고 배가 올라가 있는지, 처져 있는지 확인해요.",
      options: BELLY_OPTIONS,
    },
  ];
}

export function scoreToStage5(score: BcsScore): 1 | 2 | 3 | 4 | 5 {
  if (score <= 2) return 1;
  if (score <= 3) return 2;
  if (score <= 5) return 3;
  if (score <= 7) return 4;
  return 5;
}

export function stage5Label(stage: 1 | 2 | 3 | 4 | 5): string {
  switch (stage) {
    case 1:
      return "마름";
    case 2:
      return "약간 마름";
    case 3:
      return "이상적";
    case 4:
      return "과체중";
    case 5:
      return "비만";
  }
}

function guideFor(
  score: BcsScore,
  species: PetSpecies
): Omit<BcsGuide, "score" | "stage5" | "stage5Label"> {
  const pet = species === "dog" ? "강아지" : "고양이";
  const food = species === "dog" ? "사료·간식" : "사료·츄르·간식";

  const table: Record<
    BcsScore,
    Omit<BcsGuide, "score" | "stage5" | "stage5Label">
  > = {
    1: {
      nickname: "뼈다귀 모델",
      emoji: "🦴",
      color: "sky",
      summary: `${pet}가 너무 마른 편이에요. 갈비·골반이 지나치게 드러날 수 있어요.`,
      tips: [
        `${food} 칼로리를 갑자기 늘리기보다, 하루 양을 소분해 자주 주세요.`,
        "기생충·치아·소화 문제를 병원과 함께 점검해 보세요.",
        "고품질 단백질 위주 식단과 체중을 주 1회 기록해 보세요.",
      ],
      caution: "급격한 체중 증가는 부담이 됩니다. 수의사와 목표 체중을 잡으세요.",
    },
    2: {
      nickname: "슬림 러너",
      emoji: "🏃",
      color: "sky",
      summary: `다소 마른 체형이에요. 활동량은 좋은 편일 수 있지만 살집이 부족할 수 있어요.`,
      tips: [
        "하루 급여량을 5~10% 정도만 천천히 올려 보세요.",
        "간식은 하루 칼로리의 10% 이내로 유지하세요.",
        "2주에 한 번 갈비·허리 상태를 다시 체크해 보세요.",
      ],
      caution: "성장기·임신·수유 중이라면 별도 영양 관리가 필요합니다.",
    },
    3: {
      nickname: "라이트 밸런서",
      emoji: "✨",
      color: "emerald",
      summary: `이상적에 가까운 슬림한 몸매예요. 허리 라인만 잘 유지하면 됩니다.`,
      tips: [
        "현재 급여·산책 리듬을 유지하세요.",
        "간식이 늘면 BCS가 쉽게 올라가요. 주간 간식 횟수를 정해 두세요.",
        "월 1회 체중·허리 사진을 남겨 변화를 비교해 보세요.",
      ],
      caution: "중성화 후에는 대사량이 줄어 살이 붙기 쉬워요.",
    },
    4: {
      nickname: "딱 좋은 밸런서",
      emoji: "💚",
      color: "emerald",
      summary: `교과서에 나오는 이상적 BCS에 가까워요. 갈비는 만져지고 허리는 또렷해요.`,
      tips: [
        "지금 식단·운동을 ‘유지 모드’로 고정하세요.",
        "간식·사람 음식은 예외 날을 정해 과식을 막으세요.",
        species === "dog"
          ? "산책 강도는 유지하되, 관절에 무리가 없는지 관찰하세요."
          : "놀이·스크래처·사냥 놀이로 활동량을 꾸준히 주세요.",
      ],
      caution: "이상적이어도 계절·중성화·나이로 바뀔 수 있어요. 분기마다 재체크!",
    },
    5: {
      nickname: "골든 밸런스",
      emoji: "🏅",
      color: "emerald",
      summary: `건강한 표준 체형이에요. 지금이 ‘유지가 곧 관리’인 구간입니다.`,
      tips: [
        `${food} 총량을 저울로 재서 오차를 줄이세요.`,
        "주 1회 갈비 터치 체크를 습관으로 만드세요.",
        "급여량 계산기로 하루 kcal도 함께 맞춰 보세요.",
      ],
      caution: "사람 음식·과도한 간식이 가장 흔한 체중 증가 원인입니다.",
    },
    6: {
      nickname: "포동 예비생",
      emoji: "🫧",
      color: "amber",
      summary: `살짝 통통해지기 시작했어요. 지금 잡으면 관리가 훨씬 쉽습니다.`,
      tips: [
        "하루 급여량을 5~10%만 줄이고 2주 뒤 다시 재보세요.",
        "간식을 저칼로리(채소용·티스 등)로 바꿔 보세요.",
        species === "dog"
          ? "산책에 가벼운 언덕·냄새 맡기 탐험을 더해 보세요."
          : "자동 급식기를 끄고 정해진 끼니만 주세요.",
      ],
      caution: "급격한 다이어트는 피하세요. 특히 고양이는 간 질환 위험이 있습니다.",
    },
    7: {
      nickname: "통통 챌린저",
      emoji: "🟠",
      color: "orange",
      summary: `과체중 구간이에요. 갈비가 잘 안 만져지고 허리가 흐릿해질 수 있어요.`,
      tips: [
        "수의사와 목표 체중·주당 감량 속도를 상의하세요.",
        `${food}을 계량하고, 가족 모두가 같은 규칙을 지키세요.`,
        species === "dog"
          ? "짧은 산책 여러 번으로 나눠 관절 부담을 줄이세요."
          : "놀이 시간을 하루 2~3회로 쪼개 칼로리를 태우세요.",
      ],
      caution: "관절·호흡·피부 접힘 염증이 늘 수 있어요. 불편 신호가 있으면 병원 상담.",
    },
    8: {
      nickname: "포동 보스",
      emoji: "🟠",
      color: "orange",
      summary: `비만에 가까운 체형이에요. 복부 처짐·활동량 저하가 나타날 수 있어요.`,
      tips: [
        "자가 감량보다 동물병원 체중 관리 프로그램을 우선하세요.",
        "처방식·체중 관리식 전환을 수의사와 검토해 보세요.",
        "운동은 ‘오래’보다 ‘자주·가볍게’가 안전합니다.",
      ],
      caution: "심장·관절·당뇨 위험이 커질 수 있습니다. 방치하지 마세요.",
    },
    9: {
      nickname: "초대형 포동왕",
      emoji: "🚨",
      color: "rose",
      summary: `고도비만 가능성이 커요. 갈비가 거의 안 만져지고 배가 많이 처질 수 있어요.`,
      tips: [
        "가능한 빨리 동물병원에서 체중·혈액·관절 상태를 점검하세요.",
        "급격한 절식은 금지입니다. 반드시 전문가 가이드를 따르세요.",
        "가족 간 급여 규칙을 통일하고 자유 급식을 중단하세요.",
      ],
      caution: "호흡이 가쁘거나 잘 못 일어나면 응급에 가깝습니다. 즉시 병원으로.",
    },
  };

  return table[score];
}

export function computeBcs(
  scores: BcsScore[],
  species: PetSpecies
): BcsGuide {
  const avg =
    scores.reduce((sum, n) => sum + n, 0) / Math.max(1, scores.length);
  const rounded = Math.min(9, Math.max(1, Math.round(avg))) as BcsScore;
  const stage5 = scoreToStage5(rounded);
  const base = guideFor(rounded, species);
  return {
    score: rounded,
    stage5,
    stage5Label: stage5Label(stage5),
    ...base,
  };
}

export function bcsScaleLabels(): { score: BcsScore; label: string }[] {
  return [
    { score: 1, label: "극심한 마름" },
    { score: 2, label: "마름" },
    { score: 3, label: "약간 마름" },
    { score: 4, label: "약간 슬림" },
    { score: 5, label: "이상적" },
    { score: 6, label: "약간 과체중" },
    { score: 7, label: "과체중" },
    { score: 8, label: "비만" },
    { score: 9, label: "고도비만" },
  ];
}
