import "server-only";

import { generateRegionalLandingWithGemini } from "@/lib/ai/regional-landing-gemini";
import { generateRegionalNearbyGeoWithGemini } from "@/lib/ai/regional-nearby-geo-gemini";
import { inferRegionBig } from "@/lib/academy/region-metro";
import { buildRegionalSlug } from "@/lib/academy/regional-slug";
import { getAllRegionalLandings } from "@/lib/academy/regional-store";
import { pageNeedsNearbyGeoFill } from "@/lib/academy/resolve-nearby-areas";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import type { RegionalSeoContext } from "@/lib/academy/regional-seo-vars";
import { upsertRegionalLanding } from "@/lib/academy/regional-store";
import {
  getRegionalServiceConfig,
  resolvePageCategory,
} from "@/lib/seo/regional-service-config";

export function needsRegionalNearbyGeo(page: RegionalLandingPage): boolean {
  return pageNeedsNearbyGeoFill(page);
}

export function needsRegionalSeoContent(page: RegionalLandingPage): boolean {
  return !page.seoBlocks?.length;
}

function buildCategoryNearbyMap(
  allLandings: RegionalLandingPage[],
  category: ReturnType<typeof resolvePageCategory>
): Map<string, RegionalLandingPage> {
  return new Map(
    allLandings
      .filter((p) => resolvePageCategory(p) === category)
      .map((p) => [p.label, p])
  );
}

/** 근방 GEO만 Gemini로 채움 (SEO는 이미 있는 기존 페이지용) */
export async function fillRegionalNearbyGeo(
  page: RegionalLandingPage
): Promise<RegionalLandingPage> {
  if (!needsRegionalNearbyGeo(page)) return page;

  const category = resolvePageCategory(page);
  const geo = await generateRegionalNearbyGeoWithGemini({
    label: page.label,
    keyword: page.keyword,
    regionBig: page.regionBig ?? inferRegionBig(page.label),
  });
  if (!geo.ok) return page;

  const allLandings = await getAllRegionalLandings({ includeUnpublished: true });
  const byLabel = buildCategoryNearbyMap(allLandings, category);
  const nearbySlugs = geo.data.nearbyAreas
    .map((area) => byLabel.get(area)?.slug ?? buildRegionalSlug(area, category))
    .slice(0, 5);

  const updated = {
    ...page,
    nearbyAreas: geo.data.nearbyAreas,
    nearbyStations: geo.data.nearbyStations,
    nearbyIntro: geo.data.nearbyIntro ?? page.nearbyIntro,
    nearbySlugs,
  };

  const saved = await upsertRegionalLanding(updated);
  if ("error" in saved) return page;
  return saved.page;
}

/** SEO 본문 + 근방 GEO Gemini 단일 호출 후 R2 저장 */
export async function fillRegionalSeoContent(
  page: RegionalLandingPage,
  ctx: RegionalSeoContext
): Promise<RegionalLandingPage> {
  if (!needsRegionalSeoContent(page)) return page;

  const category = resolvePageCategory(page);
  const serviceConfig = getRegionalServiceConfig(category);

  const gemini = await generateRegionalLandingWithGemini({
    label: page.label,
    keyword: page.keyword,
    regionBig: page.regionBig ?? inferRegionBig(page.label),
    serviceTitle: serviceConfig.title,
    entityLabel: serviceConfig.entityLabel,
    recommendedAcademyName: ctx.recommendedAcademyName,
    recommendedAcademyHighlight: ctx.recommendedAcademyHighlight,
    hasRecommendedAcademy: ctx.hasRecommendedAcademy,
    hasNearbyRecommendedAcademy: ctx.hasNearbyRecommendedAcademy,
    nearbyRecommendedAcademyName: ctx.nearbyRecommendedAcademyName,
    nearbyRecommendedRegion: ctx.nearbyRecommendedRegion,
    academyImageUrl: ctx.ogImageUrl,
  });

  if (!gemini.ok) return page;

  const allLandings = await getAllRegionalLandings({ includeUnpublished: true });
  const byLabel = buildCategoryNearbyMap(allLandings, category);
  const nearbySlugs = gemini.data.nearbyAreas
    .map((area) => byLabel.get(area)?.slug ?? buildRegionalSlug(area, category))
    .slice(0, 5);

  const updated = {
    ...page,
    regionInfo: gemini.data.regionInfo,
    metaDescription: gemini.data.metaDescription,
    seoBlocks: gemini.data.seoBlocks,
    faqItems: gemini.data.faqItems,
    nearbyAreas: gemini.data.nearbyAreas,
    nearbyStations: gemini.data.nearbyStations,
    nearbySlugs,
  };

  const saved = await upsertRegionalLanding(updated);
  if ("error" in saved) return page;
  return saved.page;
}
