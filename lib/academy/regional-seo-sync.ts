import "server-only";

import { generateRegionalLandingWithGemini } from "@/lib/ai/regional-landing-gemini";
import { inferRegionBig } from "@/lib/academy/region-metro";
import {
  resolveNearbyAreas,
  resolveNearbyStations,
} from "@/lib/academy/resolve-nearby-areas";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import type { RegionalSeoContext } from "@/lib/academy/regional-seo-vars";
import { upsertRegionalLanding } from "@/lib/academy/regional-store";

export function needsRegionalNearbyGeo(_page: RegionalLandingPage): boolean {
  return false;
}

export function needsRegionalSeoContent(page: RegionalLandingPage): boolean {
  return !page.seoBlocks?.length;
}

/** 근방 구·역 — 상수/라벨만 사용 (Gemini·R2 불필요) */
export async function fillRegionalNearbyGeo(
  page: RegionalLandingPage
): Promise<RegionalLandingPage> {
  return page;
}

/** SEO 본문 Gemini + R2 저장 (관리자·백필 전용) */
export async function fillRegionalSeoContent(
  page: RegionalLandingPage,
  ctx: RegionalSeoContext
): Promise<RegionalLandingPage> {
  if (!needsRegionalSeoContent(page)) return page;

  const nearbyLabels = resolveNearbyAreas(page);
  const nearbyStations = resolveNearbyStations(page);

  const gemini = await generateRegionalLandingWithGemini({
    label: page.label,
    keyword: page.keyword,
    regionBig: page.regionBig ?? inferRegionBig(page.label),
    nearbyLabels,
    nearbyStations,
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
    nearbyIntro: gemini.data.nearbyIntro ?? page.nearbyIntro,
    metaDescription: gemini.data.metaDescription,
    metaDescriptionNearby: gemini.data.metaDescriptionNearby,
    seoBlocks: gemini.data.seoBlocks,
    seoBlocksNearby: gemini.data.seoBlocksNearby,
    faqItems: gemini.data.faqItems,
    faqItemsNearby: gemini.data.faqItemsNearby,
    nearbyAreas: nearbyLabels,
    nearbyStations,
  };

  const saved = await upsertRegionalLanding(updated);
  if ("error" in saved) return page;
  return saved.page;
}
