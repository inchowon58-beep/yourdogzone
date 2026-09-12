import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { PetshopCurationWizard } from "@/components/tools/PetshopCurationWizard";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildWebApplicationJsonLd } from "@/lib/seo/site-jsonld";

const TITLE = "유아독존 펫샵선택도우미";
const DESCRIPTION =
  "유아독존 펫샵선택도우미 — 희망 동물·품종·지역·분양 방식(방문·배송·수입·책임무료)·시기·우려 사항과 반려 이력을 입력하면 맞춤 분양 가이드와 안심제휴 펫샵을 매칭합니다. 허위 무료분양 주의 안내와 상담 요약도 제공합니다.";
const PATH = "/tools/petshop-curation";

export const metadata: Metadata = buildPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  ogSubtitle: "펫샵선택도우미",
  keywords: [
    "유아독존 펫샵선택도우미",
    "펫샵선택도우미",
    "맞춤 분양",
    "안심제휴 펫샵",
    "강아지 분양 가이드",
    "고양이 분양 상담",
    "허위매물",
    "무료분양 주의",
    "유아독존",
  ],
});

export default function PetshopCurationPage() {
  return (
    <ToolPageShell
      title="유아독존 펫샵선택도우미"
      description="조건·성향·반려 이력을 단계별로 입력하면 맞춤 분양 체크포인트와 안심제휴·등록 펫샵을 매칭합니다. 결과는 상담 요약·JSON으로 바로 복사할 수 있어요."
    >
      <JsonLd
        data={buildWebApplicationJsonLd({
          name: TITLE,
          description: DESCRIPTION,
          path: PATH,
        })}
      />
      <PetshopCurationWizard />
    </ToolPageShell>
  );
}
