import "server-only";

import { unstable_cache } from "next/cache";
import type { ListingCategory } from "@/lib/types/listing";
import type { Academy } from "@/lib/types/academy";
import { getCachedAcademyIndex } from "@/lib/academy/academy-index";
import { fetchListingsFromR2 } from "@/lib/listings/r2-read";
import { listingAsAcademy } from "@/lib/listings/queries";
import type { RegionalServiceCategory } from "@/lib/seo/regional-service-config";

function listingCacheTag(category: ListingCategory): string {
  return `listing-index-${category}`;
}

const listingIndexCaches: Partial<
  Record<ListingCategory, () => Promise<Academy[]>>
> = {};

function getCachedListingAsAcademies(
  category: ListingCategory
): () => Promise<Academy[]> {
  if (!listingIndexCaches[category]) {
    listingIndexCaches[category] = unstable_cache(
      async (): Promise<Academy[]> => {
        const listings = await fetchListingsFromR2(category, { noCache: true });
        return listings.map(listingAsAcademy);
      },
      [`listing-regional-index-${category}`],
      { revalidate: 300, tags: [listingCacheTag(category)] }
    );
  }
  return listingIndexCaches[category]!;
}

/** 지역 SEO — 카테고리별 업체 index (Academy 형태로 통일) */
export async function getRegionalEntityIndex(
  category: RegionalServiceCategory
): Promise<Academy[]> {
  if (category === "academy") {
    return getCachedAcademyIndex();
  }
  return getCachedListingAsAcademies(category)();
}
