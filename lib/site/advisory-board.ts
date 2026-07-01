import type { LucideIcon } from "lucide-react";
import { Award, ClipboardCheck, LifeBuoy, ShieldCheck } from "lucide-react";

export type AdvisoryBoardItem = {
  category: string;
  title: string;
  icon: LucideIcon;
};

export const ADVISORY_BOARD_EYEBROW = "공식 자문단 인증";

export const ADVISORY_BOARD_HEADLINE =
  "가짜 영수증 리뷰, 광고로 도배된 블로그 글에 아직도 속고 계십니까?";

export const ADVISORY_BOARD_DESCRIPTION =
  "돈을 주고 만들어낸 거짓 정보 속에서 가장 중요한 것은 '진짜가 무엇인가'입니다. [유아독존]은 대행사의 거짓 리뷰를 배제합니다. 대한민국 반려견 업계를 이끄는 최고 권위 위원장단이 직접 시설 위생, 교육 과정, 윤리적 운영을 철저하게 공동 검증한 '진짜 안심 기관'만 연결합니다.";

export const ADVISORY_BOARD_ITEMS: AdvisoryBoardItem[] = [
  {
    category: "훈련/행정 부문",
    title: "한국애견연맹 훈련사 위원장 공동 검증",
    icon: ClipboardCheck,
  },
  {
    category: "안심/윤리 부문",
    title: "한국애견연맹 감찰 위원장 시설 감시",
    icon: ShieldCheck,
  },
  {
    category: "안전/구조 부문",
    title: "한국애견연맹 인명구조견 위원장 인프라 자문",
    icon: LifeBuoy,
  },
  {
    category: "교육/심사 부문",
    title: "한국애견연맹 심사 위원장 커리큘럼 평가",
    icon: Award,
  },
];
