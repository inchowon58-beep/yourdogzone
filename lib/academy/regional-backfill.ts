import "server-only";

import { after } from "next/server";
import { loadRegionalPageContext } from "@/lib/academy/regional-page-context";
import {
  fillRegionalNearbyGeo,
  fillRegionalSeoContent,
  needsRegionalNearbyGeo,
  needsRegionalSeoContent,
} from "@/lib/academy/regional-seo-sync";
import { getRegionalLandingBySlug } from "@/lib/academy/regional-store";

const backfillInFlight = new Set<string>();

/** slug 기준 백그라운드 Gemini·R2 백필 (응답 후 실행) */
export async function runRegionalPageBackfill(slug: string): Promise<void> {
  const key = decodeURIComponent(slug).trim();
  if (backfillInFlight.has(key)) return;
  backfillInFlight.add(key);

  try {
    let page = await getRegionalLandingBySlug(key, { allowUnpublished: true });
    if (!page) return;

    const needsSeo = needsRegionalSeoContent(page);
    const needsGeo = needsRegionalNearbyGeo(page);
    if (!needsSeo && !needsGeo) return;

    const pageCtx = await loadRegionalPageContext(page);

    if (needsSeo) {
      page =
        (await fillRegionalSeoContent(page, pageCtx.seoCtx)) ?? page;
    } else if (needsGeo) {
      page = (await fillRegionalNearbyGeo(page)) ?? page;
    }
  } catch (e) {
    console.error(`[regional-backfill] ${key} 실패:`, e);
  } finally {
    backfillInFlight.delete(key);
  }
}

/** 페이지 응답을 먼저 보낸 뒤 백필 예약 */
export function scheduleRegionalPageBackfill(slug: string): void {
  const key = decodeURIComponent(slug).trim();
  after(() => runRegionalPageBackfill(key));
}
