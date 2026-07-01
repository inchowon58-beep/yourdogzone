import "server-only";

import { generateRegionalLandingWithGemini } from "@/lib/ai/regional-landing-gemini";
import { generateRegionalNearbyGeoWithGemini } from "@/lib/ai/regional-nearby-geo-gemini";
import { getNearbyDistricts } from "@/lib/constants/region-nearby-districts";
import { getNearbyStations } from "@/lib/constants/region-nearby-stations";
import { inferRegionBig } from "@/lib/academy/region-metro";
import {
  resolveNearbyAreas,
  resolveNearbyStations,
} from "@/lib/academy/resolve-nearby-areas";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import type { RegionalSeoContext } from "@/lib/academy/regional-seo-vars";
import { upsertRegionalLanding } from "@/lib/academy/regional-store";

function staticNearbyAreas(label: string): string[] {
  return getNearbyDistricts(label, 5);
}

function staticNearbyStations(label: string): string[] {
  return getNearbyStations(label, 5);
}

export function needsRegionalNearbyGeo(page: RegionalLandingPage): boolean {
  const areas = resolveNearbyAreas(page);
  const stations = resolveNearbyStations(page);
  return areas.length === 0 || stations.length === 0;
}

export function needsRegionalSeoContent(page: RegionalLandingPage): boolean {
  return !page.seoBlocks?.length;
}

/** Gemini + R2 저장 (관리자 생성·백그라운드 백필 전용 — 페이지 렌더에서 호출하지 않음) */
export async function fillRegionalNearbyGeo(
  page: RegionalLandingPage
): Promise<RegionalLandingPage> {
  if (!needsRegionalNearbyGeo(page)) return page;

  const areas = resolveNearbyAreas(page);
  const stations = resolveNearbyStations(page);
  const regionBig = page.regionBig ?? inferRegionBig(page.label);

  const gemini = await generateRegionalNearbyGeoWithGemini({
    label: page.label,
    keyword: page.keyword,
    regionBig,
  });

  if (!gemini.ok) {
    const fallbackAreas = areas.length > 0 ? areas : staticNearbyAreas(page.label);
    const fallbackStations =
      stations.length > 0 ? stations : staticNearbyStations(page.label);
    if (fallbackAreas.length === 0 && fallbackStations.length === 0) return page;

    const patched = {
      ...page,
      regionBig: page.regionBig ?? regionBig,
      nearbyAreas: page.nearbyAreas?.length ? page.nearbyAreas : fallbackAreas,
      nearbyStations: page.nearbyStations?.length
        ? page.nearbyStations
        : fallbackStations,
    };
    const saved = await upsertRegionalLanding(patched);
    return "error" in saved ? page : saved.page;
  }

  const patched = {
    ...page,
    regionBig: page.regionBig ?? regionBig,
    nearbyAreas: areas.length > 0 ? areas : gemini.data.nearbyAreas,
    nearbyStations: stations.length > 0 ? stations : gemini.data.nearbyStations,
    nearbyIntro: page.nearbyIntro ?? gemini.data.nearbyIntro,
  };

  const saved = await upsertRegionalLanding(patched);
  return "error" in saved ? page : saved.page;
}

/** SEO 본문 Gemini + R2 저장 (관리자·백필 전용) */
export async function fillRegionalSeoContent(
  page: RegionalLandingPage,
  ctx: RegionalSeoContext
): Promise<RegionalLandingPage> {
  page = await fillRegionalNearbyGeo(page);
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
    nearbyAreas: page.nearbyAreas?.length
      ? page.nearbyAreas
      : gemini.data.nearbyAreas.length > 0
        ? gemini.data.nearbyAreas
        : nearbyLabels,
    nearbyStations: page.nearbyStations?.length
      ? page.nearbyStations
      : gemini.data.nearbyStations.length > 0
        ? gemini.data.nearbyStations
        : nearbyStations,
  };

  const saved = await upsertRegionalLanding(updated);
  if ("error" in saved) return page;
  return saved.page;
}
