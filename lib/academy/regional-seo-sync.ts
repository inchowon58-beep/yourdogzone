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

/** 근방 구·동·역이 없으면 Gemini로 1회 생성해 R2에 저장 (이후 재사용) */
export async function ensureRegionalNearbyGeo(
  page: RegionalLandingPage
): Promise<RegionalLandingPage> {
  const areas = resolveNearbyAreas(page);
  const stations = resolveNearbyStations(page);
  if (areas.length > 0 && stations.length > 0) return page;

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
      nearbyAreas:
        page.nearbyAreas?.length ? page.nearbyAreas : fallbackAreas,
      nearbyStations:
        page.nearbyStations?.length ? page.nearbyStations : fallbackStations,
    };
    const saved = await upsertRegionalLanding(patched);
    return "error" in saved ? page : saved.page;
  }

  const patched = {
    ...page,
    regionBig: page.regionBig ?? regionBig,
    nearbyAreas:
      areas.length > 0 ? areas : gemini.data.nearbyAreas,
    nearbyStations:
      stations.length > 0 ? stations : gemini.data.nearbyStations,
    nearbyIntro: page.nearbyIntro ?? gemini.data.nearbyIntro,
  };

  const saved = await upsertRegionalLanding(patched);
  return "error" in saved ? page : saved.page;
}

/** 저장된 SEO 본문이 없을 때만 Gemini로 1회 생성 */
export async function ensureRegionalSeoContent(
  page: RegionalLandingPage,
  ctx: RegionalSeoContext
): Promise<RegionalLandingPage> {
  page = await ensureRegionalNearbyGeo(page);

  if (page.seoBlocks?.length) return page;

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
    nearbyAreas:
      page.nearbyAreas?.length
        ? page.nearbyAreas
        : gemini.data.nearbyAreas.length > 0
          ? gemini.data.nearbyAreas
          : nearbyLabels,
    nearbyStations:
      page.nearbyStations?.length
        ? page.nearbyStations
        : gemini.data.nearbyStations.length > 0
          ? gemini.data.nearbyStations
          : nearbyStations,
  };

  const saved = await upsertRegionalLanding(updated);
  if ("error" in saved) return page;
  return saved.page;
}
