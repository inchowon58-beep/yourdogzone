import "server-only";

import { filterPremiumAcademies } from "@/lib/academy/academy-index";
import { fetchNearbyPremiumWithFallback } from "@/lib/academy/regional-academy-fallback";
import type { Academy } from "@/lib/types/academy";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";

export type RegionalPremiumPick = {
  local: Academy | null;
  seoNearby: Academy | null;
  nearbyList: Academy[];
  isPoolFallback: boolean;
};

function sortPremiumStable(academies: Academy[]): Academy[] {
  return [...academies].sort((a, b) => a.slug.localeCompare(b.slug));
}

/** SEO A/B·상단 인증추천 — 지역 내 → 인근 검색 → 전국 인증추천 풀 순 */
export function pickRegionalPremiumForSeo(
  page: RegionalLandingPage,
  localRecommended: Academy | null,
  allAcademies: Academy[],
  limit = 3
): RegionalPremiumPick {
  if (localRecommended) {
    return {
      local: localRecommended,
      seoNearby: null,
      nearbyList: [],
      isPoolFallback: false,
    };
  }

  const regional = fetchNearbyPremiumWithFallback(page, allAcademies, limit);
  if (regional.academies.length > 0) {
    const list = sortPremiumStable(regional.academies);
    return {
      local: null,
      seoNearby: list[0],
      nearbyList: list,
      isPoolFallback: false,
    };
  }

  const pool = sortPremiumStable(filterPremiumAcademies(allAcademies));
  const seoNearby = pool[0] ?? null;

  return {
    local: null,
    seoNearby,
    nearbyList: seoNearby ? [seoNearby] : [],
    isPoolFallback: Boolean(seoNearby),
  };
}
