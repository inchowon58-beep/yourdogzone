import { generateUniqueSlug } from "@/lib/slug/unique-id";
import { absoluteUrl } from "@/lib/site/config";
import type { ListingCategory } from "@/lib/types/listing";

/** @deprecated name/region 인자는 더 이상 slug에 사용하지 않습니다. */
export function generateListingSlug(
  category: ListingCategory,
  _name?: string,
  _regionSmall?: string,
  _regionBig?: string
): string {
  return generateUniqueSlug(category);
}

export function listingPageUrl(category: ListingCategory, slug: string): string {
  return absoluteUrl(`/services/${category}/${slug}`);
}
