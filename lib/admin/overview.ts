import "server-only";

import {
  filterPremiumAcademies,
  getCachedAcademyIndex,
} from "@/lib/academy/academy-index";
import { getAllRegionalLandings } from "@/lib/academy/regional-store";
import { getSeedBreeds } from "@/lib/breeds/data";
import { fetchBreedsIndexFromR2 } from "@/lib/breeds/r2-read";
import { LISTING_CATEGORIES } from "@/lib/listings/config";
import { fetchListingsFromR2 } from "@/lib/listings/r2-read";
import type { AdminOverviewStats } from "@/lib/admin/service-links";

export type { AdminOverviewStats } from "@/lib/admin/service-links";

/** 관리자 대시보드 — index.json만 조회 (N+1 없음) */
export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const [academyIndex, regional, breedsRemote, ...listingIndexes] =
    await Promise.all([
      getCachedAcademyIndex(),
      getAllRegionalLandings({ includeUnpublished: true, fresh: true }),
      fetchBreedsIndexFromR2(),
      ...LISTING_CATEGORIES.map((cat) => fetchListingsFromR2(cat)),
    ]);

  const listings: AdminOverviewStats["listings"] = {};
  LISTING_CATEGORIES.forEach((cat, i) => {
    const items = listingIndexes[i] ?? [];
    listings[cat] = {
      total: items.length,
      premium: items.filter((item) => item.is_premium).length,
    };
  });

  const breedSlugs = new Set([
    ...getSeedBreeds().map((b) => b.slug),
    ...breedsRemote.map((b) => b.slug),
  ]);

  return {
    academy: {
      total: academyIndex.length,
      premium: filterPremiumAcademies(academyIndex).length,
    },
    regionalPages: {
      total: regional.length,
      published: regional.filter((p) => p.isPublished).length,
    },
    listings,
    breeds: breedSlugs.size,
  };
}
