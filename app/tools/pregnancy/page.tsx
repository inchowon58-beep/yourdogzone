import type { Metadata } from "next";
import { PregnancyCalendar } from "@/components/tools/PregnancyCalendar";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "반려견 임신 주차 · 출산 예정일 케어 캘린더",
  description:
    "교배일을 입력하면 출산 예정일과 주차별 태아 발달, 산모견 영양, 출산 임박 징후, 준비물 체크리스트를 자동으로 보여줍니다.",
  path: "/tools/pregnancy",
  ogSubtitle: "임신 케어 캘린더",
  keywords: [
    "강아지 임신",
    "출산 예정일",
    "임신 주차",
    "브리더",
    "산모견 케어",
  ],
});

export default function PregnancyToolPage() {
  return (
    <ToolPageShell
      title="임신 주차 · 출산 케어 캘린더"
      description="교배일만 넣으면 평균 63일 기준으로 예정일과 9주 케어 가이드가 펼쳐집니다. 태아 발달, 영양, 출산 징후, 준비물까지 한곳에서 체크하세요."
    >
      <PregnancyCalendar />
    </ToolPageShell>
  );
}
