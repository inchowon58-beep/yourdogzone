import "server-only";

import { filterAcademies } from "@/lib/academy/academy-index";
import { fetchRegionalAcademiesWithFallback } from "@/lib/academy/regional-academy-fallback";
import { getRegionalEntityIndex } from "@/lib/academy/regional-entity-index";
import { inferRegionBig } from "@/lib/academy/region-metro";
import { pickRegionalPremiumForSeo } from "@/lib/academy/regional-premium-pick";
import type { Academy } from "@/lib/types/academy";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import {
  buildRegionalSeoContext,
  pickRecommendedAcademy,
  type RegionalSeoContext,
} from "@/lib/academy/regional-seo-vars";
import {
  getRegionalServiceConfig,
  resolvePageCategory,
  type RegionalServiceCategory,
} from "@/lib/seo/regional-service-config";
import { isListingCategory } from "@/lib/listings/config";
import { fetchListingFromR2 } from "@/lib/listings/r2-read";
import { listingAsAcademy } from "@/lib/listings/queries";

async function hydrateListingAcademy(
  category: RegionalServiceCategory,
  academy: Academy | null
): Promise<Academy | null> {
  if (!academy || !isListingCategory(category)) return academy;
  const latest = await fetchListingFromR2(category, academy.slug, {
    noCache: true,
  });
  return latest ? listingAsAcademy(latest) : academy;
}

async function hydrateListingAcademies(
  category: RegionalServiceCategory,
  academies: Academy[]
): Promise<Academy[]> {
  if (academies.length === 0 || !isListingCategory(category)) return academies;
  return Promise.all(
    academies.map((item) =>
      hydrateListingAcademy(category, item).then((next) => next ?? item)
    )
  );
}

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

/** 지역 랜딩 — 카테고리별 index 1회 로드 후 메모리 필터 */
export async function loadRegionalPageContext(
  page: RegionalLandingPage
): Promise<RegionalPageContext> {
  const category = resolvePageCategory(page);
  const serviceConfig = getRegionalServiceConfig(category);
  const allEntities = await getRegionalEntityIndex(category);
  const regionBig = page.regionBig ?? inferRegionBig(page.label);
  const searchQuery = page.query ?? page.label;
  const pageWithMetro =
    !page.regionBig && regionBig ? { ...page, regionBig } : page;

  const local = filterAcademies(allEntities, {
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
      : fetchRegionalAcademiesWithFallback(pageWithMetro, allEntities);

  const all = listFallback.academies;

  const premiumPick = pickRegionalPremiumForSeo(
    pageWithMetro,
    localRecommended,
    allEntities
  );

  const [recommended, nearbyPremium] = await Promise.all([
    hydrateListingAcademy(category, localRecommended),
    hydrateListingAcademies(category, premiumPick.nearbyList),
  ]);
  const seoNearby =
    (await hydrateListingAcademy(category, premiumPick.seoNearby)) ??
    nearbyPremium[0] ??
    null;
  const seoCtx = buildRegionalSeoContext(
    page.label,
    recommended,
    seoNearby,
    serviceConfig
  );

  return {
    all,
    premium: localPremium,
    regular: all.filter((a) => !a.is_premium),
    recommended,
    seoNearby,
    nearbyPremium,
    isPoolPremiumFallback: premiumPick.isPoolFallback,
    seoCtx,
    isNearbyFallback: listFallback.isNearbyFallback,
    nearbySourceLabel: listFallback.sourceLabel,
  };
}
