import "server-only";

import { getAllRegionalLandings } from "@/lib/academy/regional-store";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";

export type RegionalLandingAdminSummary = {
  slug: string;
  label: string;
  keyword: string;
  nearbyCount: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  hasSeo: boolean;
};

export type RegionalLandingAdminListResult = {
  pages: RegionalLandingAdminSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function toSummary(page: RegionalLandingPage): RegionalLandingAdminSummary {
  return {
    slug: page.slug,
    label: page.label,
    keyword: page.keyword,
    nearbyCount: page.nearbySlugs?.length ?? 0,
    isPublished: page.isPublished,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    hasSeo: Boolean(page.seoBlocks?.length),
  };
}

function sortNewestFirst(pages: RegionalLandingPage[]): RegionalLandingPage[] {
  return [...pages].sort((a, b) => {
    const aTime = Date.parse(a.createdAt || a.updatedAt) || 0;
    const bTime = Date.parse(b.createdAt || b.updatedAt) || 0;
    return bTime - aTime;
  });
}

export async function listRegionalLandingsForAdmin(options?: {
  page?: number;
  limit?: number;
}): Promise<RegionalLandingAdminListResult> {
  const limit = Math.min(Math.max(options?.limit ?? 10, 1), 50);
  const page = Math.max(options?.page ?? 1, 1);

  const all = sortNewestFirst(
    await getAllRegionalLandings({ includeUnpublished: true })
  );
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;

  return {
    pages: all.slice(start, start + limit).map(toSummary),
    total,
    page: safePage,
    limit,
    totalPages,
  };
}

export async function getRegionalLandingForAdmin(
  slug: string
): Promise<RegionalLandingPage | null> {
  const all = await getAllRegionalLandings({ includeUnpublished: true });
  return all.find((p) => p.slug === slug) ?? null;
}
