export type MbtiAxis = "EI" | "SN" | "TF" | "JP";

export type MbtiQuestion = {
  id: number;
  axis: MbtiAxis;
  text: string;
  optionA: { label: string; value: "E" | "S" | "T" | "J" };
  optionB: { label: string; value: "I" | "N" | "F" | "P" };
};

export type MbtiType = {
  code: string;
  title: string;
  subtitle: string;
  summary: string;
  careTips: string[];
  playIdeas: string[];
  traits: string[];
};

export const MBTI_QUESTIONS: MbtiQuestion[] = [
  {
    id: 1,
    axis: "EI",
    text: "산책 코스에 다른 강아지가 보이면?",
    optionA: { label: "꼬리 흔들며 먼저 인사를 시도한다", value: "E" },
    optionB: { label: "내 옆에서 상황을 지켜본다", value: "I" },
  },
  {
    id: 2,
    axis: "EI",
    text: "집에 손님이 오면 첫 반응은?",
    optionA: { label: "현관까지 달려가 환영 모드", value: "E" },
    optionB: { label: "한발 물러나 냄새·분위기를 살핀다", value: "I" },
  },
  {
    id: 3,
    axis: "EI",
    text: "놀이터에서 에너지 곡선은?",
    optionA: { label: "끝날 때까지 소셜 배터리 풀충전", value: "E" },
    optionB: { label: "짧게 놀고 조용한 회복 타임이 필요", value: "I" },
  },
  {
    id: 4,
    axis: "SN",
    text: "새 장난감이 생기면?",
    optionA: { label: "냄새·감촉부터 꼼꼼히 스캔한다", value: "S" },
    optionB: { label: "어떻게 놀지 상상하며 바로 실험한다", value: "N" },
  },
  {
    id: 5,
    axis: "SN",
    text: "평소 산책 루트는?",
    optionA: { label: "익숙한 길이 안정적이고 좋다", value: "S" },
    optionB: { label: "새 골목·새 냄새가 더 설렌다", value: "N" },
  },
  {
    id: 6,
    axis: "SN",
    text: "새 명령을 배울 때 스타일은?",
    optionA: { label: "같은 동작을 반복해 정확하게 익힌다", value: "S" },
    optionB: { label: "요령을 빠르게 캐치하고 응용한다", value: "N" },
  },
  {
    id: 7,
    axis: "TF",
    text: "잘못을 교정할 때 반응은?",
    optionA: { label: "차분히 ‘뭐가 안 되는지’ 파악하려는 편", value: "T" },
    optionB: { label: "표정이 바로 처지고 관계가 흔들린다", value: "F" },
  },
  {
    id: 8,
    axis: "TF",
    text: "간식을 나눌 때?",
    optionA: { label: "규칙이 공정하면 납득한다", value: "T" },
    optionB: { label: "내가 더 챙기면 유난히 행복해한다", value: "F" },
  },
  {
    id: 9,
    axis: "TF",
    text: "다른 강아지가 불안해 보이면?",
    optionA: { label: "자기 할 일을 계속한다", value: "T" },
    optionB: { label: "다가가 챙기려 한다", value: "F" },
  },
  {
    id: 10,
    axis: "JP",
    text: "하루 일과 리듬은?",
    optionA: { label: "식사·산책 시간이 일정해야 편하다", value: "J" },
    optionB: { label: "즉흥적으로 바뀌어도 잘 맞춘다", value: "P" },
  },
  {
    id: 11,
    axis: "JP",
    text: "장난감·이불 정리는?",
    optionA: { label: "정해진 자리를 선호하는 편", value: "J" },
    optionB: { label: "집 안 여기저기가 플레이그라운드", value: "P" },
  },
  {
    id: 12,
    axis: "JP",
    text: "새로운 트릭이 등장하면?",
    optionA: { label: "단계별로 차근차근 익힌다", value: "J" },
    optionB: { label: "재미있으면 바로 뛰어든다", value: "P" },
  },
];

const TYPE_META: Record<string, Omit<MbtiType, "code">> = {
  ISTJ: {
    title: "루틴 수호견",
    subtitle: "예측 가능한 일상이 최고의 안정제",
    summary:
      "약속된 시간에 산책·식사가 이뤄질 때 가장 편안해하는 타입입니다. 갑작스러운 변화보다 ‘오늘의 계획표’가 잘 맞아요. 신뢰를 쌓는 속도는 느려 보여도, 한 번 인정한 보호자에게는 묵직한 충성을 보입니다.",
    careTips: [
      "식사·산책·취침 시간을 가능한 한 고정하세요",
      "이사·손님·여행은 미리 짧은 적응 단계를 두세요",
      "칭찬은 과장보다 ‘정확히 무엇을 잘했는지’가 효과적",
    ],
    playIdeas: ["노즈워크 매트", "일정한 코스의 산책 미션", "기본 복종 복습 게임"],
    traits: ["규칙", "경계", "신뢰", "안정"],
  },
  ISFJ: {
    title: "다정한 케어견",
    subtitle: "가족 기운을 읽고 옆에 붙어 주는 힐러",
    summary:
      "보호자의 표정·목소리 톤에 민감하게 반응합니다. 큰 자극보다 부드러운 스킨십과 ‘함께 있는 시간’이 연료예요. 혼내는 방식보다 대체 행동을 알려 주는 훈련이 잘 맞습니다.",
    careTips: [
      "큰 소리·장시간 분리 시 불안이 커질 수 있어요",
      "혼자 두는 연습은 짧게·자주·성공 경험으로",
      "하루 10분의 ‘눈 맞춤 스킨십’을 루틴화해 보세요",
    ],
    playIdeas: ["토이 숨기기", "부드럽게 터그", "함께하는 마사지·빗질"],
    traits: ["공감", "애착", "배려", "온기"],
  },
  INFJ: {
    title: "직감형 관찰견",
    subtitle: "말은 없어도 분위기는 다 읽는 타입",
    summary:
      "시끄러운 환경보다 조용한 유대에서 빛납니다. 겉으로 티를 안 내도 스트레스는 쌓일 수 있어, ‘안 보이는 신호’(하품·입술 핥기·회피)를 잘 봐 주세요.",
    careTips: [
      "강제 소셜보다 선택권 있는 만남을 주세요",
      "카페·행사는 짧은 노출부터",
      "안식처(크레이트·매트)를 존중해 주세요",
    ],
    playIdeas: ["퍼즐 토이", "조용한 노즈워크", "한 사람과의 집중 훈련"],
    traits: ["관찰", "예민", "깊이", "선택적 유대"],
  },
  INTJ: {
    title: "전략가 멍멍이",
    subtitle: "패턴을 기억하고 스스로 답을 찾는다",
    summary:
      "단순 반복보다 ‘목표 있는 미션’에 몰입합니다. 영리해서 허술한 규칙을 간파하니, 집안 규칙도 일관되게 유지하는 게 중요해요.",
    careTips: [
      "훈련은 짧게·명확한 기준으로",
      "지루한 반복만 하면 흥미를 잃기 쉬워요",
      "성공 후 자유 시간으로 보상하면 학습이 빨라집니다",
    ],
    playIdeas: ["레벨형 퍼즐", "타겟 터치", "냄새 추적 게임"],
    traits: ["학습력", "독립", "집중", "계획"],
  },
  ISTP: {
    title: "쿨한 탐험견",
    subtitle: "필요할 때만 움직이는 실용 파워",
    summary:
      "관심 스위치가 켜지면 집중하고, 꺼지면 쿨하게 쉽니다. 억지로 사교를 강요하기보다 탐색·조작 놀이가 잘 맞아요.",
    careTips: [
      "충분한 코 사용 시간(냄새 맡기)을 주세요",
      "과한 스킨십보다 ‘같이 하기’가 편할 수 있어요",
      "안전장치(리드·하네스)는 탐험본능과 세트로",
    ],
    playIdeas: ["플릿볼", "디스섹터블 토이", "야외 탐색 산책"],
    traits: ["독립", "호기심", "침착", "실용"],
  },
  ISFP: {
    title: "감성 아티스트견",
    subtitle: "촉감·분위기·스킨십에 마음이 열리는 아이",
    summary:
      "감각이 풍부해 거친 핸들링에 쉽게 위축됩니다. 긍정적 강화와 부드러운 환경이 실력을 끌어올립니다.",
    careTips: [
      "빗질·발톱은 짧은 세션으로 나눠 주세요",
      "강압 교정은 역효과인 경우가 많아요",
      "좋아하는 질감의 매트·토이를 관찰해 보세요",
    ],
    playIdeas: ["부드러운 플러시 토이", "센터리 워크", "스니플 매트"],
    traits: ["감성", "온화", "감각", "자유"],
  },
  INFP: {
    title: "몽상가 멍뭉이",
    subtitle: "상상력 많고 마음이 여린 이상주의자",
    summary:
      "세상에 호기심이 많지만 상처도 잘 받습니다. 안정된 애착이 먼저 세워지면, 그다음 모험이 즐거워져요.",
    careTips: [
      "예측 가능한 하루 + 작은 새로움의 균형",
      "혼내는 말투보다 대체 행동을 가르치세요",
      "분리불안 신호가 있으면 조기 상담을 권합니다",
    ],
    playIdeas: ["숨바꼭질", "이름 부르기 게임", "부드러운 트릭"],
    traits: ["상상", "애정", "감수성", "이상"],
  },
  INTP: {
    title: "분석형 천재견",
    subtitle: "‘왜?’를 궁금해하는 두뇌파",
    summary:
      "머리를 쓰는 활동에서 스트레스를 풀습니다. 같은 트릭만 반복하면 지루해지니 변형을 주세요.",
    careTips: [
      "난이도를 조금씩 올려 성취감을 주세요",
      "강제 아이컨택보다 타겟·마커 훈련이 잘 맞을 수 있어요",
      "혼자 두는 시간에 퍼즐을 활용해 보세요",
    ],
    playIdeas: ["레벨 퍼즐", "쉘 게임", "트릭 체인"],
    traits: ["호기심", "논리", "관찰", "마이페이스"],
  },
  ESTP: {
    title: "액션 히어로견",
    subtitle: "지금 당장 달리고 싶은 에너지",
    summary:
      "순발력과 대담함이 무기입니다. 에너지를 올바르게 쓸 출구가 없으면 가구·리드 예절이 흔들릴 수 있어요.",
    careTips: [
      "짧게 고강도 + 쿨다운 루틴을 만드세요",
      "점프가 많은 놀이는 관절 상태에 맞게 조절",
      "예절은 ‘흥분 전’에 연습하는 편이 쉽습니다",
    ],
    playIdeas: ["플라이볼 입문", "터그", "스프린트 회수"],
    traits: ["활동", "대담", "순발력", "사교"],
  },
  ESFP: {
    title: "파티견 스타",
    subtitle: "관심과 즐거움이 연료인 분위기 메이커",
    summary:
      "사람 사이에서 빛나고, 칭찬을 먹을수록 실력이 늡니다. 다만 과흥분 시 점프·짖기가 늘 수 있어 ‘차분 보상’도 함께 가르치세요.",
    careTips: [
      "손님 인사는 앉기·네 발 착지부터",
      "칭찬은 풍부하게, 규칙은 명확하게",
      "과도한 카페인성 흥분 뒤에는 조용한 회복 시간",
    ],
    playIdeas: ["서커스 트릭", "사람 따라 하기", "짧은 애견카페"],
    traits: ["사교", "낙천", "표현", "유쾌"],
  },
  ENFP: {
    title: "아이디어 폭주견",
    subtitle: "새로운 자극이면 뭐든 신나는 타입",
    summary:
      "정이 많고 호기심이 폭발합니다. 루틴만 반복되면 지루해하니, 주 1~2회 작은 변화를 주세요.",
    careTips: [
      "산책 코스를 가끔 바꿔 주세요",
      "사회화는 질(좋은 경험)이 양보다 중요",
      "과도한 자유 뒤에는 간단한 구조화 훈련",
    ],
    playIdeas: ["새 장난감 로테이션", "트릭 배우기", "노즈워크 산책"],
    traits: ["열정", "창의", "친화", "모험"],
  },
  ENTP: {
    title: "장난꾸러기 전략견",
    subtitle: "규칙을 응용해 재미를 업그레이드",
    summary:
      "영리해서 ‘하면 안 되는 것’도 게임처럼 풀어냅니다. 금지보다 대체 행동을 더 재미있게 만들어 주세요.",
    careTips: [
      "가구 파괴는 심심함 신호일 수 있어요",
      "규칙을 가족 모두가 같게 지키세요",
      "두뇌 피로를 풀어 주는 시간이 필수",
    ],
    playIdeas: ["트릭 조합", "쉘 게임", "인터랙티브 급식"],
    traits: ["재치", "도전", "영리", "자유"],
  },
  ESTJ: {
    title: "캡틴 감독견",
    subtitle: "역할과 질서가 있으면 든든해진다",
    summary:
      "리더십이 있어 보이지만, 사실 ‘일관된 가이드’가 있을 때 가장 안정적입니다. 보호자가 흔들리면 집이 혼란스러워질 수 있어요.",
    careTips: [
      "명령어·규칙을 하나로 통일하세요",
      "과도한 통제보다 명확한 기대치를",
      "운동량 충족이 예절의 기초입니다",
    ],
    playIdeas: ["복종 코스", "운반 미션", "정해진 자리 대기"],
    traits: ["책임", "리더십", "일관성", "추진"],
  },
  ESFJ: {
    title: "소셜 케어견",
    subtitle: "모두가 화목하길 바라는 관계형 타입",
    summary:
      "사람과 강아지 사이를 잇는 다정한 성격입니다. 소속감과 칭찬이 최고의 동기예요.",
    careTips: [
      "혼자 두는 시간을 점진적으로 늘리세요",
      "방문 손님 훈련은 성공 경험을 쌓아 가며",
      "과보호보다 ‘함께 해결’하는 연습",
    ],
    playIdeas: ["그룹 산책(매너 있는)", "트릭 자랑", "터치 게임"],
    traits: ["친화", "배려", "협동", "애정"],
  },
  ENFJ: {
    title: "카리스마 멘토견",
    subtitle: "분위기를 읽고 리드하는 따뜻한 리더",
    summary:
      "사교적이면서도 눈치가 빨라, 관계 중심 훈련에 강합니다. 보호자와의 ‘팀워크’가 느껴질 때 최고의 퍼포먼스를 냅니다.",
    careTips: [
      "함께하는 스포츠·취미가 잘 맞아요",
      "감정적으로 혼내기보다 가이드를 주세요",
      "과도한 스케줄은 번아웃을 부를 수 있어요",
    ],
    playIdeas: ["프리스타일 힐워크", "팀 트릭", "애견 스포츠 입문"],
    traits: ["공감", "지도력", "사교", "열정"],
  },
  ENTJ: {
    title: "야심찬 캡틴견",
    subtitle: "목표가 보이면 끝까지 가는 타입",
    summary:
      "도전과 성취를 즐깁니다. 난이도 있는 미션을 주면 눈이 반짝이고, 심심하면 집안일을 ‘프로젝트’로 만들 수도 있어요.",
    careTips: [
      "주간 미션(새 트릭 1개)을 정해 보세요",
      "안전·관절을 해치지 않는 선에서 도전",
      "성공 후 충분한 휴식도 훈련의 일부",
    ],
    playIdeas: ["애질리티 입문", "난이도 퍼즐", "회수·운반 미션"],
    traits: ["결단", "목표", "자신감", "추진"],
  },
};

function stripBored(text: string): string {
  return text.replace(/\bBored\b/gi, "지루해");
}

export function resolveMbtiType(
  answers: Array<"E" | "I" | "S" | "N" | "T" | "F" | "J" | "P">
): MbtiType {
  const count: Record<string, number> = {
    E: 0,
    I: 0,
    S: 0,
    N: 0,
    T: 0,
    F: 0,
    J: 0,
    P: 0,
  };
  for (const a of answers) count[a] += 1;

  const code =
    (count.E >= count.I ? "E" : "I") +
    (count.S >= count.N ? "S" : "N") +
    (count.T >= count.F ? "T" : "F") +
    (count.J >= count.P ? "J" : "P");

  const meta = TYPE_META[code] ?? TYPE_META.ISFJ;
  return {
    code,
    ...meta,
    summary: stripBored(meta.summary),
    careTips: meta.careTips.map(stripBored),
  };
}
