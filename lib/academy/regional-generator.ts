import "server-only";

import { REGION_BIG_OPTIONS } from "@/lib/constants/regions";
import { getNearbyDistricts } from "@/lib/constants/region-nearby-districts";
import { getNearbyStations } from "@/lib/constants/region-nearby-stations";
import { generateRegionalLandingWithGemini } from "@/lib/ai/regional-landing-gemini";
import { filterAcademies, getCachedAcademyIndex } from "@/lib/academy/academy-index";
import { inferRegionBig } from "@/lib/academy/region-metro";
import {
  buildRegionalSlug,
  parseLabelFromKeyword,
} from "@/lib/academy/regional-slug";
import { getAllRegionalLandings } from "@/lib/academy/regional-store";
import { pickRegionalPremiumForSeo } from "@/lib/academy/regional-premium-pick";
import {
  buildRegionalSeoContext,
  pickRecommendedAcademy,
} from "@/lib/academy/regional-seo-vars";
import type { RegionalLandingInsert, RegionalLandingPage } from "@/lib/types/regional-landing";

const REGION_BIG_SET = new Set<string>(REGION_BIG_OPTIONS);

export type RegionalGenerateResult = RegionalLandingInsert & {
  geminiUsed?: boolean;
  geminiError?: string;
};

function resolveNearbyGeoFallback(label: string): {
  nearbyAreas: string[];
  nearbyStations: string[];
} {
  return {
    nearbyAreas: getNearbyDistricts(label, 5),
    nearbyStations: getNearbyStations(label, 5),
  };
}

function buildNearbySlugs(
  areas: string[],
  byLabel: Map<string, RegionalLandingPage>
): string[] {
  return areas
    .map((area) => byLabel.get(area)?.slug ?? buildRegionalSlug(area))
    .slice(0, 5);
}

/** 키워드 한 줄로 지역 랜딩 페이지 생성 (Gemini SEO + 근방 GEO 단일 호출) */
export async function generateRegionalLandingFromKeyword(
  keyword: string
): Promise<RegionalGenerateResult> {
  const trimmed = keyword.trim();
  const label = parseLabelFromKeyword(trimmed);
  if (!label) throw new Error("키워드에서 지역명을 추출할 수 없습니다.");

  const slug = buildRegionalSlug(label);
  const regionBig = inferRegionBig(label);
  const query = REGION_BIG_SET.has(label) ? label : label;
  const pageKeyword = trimmed.includes("애견") ? trimmed : `${label} 애견미용학원`;

  const allLandings = await getAllRegionalLandings({ includeUnpublished: true });
  const byLabel = new Map(allLandings.map((p) => [p.label, p]));

  const allAcademies = await getCachedAcademyIndex();
  const academies = filterAcademies(allAcademies, {
    region: regionBig ?? "전체",
    query,
  });
  const recommended = pickRecommendedAcademy(
    academies.filter((a) => a.is_premium)
  );

  const draftPage: RegionalLandingPage = {
    slug,
    label,
    keyword: pageKeyword,
    regionBig,
    query,
    nearbySlugs: [],
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const premiumPick = pickRegionalPremiumForSeo(
    draftPage,
    recommended,
    allAcademies
  );
  const seoCtx = buildRegionalSeoContext(
    label,
    recommended,
    premiumPick.seoNearby
  );

  const gemini = await generateRegionalLandingWithGemini({
    label,
    keyword: pageKeyword,
    regionBig,
    recommendedAcademyName: seoCtx.recommendedAcademyName,
    recommendedAcademyHighlight: seoCtx.recommendedAcademyHighlight,
    hasRecommendedAcademy: seoCtx.hasRecommendedAcademy,
    hasNearbyRecommendedAcademy: seoCtx.hasNearbyRecommendedAcademy,
    nearbyRecommendedAcademyName: seoCtx.nearbyRecommendedAcademyName,
    nearbyRecommendedRegion: seoCtx.nearbyRecommendedRegion,
    academyImageUrl: seoCtx.ogImageUrl,
  });

  const fallbackGeo = resolveNearbyGeoFallback(label);

  if (gemini.ok) {
    const { nearbyAreas, nearbyStations } = gemini.data;
    return {
      slug,
      label,
      keyword: pageKeyword,
      regionBig,
      query,
      nearbySlugs: buildNearbySlugs(nearbyAreas, byLabel),
      nearbyAreas,
      nearbyStations,
      regionInfo: gemini.data.regionInfo,
      metaDescription: gemini.data.metaDescription,
      seoBlocks: gemini.data.seoBlocks,
      faqItems: gemini.data.faqItems,
      isPublished: true,
      geminiUsed: true,
    };
  }

  const { nearbyAreas, nearbyStations } = fallbackGeo;
  return {
    slug,
    label,
    keyword: pageKeyword,
    regionBig,
    query,
    nearbySlugs: buildNearbySlugs(nearbyAreas, byLabel),
    nearbyAreas,
    nearbyStations,
    isPublished: true,
    geminiUsed: false,
    geminiError: gemini.error,
  };
}
