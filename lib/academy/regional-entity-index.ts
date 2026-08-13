import "server-only";

import type { ListingCategory } from "@/lib/types/listing";
import type { Academy } from "@/lib/types/academy";
import { getCachedAcademyIndex } from "@/lib/academy/academy-index";
import { fetchListingsFromR2 } from "@/lib/listings/r2-read";
import { listingAsAcademy } from "@/lib/listings/queries";
import type { RegionalServiceCategory } from "@/lib/seo/regional-service-config";
import {
  readTtlMemoryCache,
  writeTtlMemoryCache,
  type TtlMemoryCache,
} from "@/lib/cache/ttl-memory-cache";

const LISTING_INDEX_TTL_MS = 300_000;

const listingIndexMemory: Partial<
  Record<ListingCategory, TtlMemoryCache<Academy[]>>
> = {};

export function invalidateListingRegionalIndexMemoryCache(
  category?: ListingCategory
) {
  if (category) {
    delete listingIndexMemory[category];
    return;
  }
  for (const key of Object.keys(listingIndexMemory) as ListingCategory[]) {
    delete listingIndexMemory[key];
  }
}

async function loadListingAsAcademies(
  category: ListingCategory
): Promise<Academy[]> {
  const hit = readTtlMemoryCache(listingIndexMemory[category]);
  if (hit) return hit;
  const listings = await fetchListingsFromR2(category, { noCache: true });
  const mapped = listings.map(listingAsAcademy);
  listingIndexMemory[category] = writeTtlMemoryCache(
    mapped,
    LISTING_INDEX_TTL_MS
  );
  return mapped;
}

/** 지역 SEO — 카테고리별 업체 index (Academy 형태로 통일) */
export async function getRegionalEntityIndex(
  category: RegionalServiceCategory
): Promise<Academy[]> {
  if (category === "academy") {
    return getCachedAcademyIndex();
  }
  return loadListingAsAcademies(category);
}
