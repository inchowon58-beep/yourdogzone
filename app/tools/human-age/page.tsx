import type { Metadata } from "next";
import { HumanAgeCalculator } from "@/components/tools/HumanAgeCalculator";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "강아지·고양이 사람 나이 계산기",
  description:
    "강아지는 체구별, 고양이는 연령 곡선으로 사람 나이를 환산하고 생애 단계별 돌봄 팁까지 안내합니다.",
  path: "/tools/human-age",
  ogSubtitle: "사람 나이 계산기",
  keywords: ["강아지 사람 나이", "고양이 사람 나이", "펫 나이 계산"],
});

export default function HumanAgeToolPage() {
  return (
    <ToolPageShell
      title="우리 아이 사람 나이는?"
      description="숫자만 보여주는 계산기가 아닙니다. 환산 결과와 함께 성장기·성년기·시니어에 맞춰 지금 챙기면 좋은 돌봄 포인트를 알려드려요."
    >
      <HumanAgeCalculator />
    </ToolPageShell>
  );
}
