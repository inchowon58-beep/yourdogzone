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

function resolveNearbyGeoForDraft(label: string): {
  nearbyAreas: string[];
  nearbyStations: string[];
} {
  const staticAreas = getNearbyDistricts(label, 5);
  const staticStations = getNearbyStations(label, 5);
  const trimmed = label.trim();
  return {
    nearbyAreas: staticAreas.length > 0 ? staticAreas : [trimmed],
    nearbyStations:
      staticStations.length > 0
        ? staticStations
        : trimmed.endsWith("역")
          ? [trimmed]
          : [`${trimmed}역`],
  };
}

/** 키워드 한 줄로 지역 랜딩 페이지 생성 (인증추천학원 변수 반영 Gemini SEO) */
export async function generateRegionalLandingFromKeyword(
  keyword: string
): Promise<RegionalGenerateResult> {
  const trimmed = keyword.trim();
  const label = parseLabelFromKeyword(trimmed);
  if (!label) throw new Error("키워드에서 지역명을 추출할 수 없습니다.");

  const slug = buildRegionalSlug(label);
  const regionBig = inferRegionBig(label);
  const query = REGION_BIG_SET.has(label) ? label : label;

  const allLandings = await getAllRegionalLandings({ includeUnpublished: true });
  const byLabel = new Map(allLandings.map((p) => [p.label, p]));

  const geo = resolveNearbyGeoForDraft(label);
  const { nearbyAreas, nearbyStations } = geo;

  const nearbySlugs = nearbyAreas
    .map((area) => byLabel.get(area)?.slug ?? buildRegionalSlug(area))
    .slice(0, 5);

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
    keyword: trimmed.includes("애견") ? trimmed : `${label} 애견미용학원`,
    regionBig,
    query,
    nearbySlugs,
    nearbyAreas,
    nearbyStations,
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

  const base: RegionalGenerateResult = {
    slug,
    label,
    keyword: trimmed.includes("애견") ? trimmed : `${label} 애견미용학원`,
    regionBig,
    query,
    nearbySlugs,
    nearbyAreas,
    nearbyStations,
    isPublished: true,
    geminiUsed: false,
  };

  const gemini = await generateRegionalLandingWithGemini({
    label,
    keyword: base.keyword,
    regionBig,
    nearbyLabels: nearbyAreas,
    nearbyStations,
    recommendedAcademyName: seoCtx.recommendedAcademyName,
    recommendedAcademyHighlight: seoCtx.recommendedAcademyHighlight,
    hasRecommendedAcademy: seoCtx.hasRecommendedAcademy,
    hasNearbyRecommendedAcademy: seoCtx.hasNearbyRecommendedAcademy,
    nearbyRecommendedAcademyName: seoCtx.nearbyRecommendedAcademyName,
    nearbyRecommendedRegion: seoCtx.nearbyRecommendedRegion,
    academyImageUrl: seoCtx.ogImageUrl,
  });

  if (gemini.ok) {
    return {
      ...base,
      regionInfo: gemini.data.regionInfo,
      metaDescription: gemini.data.metaDescription,
      seoBlocks: gemini.data.seoBlocks,
      faqItems: gemini.data.faqItems,
      geminiUsed: true,
    };
  }

  return {
    ...base,
    geminiError: gemini.error,
  };
}
