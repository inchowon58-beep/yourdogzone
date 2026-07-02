import "server-only";

import { cache } from "react";
import { fetchAcademiesFromR2 } from "@/lib/academy/r2-store";
import type { Academy } from "@/lib/types/academy";

/** 목록·필터용 — index.json 1회만 읽음 (revalidate 60s, 요청 내 dedupe) */
export const getCachedAcademyIndex = cache(async (): Promise<Academy[]> => {
  return fetchAcademiesFromR2();
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
