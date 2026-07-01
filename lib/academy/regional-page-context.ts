import "server-only";

import { getAcademies } from "@/lib/academy/queries";
import { fetchNearbyPremiumAcademies } from "@/lib/academy/nearby-premium-academies";
import { resolveNearbyPages } from "@/lib/academy/regional-store";
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
  nearbyPremium: Academy[];
  seoCtx: RegionalSeoContext;
};

/** 지역 랜딩 페이지 로드 시 인증추천학원을 최우선 조회 */
export async function loadRegionalPageContext(
  page: RegionalLandingPage
): Promise<RegionalPageContext> {
  const searchQuery = page.query ?? page.label;
  const regionFilter = page.regionBig ?? "전체";

  const all = await getAcademies({
    region: regionFilter,
    query: searchQuery,
  });

  const premium = all
    .filter((a) => a.is_premium)
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const recommended = pickRecommendedAcademy(premium);

  const nearbyPages = await resolveNearbyPages(page);
  const nearbyPremium =
    recommended === null
      ? await fetchNearbyPremiumAcademies(nearbyPages, 3)
      : [];

  const nearbyRecommended = nearbyPremium[0] ?? null;
  const seoCtx = buildRegionalSeoContext(
    page.label,
    recommended,
    nearbyRecommended
  );

  return {
    all,
    premium,
    regular: all.filter((a) => !a.is_premium),
    recommended,
    nearbyPremium,
    seoCtx,
  };
}
