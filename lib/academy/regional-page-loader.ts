import "server-only";

import { cache } from "react";
import { loadRegionalPageContext } from "@/lib/academy/regional-page-context";
import type { RegionalPageContext } from "@/lib/academy/regional-page-context";
import { resolveRegionalLanding } from "@/lib/academy/regional-landing";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";

export type RegionalPageBundle = {
  page: RegionalLandingPage;
  pageCtx: RegionalPageContext;
};

/** 동일 요청 내 metadata·page 중복 조회 방지 */
export const loadRegionalPageBundle = cache(
  async (slug: string): Promise<RegionalPageBundle | null> => {
    const decoded = decodeURIComponent(slug).trim();
    const page = await resolveRegionalLanding(decoded);
    if (!page) return null;
    const pageCtx = await loadRegionalPageContext(page);
    return { page, pageCtx };
  }
);
