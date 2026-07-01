import "server-only";

import { getAcademies } from "@/lib/academy/queries";
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
  /** 해당 지역(키워드) 내 인증추천 */
  recommended: Academy | null;
  /** SEO·상단용 인근(또는 풀) 인증추천 1곳 */
  seoNearby: Academy | null;
  nearbyPremium: Academy[];
  isPoolPremiumFallback: boolean;
  seoCtx: RegionalSeoContext;
  isNearbyFallback: boolean;
  nearbySourceLabel?: string;
};

/** 지역 랜딩 페이지 로드 시 인증추천학원을 최우선 조회 */
export async function loadRegionalPageContext(
  page: RegionalLandingPage
): Promise<RegionalPageContext> {
  const regionBig = page.regionBig ?? inferRegionBig(page.label);
  const searchQuery = page.query ?? page.label;
  const pageWithMetro =
    !page.regionBig && regionBig ? { ...page, regionBig } : page;

  const local = await getAcademies({
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
      : await fetchRegionalAcademiesWithFallback(pageWithMetro);

  const all = listFallback.academies;

  const premiumPick = await pickRegionalPremiumForSeo(
    pageWithMetro,
    localRecommended
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
