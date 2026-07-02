import "server-only";

import type { RegionalLandingPage } from "@/lib/types/regional-landing";

export type RegionalSeoContentPick = {
  regionInfo?: string;
  metaDescription?: string;
  seoBlocks: RegionalLandingPage["seoBlocks"];
  faqItems: RegionalLandingPage["faqItems"];
};

/** 단일 SEO 문서 — 구버전 B안 필드는 폴백만 */
export function pickRegionalSeoContent(
  page: RegionalLandingPage
): RegionalSeoContentPick {
  return {
    regionInfo: page.regionInfo ?? page.regionInfoNearby,
    metaDescription: page.metaDescription ?? page.metaDescriptionNearby,
    seoBlocks: page.seoBlocks?.length
      ? page.seoBlocks
      : page.seoBlocksNearby?.length
        ? page.seoBlocksNearby
        : undefined,
    faqItems: page.faqItems?.length
      ? page.faqItems
      : page.faqItemsNearby?.length
        ? page.faqItemsNearby
        : undefined,
  };
}
