import "server-only";

import { cache } from "react";
import { fetchAcademiesFromR2 } from "@/lib/academy/r2-store";
import {
  readTtlMemoryCache,
  writeTtlMemoryCache,
  type TtlMemoryCache,
} from "@/lib/cache/ttl-memory-cache";
import type { Academy } from "@/lib/types/academy";

export const ACADEMY_INDEX_TAG = "academy-index";
const ACADEMY_INDEX_TTL_MS = 300_000;

let academyIndexMemory: TtlMemoryCache<Academy[]> | null = null;

export function invalidateAcademyIndexMemoryCache() {
  academyIndexMemory = null;
}

async function loadAcademyIndex(): Promise<Academy[]> {
  const hit = readTtlMemoryCache(academyIndexMemory);
  if (hit) return hit;
  const pages = await fetchAcademiesFromR2({ noCache: true });
  academyIndexMemory = writeTtlMemoryCache(pages, ACADEMY_INDEX_TTL_MS);
  return pages;
}

/** 목록·필터용 — 인스턴스 메모리 TTL + 요청 내 dedupe (Data Cache 미사용) */
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
