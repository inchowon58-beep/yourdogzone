import type { RegionalLandingPage } from "@/lib/types/regional-landing";

export function regionalLandingPath(
  page: Pick<RegionalLandingPage, "slug">
): string {
  return `/services/academy/region/${page.slug}`;
}
