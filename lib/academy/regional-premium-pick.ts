import "server-only";

import { fetchNearbyPremiumWithFallback } from "@/lib/academy/regional-academy-fallback";
import { getAllPremiumAcademies } from "@/lib/academy/premium-pool";
import type { Academy } from "@/lib/types/academy";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";

export type RegionalPremiumPick = {
  local: Academy | null;
  /** 지역 확장 검색 또는 전국 인증추천 풀에서 선택한 SEO·상단용 1곳 */
  seoNearby: Academy | null;
  /** 인근 목록 (상단 그리드용, 최대 limit) */
  nearbyList: Academy[];
  /** 전국 풀 폴백으로 잡았는지 */
  isPoolFallback: boolean;
};

function sortPremiumStable(academies: Academy[]): Academy[] {
  return [...academies].sort((a, b) => a.slug.localeCompare(b.slug));
}

/** SEO A/B·상단 인증추천 — 지역 내 → 인근 검색 → 전국 인증추천 풀 순 */
export async function pickRegionalPremiumForSeo(
  page: RegionalLandingPage,
  localRecommended: Academy | null,
  limit = 3
): Promise<RegionalPremiumPick> {
  if (localRecommended) {
    return {
      local: localRecommended,
      seoNearby: null,
      nearbyList: [],
      isPoolFallback: false,
    };
  }

  const regional = await fetchNearbyPremiumWithFallback(page, limit);
  if (regional.academies.length > 0) {
    const list = sortPremiumStable(regional.academies);
    return {
      local: null,
      seoNearby: list[0],
      nearbyList: list,
      isPoolFallback: false,
    };
  }

  const pool = sortPremiumStable(await getAllPremiumAcademies());
  const seoNearby = pool[0] ?? null;

  return {
    local: null,
    seoNearby,
    nearbyList: seoNearby ? [seoNearby] : [],
    isPoolFallback: Boolean(seoNearby),
  };
}
