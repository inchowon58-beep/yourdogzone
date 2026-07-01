import "server-only";

import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import type { RegionalSeoContext } from "@/lib/academy/regional-seo-vars";
import {
  buildPlaceholderSeoBlocksNearby,
} from "@/lib/academy/regional-seo-vars";

export type RegionalSeoContentPick = {
  regionInfo?: string;
  metaDescription?: string;
  seoBlocks: RegionalLandingPage["seoBlocks"];
  faqItems: RegionalLandingPage["faqItems"];
  variant: "local" | "nearby" | "generic";
};

/** A안(지역 내 인증추천 있음) / B안(없음·인근 안내) 중 렌더용 원본 선택 */
export function pickRegionalSeoContent(
  page: RegionalLandingPage,
  ctx: RegionalSeoContext
): RegionalSeoContentPick {
  if (ctx.hasRecommendedAcademy) {
    return {
      regionInfo: page.regionInfo,
      metaDescription: page.metaDescription,
      seoBlocks: page.seoBlocks?.length ? page.seoBlocks : undefined,
      faqItems: page.faqItems?.length ? page.faqItems : undefined,
      variant: "local",
    };
  }

  if (ctx.hasNearbyRecommendedAcademy) {
    return {
      regionInfo:
        page.regionInfoNearby ??
        `{region}에는 아직 유아독존 인증 추천 학원이 등록되어 있지 않습니다. 통학·상담이 가능한 인근 {nearbyRecommendedRegion} 지역 [{nearbyRecommendedAcademyName}] 정보를 함께 안내합니다.`,
      metaDescription:
        page.metaDescriptionNearby ??
        `{region} 애견미용학원 안내. 해당 지역 인증 추천은 없으나 인근 {nearbyRecommendedRegion} [{nearbyRecommendedAcademyName}] 참고.`,
      seoBlocks: page.seoBlocksNearby?.length
        ? page.seoBlocksNearby
        : buildPlaceholderSeoBlocksNearby(),
      faqItems: page.faqItemsNearby?.length ? page.faqItemsNearby : undefined,
      variant: "nearby",
    };
  }

  return {
    regionInfo: page.regionInfo,
    metaDescription: page.metaDescription,
    seoBlocks: page.seoBlocks?.length ? page.seoBlocks : undefined,
    faqItems: page.faqItems?.length ? page.faqItems : undefined,
    variant: "generic",
  };
}
