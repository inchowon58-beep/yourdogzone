import "server-only";

import { getAllRegionalLandings } from "@/lib/academy/regional-store";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import {
  getRegionalServiceConfig,
  resolvePageCategory,
  type RegionalServiceCategory,
} from "@/lib/seo/regional-service-config";
import { regionalLandingPath } from "@/lib/academy/regional-path";

export type RegionalLandingAdminSummary = {
  slug: string;
  category: RegionalServiceCategory;
  categoryTitle: string;
  label: string;
  keyword: string;
  path: string;
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
  const category = resolvePageCategory(page);
  return {
    slug: page.slug,
    category,
    categoryTitle: getRegionalServiceConfig(category).title,
    label: page.label,
    keyword: page.keyword,
    path: regionalLandingPath(page),
    nearbyCount: page.nearbySlugs?.length ?? 0,
    isPublished: page.isPublished,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    hasSeo: Boolean(page.seoBlocks?.length),
  };
}

/** 재발행(업데이트)도 최근 작업으로 보이도록 createdAt·updatedAt 중 최신 기준 */
function sortNewestFirst(pages: RegionalLandingPage[]): RegionalLandingPage[] {
  const recency = (p: RegionalLandingPage) =>
    Math.max(Date.parse(p.updatedAt) || 0, Date.parse(p.createdAt) || 0);
  return [...pages].sort((a, b) => recency(b) - recency(a));
}

export async function listRegionalLandingsForAdmin(options?: {
  page?: number;
  limit?: number;
  category?: RegionalServiceCategory;
}): Promise<RegionalLandingAdminListResult> {
  const limit = Math.min(Math.max(options?.limit ?? 10, 1), 50);
  const page = Math.max(options?.page ?? 1, 1);

  let all = sortNewestFirst(
    await getAllRegionalLandings({ includeUnpublished: true, fresh: true })
  );

  if (options?.category) {
    all = all.filter((p) => resolvePageCategory(p) === options.category);
  }

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
  slug: string,
  category?: RegionalServiceCategory
): Promise<RegionalLandingPage | null> {
  const all = await getAllRegionalLandings({
    includeUnpublished: true,
    fresh: true,
  });
  return (
    all.find((p) => {
      if (p.slug !== slug) return false;
      if (category && resolvePageCategory(p) !== category) return false;
      return true;
    }) ?? null
  );
}
