import "server-only";

import { after } from "next/server";
import { absoluteUrl } from "@/lib/site/config";
import { regionalLandingPathForCategory } from "@/lib/academy/regional-path";
import type { RegionalServiceCategory } from "@/lib/seo/regional-service-config";

/** ISR HTML·데이터 캐시를 미리 생성 (첫 방문자 대기 제거) */
export async function warmRegionalPage(
  slug: string,
  category: RegionalServiceCategory = "academy"
): Promise<void> {
  const key = decodeURIComponent(slug).trim();
  if (!key) return;

  const url = absoluteUrl(
    `${regionalLandingPathForCategory(category, key)}`
  );
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "YourDogZone-Cache-Warmup",
        Accept: "text/html",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`[regional-warmup] ${category}/${key} HTTP ${res.status}`);
    }
  } catch (e) {
    console.warn(`[regional-warmup] ${category}/${key} 실패:`, e);
  }
}

/** 관리자 응답 후 백그라운드 워밍업 */
export function scheduleRegionalPageWarmup(
  slug: string,
  category: RegionalServiceCategory = "academy"
): void {
  const key = decodeURIComponent(slug).trim();
  if (!key) return;
  after(() => warmRegionalPage(key, category));
}
