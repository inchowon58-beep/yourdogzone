import "server-only";

import { generateRegionalLandingWithGemini } from "@/lib/ai/regional-landing-gemini";
import { getNearbyDistricts } from "@/lib/constants/region-nearby-districts";
import { getNearbyStations } from "@/lib/constants/region-nearby-stations";
import {
  resolveNearbyAreas,
  resolveNearbyStations,
} from "@/lib/academy/resolve-nearby-areas";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import type { RegionalSeoContext } from "@/lib/academy/regional-seo-vars";
import { upsertRegionalLanding } from "@/lib/academy/regional-store";

/** 저장된 SEO 본문이 없을 때만 Gemini로 1회 생성 (추천학원 변경은 렌더 시 변수 치환) */
export async function ensureRegionalSeoContent(
  page: RegionalLandingPage,
  ctx: RegionalSeoContext
): Promise<RegionalLandingPage> {
  if (page.seoBlocks?.length) return page;

  let nearbyLabels = resolveNearbyAreas(page);
  let nearbyStations = resolveNearbyStations(page);
  if (nearbyLabels.length === 0) {
    nearbyLabels = getNearbyDistricts(page.label, 5);
    if (nearbyLabels.length > 0) {
      page = { ...page, nearbyAreas: nearbyLabels };
    }
  }
  if (nearbyStations.length === 0) {
    nearbyStations = getNearbyStations(page.label, 5);
    if (nearbyStations.length > 0) {
      page = { ...page, nearbyStations };
    }
  }

  const gemini = await generateRegionalLandingWithGemini({
    label: page.label,
    keyword: page.keyword,
    regionBig: page.regionBig,
    nearbyLabels,
    recommendedAcademyName: ctx.recommendedAcademyName,
    recommendedAcademyHighlight: ctx.recommendedAcademyHighlight,
    hasRecommendedAcademy: ctx.hasRecommendedAcademy,
    hasNearbyRecommendedAcademy: ctx.hasNearbyRecommendedAcademy,
    nearbyRecommendedAcademyName: ctx.nearbyRecommendedAcademyName,
    nearbyRecommendedRegion: ctx.nearbyRecommendedRegion,
    academyImageUrl: ctx.ogImageUrl,
  });

  if (!gemini.ok) return page;

  const updated = {
    ...page,
    regionInfo: gemini.data.regionInfo,
    regionInfoNearby: gemini.data.regionInfoNearby,
    nearbyIntro: gemini.data.nearbyIntro,
    metaDescription: gemini.data.metaDescription,
    metaDescriptionNearby: gemini.data.metaDescriptionNearby,
    seoBlocks: gemini.data.seoBlocks,
    seoBlocksNearby: gemini.data.seoBlocksNearby,
    faqItems: gemini.data.faqItems,
    faqItemsNearby: gemini.data.faqItemsNearby,
    nearbyAreas: page.nearbyAreas ?? nearbyLabels,
    nearbyStations: page.nearbyStations ?? nearbyStations,
  };

  const saved = await upsertRegionalLanding(updated);
  if ("error" in saved) return page;
  return saved.page;
}
