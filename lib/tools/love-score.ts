/** 반려견 사랑 포인트 · 성향 퀴즈 (멍BTI형 단계 선택) */

export type LoveOption = {
  id: string;
  label: string;
  detail?: string;
  /** 문항 점수 0~10 (낮을수록 관계·애착에 빨간불) */
  love: number;
  traits: string[];
};

export type LoveQuestion = {
  id: string;
  title: string;
  hint?: string;
  options: LoveOption[];
};

export const POPULAR_BREEDS = [
  "말티즈",
  "푸들",
  "포메라니안",
  "비숑프리제",
  "치와와",
  "시츄",
  "요크셔테리어",
  "믹스견",
  "골든리트리버",
  "래브라도리트리버",
  "웰시코기",
  "시바견",
  "진돗개",
  "보더콜리",
  "프렌치불독",
  "기타",
];

/** 12문항 · 선택마다 다음으로 이동 */
export const LOVE_QUESTIONS: LoveQuestion[] = [
  {
    id: "walk",
    title: "하루 산책은 보통 어느 정도인가요?",
    hint: "날씨·컨디션에 따라 달라도, 평소 기준으로 골라 주세요.",
    options: [
      {
        id: "walk-0",
        label: "거의 안 나가요 / 베란다·집 안이 전부",
        detail: "실내 생활 위주",
        love: 2,
        traits: ["집순이", "실내파"],
      },
      {
        id: "walk-20",
        label: "20~30분 짧게",
        detail: "볼일 보고 바로 귀가",
        love: 6,
        traits: ["짧은산책"],
      },
      {
        id: "walk-60",
        label: "1시간 전후",
        detail: "동네 한 바퀴는 기본",
        love: 9,
        traits: ["산책러버"],
      },
      {
        id: "walk-120",
        label: "2시간 이상 / 자주 나가요",
        detail: "탐험·운동이 일상",
        love: 8,
        traits: ["탐험대장", "에너지넘침"],
      },
    ],
  },
  {
    id: "potty",
    title: "배변은 주로 어디서 하나요?",
    options: [
      {
        id: "potty-pad",
        label: "집 배변판·패드에 척척",
        love: 10,
        traits: ["배변천재"],
      },
      {
        id: "potty-out",
        label: "밖에서만 / 산책 때 해결",
        love: 9,
        traits: ["야외파"],
      },
      {
        id: "potty-mix",
        label: "집·밖 반반, 가끔 실수",
        love: 5,
        traits: ["연습중"],
      },
      {
        id: "potty-chaos",
        label: "아무 데나 싸는 편… 전쟁 중",
        detail: "실수·마킹이 잦음 — 심술·화난 신호일 수 있음",
        love: 0,
        traits: ["배변고민", "자유혼"],
      },
    ],
  },
  {
    id: "guest",
    title: "손님·택배 아저씨가 오면?",
    options: [
      {
        id: "guest-bark",
        label: "목이 터져라 마구 짖어요",
        love: 3,
        traits: ["프로경비견", "경계심"],
      },
      {
        id: "guest-shy",
        label: "숨거나 뒤로 빠져요",
        love: 5,
        traits: ["수줍은아이"],
      },
      {
        id: "guest-friend",
        label: "바로 친구 신청 / 꼬리 헬리콥터",
        love: 9,
        traits: ["사교왕"],
      },
      {
        id: "guest-ignore",
        label: "관심 없음. 내 세상이 따로 있음",
        love: 6,
        traits: ["마이웨이"],
      },
    ],
  },
  {
    id: "mouth",
    title: "손·물건에 대한 입은?",
    options: [
      {
        id: "mouth-bite",
        label: "손·소매·쿠션을 자꾸 물어요",
        love: 2,
        traits: ["입질탐험가"],
      },
      {
        id: "mouth-toy",
        label: "장난감만 물고 손은 조심해요",
        love: 9,
        traits: ["매너입"],
      },
      {
        id: "mouth-none",
        label: "거의 안 물어요",
        love: 8,
        traits: ["젠틀"],
      },
      {
        id: "mouth-play",
        label: "놀 때만 살짝, 세기 조절은 연습 중",
        love: 6,
        traits: ["놀이입질"],
      },
    ],
  },
  {
    id: "alone",
    title: "혼자 남겨두면?",
    options: [
      {
        id: "alone-howl",
        label: "하울링·울음·분리불안이 심해요",
        love: 4,
        traits: ["초강력껌딱지", "분리불안"],
      },
      {
        id: "alone-wait",
        label: "조금 기다리다 잠들어요",
        love: 9,
        traits: ["믿음직한"],
      },
      {
        id: "alone-ok",
        label: "혼자도 잘 놀고 편안해요",
        love: 8,
        traits: ["독립심"],
      },
      {
        id: "alone-mess",
        label: "조용한데 나중에 보면 난장판",
        love: 1,
        traits: ["몰래파티"],
      },
    ],
  },
  {
    id: "leash",
    title: "산책 줄(리드)은 어떤 편인가요?",
    options: [
      {
        id: "leash-rocket",
        label: "당겨서 날아다녀요",
        love: 3,
        traits: ["로켓산책", "탐험대장"],
      },
      {
        id: "leash-ok",
        label: "대체로 옆에 잘 걸어요",
        love: 10,
        traits: ["산책매너"],
      },
      {
        id: "leash-sniff",
        label: "냄새 맡느라 자꾸 멈춰요",
        love: 7,
        traits: ["코탐정"],
      },
      {
        id: "leash-scared",
        label: "소리·사람·차에 예민해요",
        love: 4,
        traits: ["예민센서"],
      },
    ],
  },
  {
    id: "cling",
    title: "보호자를 향한 ‘껌딱지’ 정도는?",
    options: [
      {
        id: "cling-100",
        label: "한 발짝도 떨어지기 싫어요",
        love: 5,
        traits: ["껌딱지", "눈에서꿀"],
      },
      {
        id: "cling-70",
        label: "옆에 있고 싶지만 혼자 시간도 OK",
        love: 10,
        traits: ["다정함"],
      },
      {
        id: "cling-40",
        label: "필요할 때만 다가와요",
        love: 6,
        traits: ["쿨한애정"],
      },
      {
        id: "cling-tsun",
        label: "겉쿨속잼 / 밀당의 아이콘",
        love: 5,
        traits: ["밀당고수"],
      },
    ],
  },
  {
    id: "food",
    title: "간식·밥 앞에서의 눈빛은?",
    options: [
      {
        id: "food-100",
        label: "간식만 보면 눈빛이 돌변해요",
        love: 5,
        traits: ["먹보왕", "간식헌터"],
      },
      {
        id: "food-picky",
        label: "까다로워서 골라 먹어요",
        love: 5,
        traits: ["미식가"],
      },
      {
        id: "food-normal",
        label: "평소처럼 잘 먹어요",
        love: 8,
        traits: ["안정식욕"],
      },
      {
        id: "food-love",
        label: "먹보보다 쓰다듬·놀이가 먼저",
        love: 9,
        traits: ["애정보다밥"],
      },
    ],
  },
  {
    id: "sleep",
    title: "잠자리는 어디인가요?",
    options: [
      {
        id: "sleep-bed",
        label: "보호자 침대·이불 속 점령",
        love: 5,
        traits: ["침대점령군"],
      },
      {
        id: "sleep-crate",
        label: "자기 집·크레이트에서 쿨쿨",
        love: 7,
        traits: ["독립수면"],
      },
      {
        id: "sleep-sofa",
        label: "소파·거실이 본진",
        love: 7,
        traits: ["거실보스"],
      },
      {
        id: "sleep-follow",
        label: "보호자 따라다니며 아무 데서나",
        love: 9,
        traits: ["따라쟁이"],
      },
    ],
  },
  {
    id: "greet",
    title: "보호자가 집에 오면?",
    options: [
      {
        id: "greet-jump",
        label: "점프·울음·전속력 환영식",
        love: 8,
        traits: ["환영위원회"],
      },
      {
        id: "greet-tail",
        label: "꼬리 흔들며 천천히 다가와요",
        love: 9,
        traits: ["다정환영"],
      },
      {
        id: "greet-toy",
        label: "장난감을 물고 자랑하러 와요",
        love: 10,
        traits: ["선물요정"],
      },
      {
        id: "greet-cool",
        label: "늦게 일어나거나 쿨하게 고개만",
        love: 3,
        traits: ["쿨인사"],
      },
    ],
  },
  {
    id: "train",
    title: "앉아·기다려 같은 말은?",
    options: [
      {
        id: "train-pro",
        label: "바로 알아듣고 척척",
        love: 10,
        traits: ["모범견", "학습천재"],
      },
      {
        id: "train-food",
        label: "간식 있을 때만 천재",
        love: 7,
        traits: ["조건부천재"],
      },
      {
        id: "train-select",
        label: "기분 좋을 때만 선택적으로",
        love: 5,
        traits: ["자기주장"],
      },
      {
        id: "train-chaos",
        label: "아직 훈련은 전쟁 중",
        love: 2,
        traits: ["자유혼", "연습중"],
      },
    ],
  },
  {
    id: "touch",
    title: "쓰다듬으면?",
    options: [
      {
        id: "touch-roll",
        label: "바로 뒤집는 천사 모드",
        love: 10,
        traits: ["천사견", "배깔개"],
      },
      {
        id: "touch-lean",
        label: "기대어 오며 더 해달라는 눈빛",
        love: 10,
        traits: ["스킨십러버"],
      },
      {
        id: "touch-ok",
        label: "좋아하지만 금방 일어나요",
        love: 7,
        traits: ["적당애정"],
      },
      {
        id: "touch-no",
        label: "손 닿으면 피하거나 예민해요",
        love: 1,
        traits: ["스킨십조심"],
      },
    ],
  },
];

export type LoveAnswers = Record<string, string>;

export type LoveResult = {
  /** 사랑지수 % (65~100) */
  score: number;
  title: string;
  comment: string;
  headline: string;
  advice: string;
  tags: string[];
  traits: string[];
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function pickOpening(traits: string[], score: number): string {
  if (traits.includes("배변고민") || traits.includes("자유혼")) {
    return score < 80
      ? "아무 데나 배변하는 건 심술·화난 신호일 수도 있어요. 관계에 빨간불이 켜진 상태!"
      : "배변 규칙은 아직 자유롭지만, 마음만은 복잡하게 요동치는 타입!";
  }
  if (traits.includes("몰래파티")) {
    return "겉으론 조용한데 속으론 불만이 쌓여 난장판으로 표현하는 타입!";
  }
  if (traits.includes("프로경비견")) {
    return "손님이 오면 목이 터져라 경계하는 프로 경비견! 보호자에게도 긴장 신호가 섞여 있을 수 있어요.";
  }
  if (traits.includes("입질탐험가")) {
    return "손·물건을 무는 건 호기심이기도 하지만, 스트레스·관심 요구 신호일 수도 있어요.";
  }
  if (traits.includes("초강력껌딱지") || traits.includes("분리불안")) {
    return "보호자 없으면 심장이 불안한 초강력 껌딱지. 사랑은 크지만 불안도 커요.";
  }
  if (traits.includes("로켓산책") || traits.includes("탐험대장")) {
    return "산책만 하면 로켓처럼 날아가는 탐험대장! 에너지가 남아돌면 집에서 심술이 날 수 있어요.";
  }
  if (traits.includes("천사견") || traits.includes("배깔개")) {
    return "손길만 닿아도 벌렁, 심장이 녹는 천사견!";
  }
  if (traits.includes("먹보왕")) {
    return "간식 앞에서 눈빛이 돌변하는 먹보 DNA 장착!";
  }
  if (traits.includes("침대점령군")) {
    return "침대와 이불을 점령한 집안 권력자!";
  }
  if (traits.includes("스킨십조심")) {
    return "손길을 피한다면 지금은 거리 두기가 필요한 마음일 수 있어요.";
  }
  return "선택들을 모아 보니, 보호자를 향한 마음이 꽤 솔직하게 드러나요.";
}

function pickAdvice(traits: string[], score: number): string {
  if (score >= 100) {
    return "완벽에 가까워요! 오늘 특별 간식과 칭찬으로 이 관계를 축하해 주세요.";
  }
  if (traits.includes("배변고민") || traits.includes("자유혼")) {
    return "아무 데나 싸는 건 '화났어요/심술' 신호로 읽힐 수 있어요. 성공 배변에만 즉시 보상하고, 혼내기보다 루틴을 다시 잡아 보세요.";
  }
  if (traits.includes("몰래파티")) {
    return "혼자 둘 때 흔적을 남긴다면 심심함·불안일 수 있어요. 짧은 분리 훈련을 조금씩 늘려 보세요.";
  }
  if (score < 75) {
    return "지금 관계가 조금 삐걱대고 있어요. 더욱더 잘해줘야겠어요 — 산책·스킨십·칭찬을 오늘부터 하나씩 챙겨 주세요.";
  }
  if (traits.includes("먹보왕") || traits.includes("간식헌터") || traits.includes("조건부천재")) {
    return "간식을 조금 더, 좋은 타이밍에 사주는 건 어떨까요? 칭찬과 함께면 눈빛이 더 반짝일 거예요.";
  }
  if (traits.includes("짧은산책") || traits.includes("집순이") || traits.includes("실내파")) {
    return "짧은 산책이라도 하루에 한 번 더 나가보면 어떨까요? 함께하는 시간이 사랑의 적립이에요.";
  }
  if (traits.includes("로켓산책") || traits.includes("탐험대장") || traits.includes("에너지넘침")) {
    return "탐험 본능이 대단해요. 안전한 곳에서 뛰어놀게 해주면 집에서도 마음이 풀릴 거예요.";
  }
  if (traits.includes("초강력껌딱지") || traits.includes("분리불안") || traits.includes("껌딱지")) {
    return "더욱더 잘해줘야겠어요. 짧게라도 '다녀올게' 의식을 만들어 주면 마음이 편해질 수 있어요.";
  }
  if (traits.includes("프로경비견") || traits.includes("경계심")) {
    return "경비 본능을 존중하되, 손님이 오면 간식으로 '괜찮다'는 신호를 같이 연습해 보면 어때요?";
  }
  if (traits.includes("스킨십조심") || traits.includes("예민센서")) {
    return "천천히, 좋아하는 부위만. 억지 스킨십보다 거리를 존중하는 게 진짜 사랑이에요.";
  }
  if (traits.includes("천사견") || traits.includes("배깔개") || traits.includes("스킨십러버")) {
    return "더욱더 잘해줘야겠어요. 배쓰다듬·쓰담쓰담 타임이 최고의 선물이에요.";
  }
  if (score >= 90) {
    return "사이가 아주 좋아요. 이 흐름을 지키며 오늘 작은 선물(간식·놀이)을 하나 더 해보세요.";
  }
  return "더욱더 잘해줘야겠어요. 짧은 놀이든 간식이든, 오늘 하나만 더 챙겨 주세요.";
}

function headlineFor(petName: string, score: number): string {
  if (score >= 100) {
    return `${petName}가 당신을 사랑하는 사랑지수는 100%이네요. 서로 완벽히 통하는 사이예요!`;
  }
  if (score >= 90) {
    return `${petName}가 당신을 사랑하는 사랑지수는 ${score}%이네요. 사이가 정말 좋아요.`;
  }
  if (score >= 80) {
    return `${petName}가 당신을 사랑하는 사랑지수는 ${score}%이네요. 더욱더 잘해줘야겠어요.`;
  }
  if (score >= 70) {
    return `${petName}가 당신을 사랑하는 사랑지수는 ${score}%이네요. 마음이 살짝 삐져 있을 수 있어요.`;
  }
  return `${petName}가 당신을 사랑하는 사랑지수는 ${score}%이네요. 지금 관계가 흔들리고 있을 수 있어요. 더욱더 잘해줘야겠어요.`;
}

export function computeLoveQuizResult(
  name: string,
  breed: string,
  answers: LoveAnswers
): LoveResult {
  const selected: LoveOption[] = [];
  for (const q of LOVE_QUESTIONS) {
    const optId = answers[q.id];
    const opt = q.options.find((o) => o.id === optId);
    if (opt) selected.push(opt);
  }

  const traitCount = new Map<string, number>();
  let sum = 0;
  for (const opt of selected) {
    sum += opt.love;
    for (const t of opt.traits) {
      traitCount.set(t, (traitCount.get(t) || 0) + 1);
    }
  }

  const traits = [...traitCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .map(([t]) => t);

  const answered = Math.max(1, selected.length);
  const maxSum = answered * 10;
  const ratio = maxSum > 0 ? sum / maxSum : 0;
  let score = Math.round(65 + ratio * 35);

  // 문제 행동 = 심술·화·거리두기로 보고 추가 감점
  if (traits.includes("배변고민")) score -= 5;
  if (traits.includes("자유혼")) score -= 2;
  if (traits.includes("몰래파티")) score -= 4;
  if (traits.includes("스킨십조심")) score -= 3;
  if (traits.includes("입질탐험가")) score -= 2;
  if (traits.includes("쿨인사")) score -= 2;
  if (traits.includes("연습중")) score -= 1;

  // 건강한 애착·매너 콤보는 가점 (100% 도달 가능)
  if (traits.includes("천사견") || traits.includes("스킨십러버")) score += 1;
  if (traits.includes("배변천재") && traits.includes("산책매너")) score += 2;
  if (traits.includes("모범견") || traits.includes("학습천재")) score += 1;
  if (traits.includes("선물요정") || traits.includes("다정환영")) score += 1;

  score = clamp(score, 65, 100);

  const topTraits = traits.slice(0, 3);
  const title = topTraits.length ? topTraits.join(" · ") : "사랑둥이";

  const petName = name.trim() || "우리 아이";
  const petBreed = breed.trim() || "반려견";
  const opening = pickOpening(traits, score);
  const advice = pickAdvice(traits, score);
  const headline = headlineFor(petName, score);
  const comment = `${opening} ${petBreed} ${petName}의 하루 패턴을 보니, 보호자를 향한 사랑지수는 ${score}%로 나타났어요.`;

  const tags = [
    "#유아독존",
    "#사랑지수조회",
    `#${petName.replace(/\s+/g, "")}`,
    "#엄마사랑지수",
    "#반려견사랑해",
    `#${petBreed.replace(/\s+/g, "")}`,
    ...topTraits.slice(0, 2).map((t) => `#${t}`),
  ];

  return {
    score,
    title,
    comment,
    headline,
    advice,
    tags,
    traits: topTraits,
  };
}

export function buildHashtagText(name: string, tags: string[]) {
  const safe = tags.length
    ? tags.join(" ")
    : `#유아독존 #${(name || "반려견").replace(/\s+/g, "")} #반려견사랑해`;
  return `${safe}\nwww.yourdogzone.co.kr`;
}
