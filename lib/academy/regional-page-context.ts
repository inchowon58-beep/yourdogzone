import "server-only";

import {
  filterAcademies,
  filterPremiumAcademies,
  getCachedAcademyIndex,
} from "@/lib/academy/academy-index";
import { fetchRegionalAcademiesWithFallback } from "@/lib/academy/regional-academy-fallback";
import { inferRegionBig } from "@/lib/academy/region-metro";
import { pickRegionalPremiumForSeo } from "@/lib/academy/regional-premium-pick";
import type { Academy } from "@/lib/types/academy";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import {
  buildRegionalSeoContext,
  pickRecommendedAcademy,
  type RegionalSeoContext,
} from "@/lib/academy/regional-seo-vars";

export type RegionalPageContext = {
  all: Academy[];
  premium: Academy[];
  regular: Academy[];
  recommended: Academy | null;
  seoNearby: Academy | null;
  nearbyPremium: Academy[];
  isPoolPremiumFallback: boolean;
  seoCtx: RegionalSeoContext;
  isNearbyFallback: boolean;
  nearbySourceLabel?: string;
};

/** 지역 랜딩 — index 1회 로드 후 메모리 필터 */
export async function loadRegionalPageContext(
  page: RegionalLandingPage
): Promise<RegionalPageContext> {
  const allAcademies = await getCachedAcademyIndex();
  const regionBig = page.regionBig ?? inferRegionBig(page.label);
  const searchQuery = page.query ?? page.label;
  const pageWithMetro =
    !page.regionBig && regionBig ? { ...page, regionBig } : page;

  const local = filterAcademies(allAcademies, {
    region: regionBig ?? "전체",
    query: searchQuery,
  });

  const localPremium = local
    .filter((a) => a.is_premium)
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const localRecommended = pickRecommendedAcademy(localPremium);

  const listFallback =
    local.length > 0
      ? {
          academies: local,
          isNearbyFallback: false,
          sourceLabel: undefined as string | undefined,
        }
      : fetchRegionalAcademiesWithFallback(pageWithMetro, allAcademies);

  const all = listFallback.academies;

  const premiumPick = pickRegionalPremiumForSeo(
    pageWithMetro,
    localRecommended,
    allAcademies
  );

  const seoNearby = premiumPick.seoNearby;
  const seoCtx = buildRegionalSeoContext(
    page.label,
    localRecommended,
    seoNearby
  );

  return {
    all,
    premium: localPremium,
    regular: all.filter((a) => !a.is_premium),
    recommended: localRecommended,
    seoNearby,
    nearbyPremium: premiumPick.nearbyList,
    isPoolPremiumFallback: premiumPick.isPoolFallback,
    seoCtx,
    isNearbyFallback: listFallback.isNearbyFallback,
    nearbySourceLabel: listFallback.sourceLabel,
  };
}
