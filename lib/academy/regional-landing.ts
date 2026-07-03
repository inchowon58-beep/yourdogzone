import "server-only";

import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import type { RegionalServiceCategory } from "@/lib/seo/regional-service-config";
import { getRegionalLandingBySlug } from "@/lib/academy/regional-store";

export type { RegionalLandingPage } from "@/lib/types/regional-landing";

export {
  getAllRegionalLandings,
  getRegionalLandingBySlug,
  getPublishedRegionalSlugs,
  resolveNearbyPages,
  upsertRegionalLanding,
  deleteRegionalLanding,
} from "@/lib/academy/regional-store";

export { generateRegionalLandingFromKeyword } from "@/lib/academy/regional-generator";

export async function resolveRegionalLanding(
  slug: string,
  category?: RegionalServiceCategory
): Promise<RegionalLandingPage | null> {
  return getRegionalLandingBySlug(slug, { category });
}
