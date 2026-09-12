import type { Metadata } from "next";
import { LoveScoreAnalyzer } from "@/components/tools/LoveScoreAnalyzer";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "유아독존 사랑지수조회",
  description:
    "유아독존 사랑지수조회 — 강아지 사진·이름·견종과 산책·배변·환영 등 12문항으로 엄마사랑지수를 조회하세요. 결과 점수와 인스타 공유 카드까지 바로 확인합니다.",
  path: "/tools/love-score",
  ogSubtitle: "사랑지수조회",
  keywords: [
    "유아독존 사랑지수조회",
    "사랑지수조회",
    "강아지 사랑지수",
    "엄마사랑지수",
    "반려견 사랑지수",
    "강아지 성향 테스트",
    "유아독존",
  ],
});

export default function LoveScorePage() {
  return (
    <ToolPageShell
      title="유아독존 사랑지수조회"
      description="사진·이름·견종을 넣은 뒤 12문항을 고르면 엄마사랑지수(%)가 도장처럼 찍혀 나오고, 인스타 공유 카드도 함께 만들어집니다."
    >
      <LoveScoreAnalyzer />
    </ToolPageShell>
  );
}
