export type AdvisoryBoardItem = {
  category: string;
  title: string;
};

export const ADVISORY_BOARD_EYEBROW = "공식 자문단 인증";

export const ADVISORY_BOARD_HEADLINE =
  "대한민국 최고 권위 기관의 엄격한 검증과 약속";

export const ADVISORY_BOARD_DESCRIPTION =
  "수많은 광고성 정보 속에서 가장 중요한 것은 검증된 진짜 공신력입니다. [유아독존]은 한국애견연맹의 각 분야별 최고 권위 위원장단과 함께 엄격한 기준을 바탕으로 심사한 공식 인증 기관만을 매칭할 것을 보증합니다.";

export const ADVISORY_BOARD_ITEMS: AdvisoryBoardItem[] = [
  {
    category: "훈련/행정 부문",
    title: "한국애견연맹 훈련사 위원장 공식 검증",
  },
  {
    category: "안심/윤리 부문",
    title: "한국애견연맹 감찰 위원장 시설 감시",
  },
  {
    category: "안전/구조 부문",
    title: "한국애견연맹 인명구조견 위원장 인프라 자문",
  },
  {
    category: "교육/심사 부문",
    title: "한국애견연맹 심사 위원장 커리큘럼 평가",
  },
];
