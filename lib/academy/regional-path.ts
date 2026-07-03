import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import {
  getRegionalServiceConfig,
  resolvePageCategory,
  type RegionalServiceCategory,
} from "@/lib/seo/regional-service-config";

export function regionalLandingPath(
  page: Pick<RegionalLandingPage, "slug" | "category">
): string {
  const category = resolvePageCategory(page);
  const base = getRegionalServiceConfig(category).basePath;
  return `${base}/region/${page.slug}`;
}

export function regionalLandingPathForCategory(
  category: RegionalServiceCategory,
  slug: string
): string {
  const base = getRegionalServiceConfig(category).basePath;
  return `${base}/region/${slug}`;
}
