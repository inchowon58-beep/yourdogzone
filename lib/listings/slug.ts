import { generateAcademySlug } from "@/lib/academy/slug";
import { absoluteUrl } from "@/lib/site/config";
import type { ListingCategory } from "@/lib/types/listing";

export function generateListingSlug(
  name: string,
  regionSmall: string,
  regionBig: string
): string {
  return generateAcademySlug(name, regionSmall, regionBig);
}

export function listingPageUrl(category: ListingCategory, slug: string): string {
  return absoluteUrl(`/services/${category}/${slug}`);
}
