import "server-only";

import { after } from "next/server";
import { absoluteUrl } from "@/lib/site/config";

/** ISR HTML·데이터 캐시를 미리 생성 (첫 방문자 대기 제거) */
export async function warmRegionalPage(slug: string): Promise<void> {
  const key = decodeURIComponent(slug).trim();
  if (!key) return;

  const url = absoluteUrl(
    `/services/academy/region/${encodeURIComponent(key)}`
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
      console.warn(`[regional-warmup] ${key} HTTP ${res.status}`);
    }
  } catch (e) {
    console.warn(`[regional-warmup] ${key} 실패:`, e);
  }
}

/** 관리자 응답 후 백그라운드 워밍업 */
export function scheduleRegionalPageWarmup(slug: string): void {
  const key = decodeURIComponent(slug).trim();
  if (!key) return;
  after(() => warmRegionalPage(key));
}
