import "server-only";

import {
  filterAcademies,
  filterPremiumAcademies,
  getCachedAcademyIndex,
} from "@/lib/academy/academy-index";
import type { Academy } from "@/lib/types/academy";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";

/** 인근 지역 페이지 기준 인증 추천 학원 (메모리 필터) */
export async function fetchNearbyPremiumAcademies(
  nearbyPages: RegionalLandingPage[],
  limit = 3
): Promise<Academy[]> {
  const allAcademies = await getCachedAcademyIndex();
  const seen = new Set<string>();
  const result: Academy[] = [];

  for (const nearby of nearbyPages) {
    if (result.length >= limit) break;

    const items = filterAcademies(allAcademies, {
      region: nearby.regionBig ?? "전체",
      query: nearby.query ?? nearby.label,
    });

    for (const academy of items) {
      if (!academy.is_premium || seen.has(academy.slug)) continue;
      seen.add(academy.slug);
      result.push(academy);
      if (result.length >= limit) break;
    }
  }

  if (result.length < limit) {
    const allPremium = filterPremiumAcademies(allAcademies);
    const nearbyLabels = new Set(nearbyPages.map((p) => p.label));

    for (const academy of allPremium) {
      if (result.length >= limit || seen.has(academy.slug)) continue;
      const inNearby =
        nearbyLabels.has(academy.region_small) ||
        nearbyPages.some(
          (p) =>
            academy.address.includes(p.label) ||
            academy.region_small.includes(p.label)
        );
      if (!inNearby) continue;
      seen.add(academy.slug);
      result.push(academy);
    }
  }

  return result
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .slice(0, limit);
}
