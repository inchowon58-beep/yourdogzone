import type { Metadata } from "next";
import { MbtiQuiz } from "@/components/tools/MbtiQuiz";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "멍BTI · 냥BTI 성격 테스트",
  description:
    "12문항으로 강아지 멍BTI / 고양이 냥BTI를 알아보고, 유형별 돌봄 팁과 추천 놀이까지 받아보세요.",
  path: "/tools/mbti",
  ogSubtitle: "멍BTI · 냥BTI",
  keywords: ["멍BTI", "냥BTI", "강아지 성격테스트", "고양이 성격테스트"],
});

export default function MbtiToolPage() {
  return (
    <ToolPageShell
      title="멍BTI · 냥BTI 성격 테스트"
      description="결과 코드만 던지지 않습니다. 우리 아이 패턴에 맞는 돌봄 포인트와 놀이 아이디어까지 구체적으로 제안해요."
    >
      <MbtiQuiz />
    </ToolPageShell>
  );
}
