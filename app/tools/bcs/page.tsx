import type { Metadata } from "next";
import { BcsChecker } from "@/components/tools/BcsChecker";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "반려동물 비만도(BCS) 자가 진단",
  description:
    "갈비뼈·허리 라인·복부 처짐으로 강아지·고양이 BCS 1~9단계를 진단하고, 맞춤 관리 가이드를 안내합니다.",
  path: "/tools/bcs",
  ogSubtitle: "비만도 BCS 체크",
  keywords: [
    "강아지 비만도",
    "고양이 비만도",
    "BCS",
    "Body Condition Score",
    "반려동물 체중관리",
  ],
});

export default function BcsToolPage() {
  return (
    <ToolPageShell
      title="우리 아이 비만도는?"
      description="갈비뼈가 만져지는 정도, 허리 라인, 배 처짐을 체크하면 BCS 1~9단계와 재미 닉네임, 맞춤 관리 팁까지 바로 보여드려요."
    >
      <BcsChecker />
    </ToolPageShell>
  );
}
