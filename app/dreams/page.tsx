import type { Metadata } from "next";
import { DreamCatalogGrid } from "@/components/dreams/DreamCatalogGrid";
import { DreamInterpreter } from "@/components/dreams/DreamInterpreter";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { DREAM_ARTICLES } from "@/lib/dreams/catalog";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "유아독존 반려동물 꿈 해몽소",
  description:
    "강아지·고양이·토끼·햄스터·거북이 등 반려동물 꿈을 해몽해 드립니다. 상황별 SEO 해몽 사전과 맞춤 해석 툴을 한곳에서.",
  path: "/dreams",
  ogSubtitle: "꿈 해몽소",
  keywords: [
    "반려동물 꿈 해몽",
    "강아지 꿈 해몽",
    "고양이 꿈",
    "죽은 강아지 꿈",
    "강아지 날아가는 꿈",
    "유아독존 꿈해몽소",
  ],
});

export default function DreamsPage() {
  return (
    <ToolPageShell
      title="반려동물 꿈 해몽소"
      description={`동물과 꿈 상황을 고르면 맞춤 해몽을 알려 드려요. 검색으로 많이 찾는 ${DREAM_ARTICLES.length}개 장면별 상세 가이드도 함께 준비되어 있습니다.`}
    >
      <div className="space-y-10">
        <DreamInterpreter />
        <DreamCatalogGrid />
      </div>
    </ToolPageShell>
  );
}
