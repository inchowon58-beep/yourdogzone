import "server-only";

import { REGION_BIG_OPTIONS } from "@/lib/constants/regions";
import { getNearbyDistricts } from "@/lib/constants/region-nearby-districts";
import { getNearbyStations } from "@/lib/constants/region-nearby-stations";
import { generateRegionalLandingWithGemini } from "@/lib/ai/regional-landing-gemini";
import { generateRegionalNearbyGeoWithGemini } from "@/lib/ai/regional-nearby-geo-gemini";
import { filterAcademies } from "@/lib/academy/academy-index";
import { getRegionalEntityIndex } from "@/lib/academy/regional-entity-index";
import { inferRegionBig } from "@/lib/academy/region-metro";
import {
  buildRegionalSlug,
  buildUniqueRegionalSlug,
  isRegionalSlugVariant,
  parseLabelFromKeyword,
} from "@/lib/academy/regional-slug";
import { getAllRegionalLandings } from "@/lib/academy/regional-store";
import { pickRegionalPremiumForSeo } from "@/lib/academy/regional-premium-pick";
import {
  buildRegionalSeoContext,
  pickRecommendedAcademy,
} from "@/lib/academy/regional-seo-vars";
import type { RegionalLandingInsert, RegionalLandingPage } from "@/lib/types/regional-landing";
import {
  getRegionalServiceConfig,
  normalizeRegionalKeyword,
  resolvePageCategory,
  type RegionalServiceCategory,
} from "@/lib/seo/regional-service-config";

const REGION_BIG_SET = new Set<string>(REGION_BIG_OPTIONS);

export type RegionalGenerateResult = RegionalLandingInsert & {
  geminiUsed?: boolean;
  geminiError?: string;
  /** 기존 페이지가 있어 대체 slug(-2 등)로 생성됨 */
  isSlugVariant?: boolean;
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
  category: RegionalServiceCategory,
  byLabel: Map<string, RegionalLandingPage>
): string[] {
  return areas
    .map((area) => byLabel.get(area)?.slug ?? buildRegionalSlug(area, category))
    .slice(0, 5);
}
/** 키워드·카테고리로 지역 랜딩 페이지 생성 (Gemini SEO + 근방 GEO 단일 호출) */
export async function generateRegionalLandingFromKeyword(
  keyword: string,
  category: RegionalServiceCategory = "academy"
): Promise<RegionalGenerateResult> {
  const trimmed = keyword.trim();
  const serviceConfig = getRegionalServiceConfig(category);
  const label = parseLabelFromKeyword(trimmed, category);
  if (!label) throw new Error("키워드에서 지역명을 추출할 수 없습니다.");

  const regionBig = inferRegionBig(label);
  const query = REGION_BIG_SET.has(label) ? label : label;
  const pageKeyword = normalizeRegionalKeyword(trimmed, label, category);

  const allLandings = await getAllRegionalLandings({ includeUnpublished: true });
  const categoryLandings = allLandings.filter(
    (p) => resolvePageCategory(p) === category
  );
  const slug = buildUniqueRegionalSlug(
    label,
    category,
    categoryLandings.map((p) => p.slug)
  );
  const isSlugVariant = isRegionalSlugVariant(slug, label, category);
  const byLabel = new Map(categoryLandings.map((p) => [p.label, p]));

  const allEntities = await getRegionalEntityIndex(category);
  const entities = filterAcademies(allEntities, {
    region: regionBig ?? "전체",
    query,
  });
  const recommended = pickRecommendedAcademy(
    entities.filter((a) => a.is_premium)
  );

  const draftPage: RegionalLandingPage = {
    category,
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
    allEntities
  );
  const seoCtx = buildRegionalSeoContext(
    label,
    recommended,
    premiumPick.seoNearby,
    serviceConfig
  );

  const gemini = await generateRegionalLandingWithGemini({
    label,
    keyword: pageKeyword,
    regionBig,
    serviceTitle: serviceConfig.title,
    entityLabel: serviceConfig.entityLabel,
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
      category,
      slug,
      label,
      keyword: pageKeyword,
      regionBig,
      query,
      nearbySlugs: buildNearbySlugs(nearbyAreas, category, byLabel),
      nearbyAreas,
      nearbyStations,
      regionInfo: gemini.data.regionInfo,
      metaDescription: gemini.data.metaDescription,
      seoBlocks: gemini.data.seoBlocks,
      faqItems: gemini.data.faqItems,
      /** 웹 관리자 발행은 기존 레이아웃 유지 */
      layoutVersion: "v1",
      isPublished: true,
      geminiUsed: true,
      isSlugVariant,
    };
  }

  let { nearbyAreas, nearbyStations } = fallbackGeo;
  const geoOnly = await generateRegionalNearbyGeoWithGemini({
    label,
    keyword: pageKeyword,
    regionBig,
  });
  if (geoOnly.ok) {
    nearbyAreas = geoOnly.data.nearbyAreas;
    nearbyStations = geoOnly.data.nearbyStations;
  }

  return {
    category,
    slug,
    label,
    keyword: pageKeyword,
    regionBig,
    query,
    nearbySlugs: buildNearbySlugs(nearbyAreas, category, byLabel),
    nearbyAreas,
    nearbyStations,
    layoutVersion: "v1",
    isPublished: true,
    geminiUsed: false,
    geminiError: gemini.error,
    isSlugVariant,
  };
}
