import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { fetchAcademiesFromR2 } from "@/lib/academy/r2-store";
import type { Academy } from "@/lib/types/academy";

export const ACADEMY_INDEX_TAG = "academy-index";

const loadAcademyIndex = unstable_cache(
  async (): Promise<Academy[]> => fetchAcademiesFromR2({ noCache: true }),
  ["academy-index-v1"],
  { revalidate: 300, tags: [ACADEMY_INDEX_TAG] }
);

/** 목록·필터용 — index.json cross-request 캐시 + 요청 내 dedupe */
export const getCachedAcademyIndex = cache(async (): Promise<Academy[]> => {
  return loadAcademyIndex();
});

export function filterAcademies(
  academies: Academy[],
  options?: { region?: string; query?: string }
): Academy[] {
  let result = academies;
  if (options?.region && options.region !== "전체") {
    result = result.filter((a) => a.region_big === options.region);
  }
  if (options?.query) {
    const q = options.query.toLowerCase();
    result = result.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.region_small.includes(q) ||
        a.address.includes(q) ||
        a.title_copy.includes(q)
    );
  }
  return result;
}

export function filterPremiumAcademies(academies: Academy[]): Academy[] {
  return academies.filter((a) => a.is_premium);
}
