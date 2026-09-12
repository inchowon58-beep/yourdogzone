/** 반려견 임신 주차 · 출산 예정일 · 케어 캘린더 (평균 63일) */

export const DOG_GESTATION_DAYS = 63;
export const DOG_GESTATION_RANGE = { min: 58, max: 68 } as const;

export type PregnancyWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type WeekGuide = {
  week: PregnancyWeek;
  title: string;
  nickname: string;
  emoji: string;
  dayRange: string;
  fetus: string[];
  momCare: string[];
  nutrition: string[];
  checklist: string[];
  birthSigns?: string[];
};

export type PregnancyPlan = {
  matingDate: Date;
  dueDate: Date;
  dueEarly: Date;
  dueLate: Date;
  today: Date;
  daysPregnant: number;
  daysLeft: number;
  currentWeek: PregnancyWeek | 0 | 10;
  phaseLabel: string;
  progressPercent: number;
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}

export function parseLocalDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== mo - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return startOfDay(date);
}

export function formatKoDate(d: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(d);
}

export function formatShortDate(d: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
  }).format(d);
}

export function buildPregnancyPlan(
  matingInput: string,
  todayInput: Date = new Date()
): PregnancyPlan | null {
  const matingDate = parseLocalDate(matingInput);
  if (!matingDate) return null;
  const today = startOfDay(todayInput);
  const dueDate = addDays(matingDate, DOG_GESTATION_DAYS);
  const dueEarly = addDays(matingDate, DOG_GESTATION_RANGE.min);
  const dueLate = addDays(matingDate, DOG_GESTATION_RANGE.max);
  const daysPregnant = Math.floor(
    (today.getTime() - matingDate.getTime()) / 86400000
  );
  const daysLeft = Math.floor(
    (dueDate.getTime() - today.getTime()) / 86400000
  );

  let currentWeek: PregnancyWeek | 0 | 10;
  if (daysPregnant < 0) currentWeek = 0;
  else if (daysPregnant >= DOG_GESTATION_DAYS) currentWeek = 10;
  else currentWeek = (Math.min(9, Math.floor(daysPregnant / 7) + 1) ||
    1) as PregnancyWeek;

  let phaseLabel = "";
  if (daysPregnant < 0) phaseLabel = "교배일 이전";
  else if (daysPregnant === 0) phaseLabel = "교배 당일";
  else if (daysPregnant >= DOG_GESTATION_DAYS) phaseLabel = "출산 예정일 도래·출산기";
  else if (currentWeek <= 3) phaseLabel = "초기 · 착상·기관 형성";
  else if (currentWeek <= 6) phaseLabel = "중기 · 성장·영양 강화";
  else phaseLabel = "후기 · 출산 준비";

  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((daysPregnant / DOG_GESTATION_DAYS) * 100))
  );

  return {
    matingDate,
    dueDate,
    dueEarly,
    dueLate,
    today,
    daysPregnant,
    daysLeft,
    currentWeek,
    phaseLabel,
    progressPercent,
  };
}

export function weekDateRange(matingDate: Date, week: PregnancyWeek): {
  start: Date;
  end: Date;
} {
  const startDay = (week - 1) * 7;
  const endDay = week === 9 ? DOG_GESTATION_DAYS : week * 7 - 1;
  return {
    start: addDays(matingDate, startDay),
    end: addDays(matingDate, endDay),
  };
}

export const PREGNANCY_WEEKS: WeekGuide[] = [
  {
    week: 1,
    title: "1주차 · 수정과 이동",
    nickname: "시크릿 스타트",
    emoji: "🌱",
    dayRange: "0~6일",
    fetus: [
      "정자와 난자가 만나 수정란이 됩니다.",
      "수정란이 난관을 따라 자궁으로 이동합니다.",
      "아직 초음파로는 거의 확인이 어렵습니다.",
    ],
    momCare: [
      "격한 운동·점프·배 압박을 피하세요.",
      "평소 사료를 유지하되, 스트레스·여행은 줄이세요.",
      "기생충·예방약·방사선 노출은 수의사와 상의하세요.",
    ],
    nutrition: [
      "아직 급여량을 크게 늘리지 마세요.",
      "양질의 성견 유지식 또는 임신 전 균형 식단을 유지합니다.",
      "엽산·오메가3가 포함된 종합 영양을 수의사와 검토하세요.",
    ],
    checklist: [
      "교배일·수컷 정보 기록",
      "기초 체중·BCS 기록",
      "병원 임신 확인 일정 잡기(보통 3~4주차)",
    ],
  },
  {
    week: 2,
    title: "2주차 · 착상 준비",
    nickname: "자리 잡기",
    emoji: "🫧",
    dayRange: "7~13일",
    fetus: [
      "배아가 자궁벽에 착상할 준비를 합니다.",
      "세포 분열이 빠르게 진행됩니다.",
      "겉으로는 티가 거의 나지 않습니다.",
    ],
    momCare: [
      "배 마사지·과도한 배 촉진은 삼가세요.",
      "식욕·활력 변화를 메모해 두세요.",
      "다른 개와의 격렬한 놀이를 줄이세요.",
    ],
    nutrition: [
      "신선한 물과 규칙적인 끼니를 유지합니다.",
      "간식은 하루 칼로리의 10% 이내로.",
      "날음식·검증 안 된 보조제는 주의하세요.",
    ],
    checklist: [
      "임신 가능 여부 관찰 일지 시작",
      "기존 약·심장사상충 약 복용 확인",
    ],
  },
  {
    week: 3,
    title: "3주차 · 착상·기관 시작",
    nickname: "하트비트 예고",
    emoji: "💗",
    dayRange: "14~20일",
    fetus: [
      "착상이 이뤄지고 초기 기관 형성이 시작됩니다.",
      "배아의 기본 구조가 잡히기 시작합니다.",
      "일부 개체는 초음파로 아주 이른 확인이 가능할 수 있습니다.",
    ],
    momCare: [
      "입덧처럼 식욕이 들쑥날쑥할 수 있어요.",
      "구토·무기력이 심하면 병원 상담을 권합니다.",
      "산책을 짧게·평지로 유지하세요.",
    ],
    nutrition: [
      "소량 다회로 나눠 주면 속이 편할 수 있습니다.",
      "냄새에 민감해지면 사료를 미지근하게 데워 보세요.",
      "칼슘 과다 보충은 아직 하지 마세요.",
    ],
    checklist: [
      "초음파 임신 확인 예약(대개 25~35일)",
      "출산 공간(육아실) 후보 자리 정하기",
    ],
  },
  {
    week: 4,
    title: "4주차 · 심장·골격 기초",
    nickname: "리틀 하트",
    emoji: "🫀",
    dayRange: "21~27일",
    fetus: [
      "심장이 뛰기 시작하고 사지·눈 형태가 잡힙니다.",
      "초음파로 임신 확인이 가장 흔한 시기입니다.",
      "태아 수 대략 확인이 가능할 수 있습니다.",
    ],
    momCare: [
      "병원 초음파·프로게스테론 등 확인을 진행하세요.",
      "유선이 살짝 발달하기 시작할 수 있습니다.",
      "체중을 주 1회 기록하세요.",
    ],
    nutrition: [
      "임신 중기용 또는 성장기(퍼피) 사료로 전환을 검토하세요.",
      "하루 칼로리를 점진적으로 10~20% 올려 볼 수 있습니다.",
      "단백질·필수 지방산이 충분한 식단을 선택하세요.",
    ],
    checklist: [
      "초음파 결과·태아 수 기록",
      "출산 병원·비상 연락처 확보",
      "육아박스·보온 패드 구매 목록 작성",
    ],
  },
  {
    week: 5,
    title: "5주차 · 급성장",
    nickname: "성장 부스터",
    emoji: "📈",
    dayRange: "28~34일",
    fetus: [
      "발가락·발톱·수염 등이 발달합니다.",
      "장기가 빠르게 커지고 움직임이 늘어납니다.",
      "산모 배가 조금씩 불러 올 수 있습니다.",
    ],
    momCare: [
      "점프·계단·미끄러운 바닥을 조심하세요.",
      "산책은 짧게 여러 번으로 나누세요.",
      "유선·배 피부 청결을 가볍게 관리하세요.",
    ],
    nutrition: [
      "급여량을 유지식 대비 약 25~40%까지 늘려 갈 수 있습니다.",
      "하루 2~3회 이상 나눠 급여하세요.",
      "고품질 단백질 위주, 빈 칼로리 간식은 줄이세요.",
    ],
    checklist: [
      "출산 키트(가위·실·소독·수건) 초안",
      "온도·습도계 준비",
      "산모·새끼 체중계 준비",
    ],
  },
  {
    week: 6,
    title: "6주차 · 골격·털 발달",
    nickname: "골든 그로우",
    emoji: "✨",
    dayRange: "35~41일",
    fetus: [
      "골격이 단단해지고 털이 나기 시작합니다.",
      "성별 구분이 뚜렷해집니다.",
      "방사선(X-ray)으로 태아 수 확인은 보통 더 후기에 합니다.",
    ],
    momCare: [
      "배가 무거워져 숨이 가쁠 수 있어요. 무더위를 피하세요.",
      "혼자 높은 곳에 오르지 못하게 하세요.",
      "배변·소변 횟수 변화를 관찰하세요.",
    ],
    nutrition: [
      "성장기/임신·수유 전용 사료를 본격 적용하세요.",
      "하루 칼로리는 유지식 대비 약 40~50% 증가가 흔합니다.",
      "칼슘은 임의 대량 보충하지 말고 수의사 지시를 따르세요.",
    ],
    checklist: [
      "육아실 소독·조용한 위치 확정",
      "산모가 익숙해지도록 박스에 담요를 넣어 두기",
      "야간 출산 대비 조명·손전등",
    ],
  },
  {
    week: 7,
    title: "7주차 · 폐·면역 준비",
    nickname: "파이널 빌드",
    emoji: "🛡️",
    dayRange: "42~48일",
    fetus: [
      "폐와 면역 관련 발달이 이어집니다.",
      "태아가 자리를 잡고 움직임이 강해질 수 있습니다.",
      "산모 체중이 눈에 띄게 늘 수 있습니다.",
    ],
    momCare: [
      "유선이 커지고 초유가 비칠 수 있습니다.",
      "식욕이 줄면 소량 다회 급여로 전환하세요.",
      "스트레스·손님·큰 소음을 최소화하세요.",
    ],
    nutrition: [
      "칼로리는 유지식 대비 50~70%까지 필요할 수 있습니다.",
      "수분 섭취를 늘리고 미지근한 물을 자주 제공하세요.",
      "변비 예방을 위해 섬유·수분 균형을 챙기세요.",
    ],
    checklist: [
      "출산 키트 최종 점검",
      "병원까지 이동 경로·야간 진료 확인",
      "도우미(가족) 역할 분담",
    ],
  },
  {
    week: 8,
    title: "8주차 · 출산 임박 준비",
    nickname: "카운트다운",
    emoji: "⏳",
    dayRange: "49~55일",
    fetus: [
      "대부분 장기가 갖춰지고 폐 성숙이 이어집니다.",
      "X-ray로 태아 수·머리 크기를 확인하는 시기입니다.",
      "태아 위치가 출산에 맞게 정리됩니다.",
    ],
    momCare: [
      "직장 체온을 하루 2회 측정해 기록하세요(출산 전 하락 신호).",
      "둥지를 트는 행동·불안·숨을 헐떡임이 나타날 수 있습니다.",
      "긴 산책·장거리 이동은 피하세요.",
    ],
    nutrition: [
      "식욕이 들쭉날쭉해도 소량씩 자주 주세요.",
      "수유를 대비해 고칼로리·고단백 식단을 유지하세요.",
      "출산 직전 임의 칼슘제는 위험할 수 있어 수의사 확인이 필요합니다.",
    ],
    checklist: [
      "체온계·기록지 준비",
      "깨끗한 수건 다량·비닐·손소독제",
      "탯줄용 치실·소독된 가위(병원 가이드 따름)",
      "비상 이동용 캐리어·담요",
    ],
    birthSigns: [
      "안절부절·구석을 찾음",
      "식욕 감소",
      "유선에서 초유",
      "체온이 평소보다 약 1°C 하락 후 출산이 임박할 수 있음",
    ],
  },
  {
    week: 9,
    title: "9주차 · 출산창",
    nickname: "웰컴 데이",
    emoji: "🎀",
    dayRange: "56~63일(+α)",
    fetus: [
      "출산 준비가 끝난 상태로, 개체별로 58~68일 사이 출산이 흔합니다.",
      "평균 예정일은 교배 후 약 63일입니다.",
      "첫 강아지 이후 간격·난산 여부를 계속 관찰해야 합니다.",
    ],
    momCare: [
      "진통·초록/검은 분비물·2시간 이상 힘주는데 나오지 않으면 즉시 병원.",
      "출산 중에는 조용히, 필요 시에만 도우세요.",
      "태어나면 호흡·수유·체온(따뜻함)을 확인하세요.",
    ],
    nutrition: [
      "출산·수유 직후 수분과 칼로리 수요가 급증합니다.",
      "수유견용 고칼로리 식단을 자유 급여에 가깝게 제공하세요.",
      "산후 저칼슘(eclampsia) 증상이 있으면 응급입니다.",
    ],
    checklist: [
      "출산 진행 시간표 기록",
      "새끼 수·체중·수유 여부 체크",
      "태반 수와 새끼 수 대조",
      "산후 24~48시간 병원 검진 예약",
    ],
    birthSigns: [
      "강한 힘주기·양수 파수",
      "초록·어두운 분비물(태반 분리 신호일 수 있음)",
      "체온 하락 후 정상으로 돌아오며 진통 시작",
      "숨이 매우 가쁘고 계속 보챔",
    ],
  },
];

export function getWeekGuide(week: PregnancyWeek): WeekGuide {
  return PREGNANCY_WEEKS[week - 1];
}

export const BIRTH_KIT_MASTER = [
  "깨끗하고 미끄럽지 않은 육아박스",
  "보온등 또는 안전 난방·온도계",
  "수건·물티슈(무향)·손소독제",
  "디지털 체온계(산모)",
  "새끼·산모용 체중계",
  "탯줄 처리 용품(병원 지시에 따른 소독 도구)",
  "비상 이동 캐리어·담요",
  "수의사/응급병원 연락처",
  "기록지(출산 시각·체중·수유)",
  "산모 수분·고칼로리 사료",
];
