import type { LucideIcon } from "lucide-react";
import { Award, ClipboardCheck, LifeBuoy, ShieldCheck } from "lucide-react";

export type AdvisoryBoardItem = {
  category: string;
  title: string;
  icon: LucideIcon;
};

export const ADVISORY_BOARD_HEADLINE =
  "왜 '유아독존'의 매칭을 신뢰할 수 있을까요?";

export const ADVISORY_BOARD_DESCRIPTION =
  "대한민국 최고 권위를 자랑하는 분야별 위원장단이 객관적인 기준(시설 위생, 교육 커리큘럼, 윤리적 운영)을 바탕으로 정기적으로 검증하고 추천하기 때문입니다.";

export const ADVISORY_BOARD_ITEMS: AdvisoryBoardItem[] = [
  {
    category: "훈련/행정",
    title: "연맹 훈련사 위원장 자문",
    icon: ClipboardCheck,
  },
  {
    category: "시설/윤리",
    title: "연맹 감찰 위원장 검증",
    icon: ShieldCheck,
  },
  {
    category: "안전/구조",
    title: "연맹 인명구조견 위원장 자문",
    icon: LifeBuoy,
  },
  {
    category: "교육/심사",
    title: "연맹 도그쇼심사 위원장 평가",
    icon: Award,
  },
];
