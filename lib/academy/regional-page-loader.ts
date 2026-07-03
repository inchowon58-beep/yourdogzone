import "server-only";

import { cache } from "react";
import { getRegionalEntityIndex } from "@/lib/academy/regional-entity-index";
import { loadRegionalPageContext } from "@/lib/academy/regional-page-context";
import type { RegionalPageContext } from "@/lib/academy/regional-page-context";
import { resolveRegionalLanding } from "@/lib/academy/regional-landing";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import type { RegionalServiceCategory } from "@/lib/seo/regional-service-config";

export type RegionalPageBundle = {
  page: RegionalLandingPage;
  pageCtx: RegionalPageContext;
};

/** 동일 요청 내 metadata·page 중복 조회 방지 + 업체 index 선로드 */
export const loadRegionalPageBundle = cache(
  async (
    slug: string,
    category?: RegionalServiceCategory
  ): Promise<RegionalPageBundle | null> => {
    const decoded = decodeURIComponent(slug).trim();
    const [page] = await Promise.all([
      resolveRegionalLanding(decoded, category),
      category ? getRegionalEntityIndex(category) : Promise.resolve(null),
    ]);
    if (!page) return null;

    const pageCategory = page.category ?? "academy";
    if (!category) {
      await getRegionalEntityIndex(pageCategory);
    }

    const pageCtx = await loadRegionalPageContext(page);
    return { page, pageCtx };
  }
);
