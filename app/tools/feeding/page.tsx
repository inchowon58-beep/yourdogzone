import type { Metadata } from "next";
import { FeedingCalculator } from "@/components/tools/FeedingCalculator";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "강아지·고양이 사료 급여량 계산기",
  description:
    "체중·생애단계·체형으로 하루 급여량(g)과 필요 열량(kcal)을 수의영양 RER/MER 공식으로 계산합니다. 강아지·고양이 모두 지원.",
  path: "/tools/feeding",
  ogSubtitle: "급여량 계산기",
  keywords: [
    "강아지 급여량",
    "고양이 급여량",
    "사료 계산기",
    "RER",
    "MER",
  ],
});

export default function FeedingToolPage() {
  return (
    <ToolPageShell
      title="하루 급여량, 감이 아니라 수치로"
      description="체중과 생애 단계·체형만 넣으면 강아지·고양이의 하루 사료량(g)과 필요 열량(kcal)을 계산해 드려요. 제품 표와 함께 쓰는 ‘실전 시작점’입니다."
    >
      <FeedingCalculator />
    </ToolPageShell>
  );
}
