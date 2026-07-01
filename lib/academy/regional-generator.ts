import "server-only";

import { REGION_BIG_OPTIONS } from "@/lib/constants/regions";
import { getAdjacentLabels } from "@/lib/constants/region-adjacency";
import { generateRegionalLandingWithGemini } from "@/lib/ai/regional-landing-gemini";
import { fetchNearbyPremiumAcademies } from "@/lib/academy/nearby-premium-academies";
import { getAcademies } from "@/lib/academy/queries";
import {
  buildRegionalSlug,
  parseLabelFromKeyword,
} from "@/lib/academy/regional-slug";
import { getAllRegionalLandings } from "@/lib/academy/regional-store";
import {
  buildRegionalSeoContext,
  pickRecommendedAcademy,
} from "@/lib/academy/regional-seo-vars";
import type { RegionalLandingInsert, RegionalLandingPage } from "@/lib/types/regional-landing";

const REGION_BIG_SET = new Set<string>(REGION_BIG_OPTIONS);

function inferRegionBig(label: string): string | undefined {
  if (REGION_BIG_SET.has(label)) return label;
  const metro: Record<string, string> = {
    강남: "서울",
    강북: "서울",
    송파: "서울",
    분당: "경기",
    일산: "경기",
  };
  return metro[label];
}

export type RegionalGenerateResult = RegionalLandingInsert & {
  geminiUsed?: boolean;
  geminiError?: string;
};

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

  const adjacent = getAdjacentLabels(label, 5);
  const nearbySlugs = adjacent
    .map((adj) => byLabel.get(adj)?.slug ?? buildRegionalSlug(adj))
    .slice(0, 5);

  const academies = await getAcademies({
    region: regionBig ?? "전체",
    query,
  });
  const recommended = pickRecommendedAcademy(
    academies.filter((a) => a.is_premium)
  );

  const adjacentPages = adjacent
    .map((adj) => byLabel.get(adj))
    .filter((p): p is RegionalLandingPage => Boolean(p));
  const nearbyPremium =
    recommended === null && adjacentPages.length > 0
      ? await fetchNearbyPremiumAcademies(adjacentPages, 1)
      : [];
  const nearbyRecommended = nearbyPremium[0] ?? null;
  const seoCtx = buildRegionalSeoContext(label, recommended, nearbyRecommended);

  const base: RegionalGenerateResult = {
    slug,
    label,
    keyword: trimmed.includes("애견") ? trimmed : `${label} 애견미용학원`,
    regionBig,
    query,
    nearbySlugs,
    isPublished: true,
    geminiUsed: false,
  };

  const gemini = await generateRegionalLandingWithGemini({
    label,
    keyword: base.keyword,
    regionBig,
    nearbyLabels: adjacent,
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
      nearbyIntro: gemini.data.nearbyIntro,
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
