import "server-only";

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { createPresignedPutObject } from "@/lib/upload/presign";
import { getPublicBaseUrl } from "@/lib/upload/r2-server";
import { completeR2Uploads } from "@/lib/upload/r2-mirror";
import { getR2ObjectText } from "@/lib/upload/r2-get";
import {
  readTtlMemoryCache,
  writeTtlMemoryCache,
  type TtlMemoryCache,
} from "@/lib/cache/ttl-memory-cache";
import type {
  RegionalLandingInsert,
  RegionalLandingPage,
} from "@/lib/types/regional-landing";
import {
  resolvePageCategory,
  type RegionalServiceCategory,
} from "@/lib/seo/regional-service-config";
import { sampleStableRandom } from "@/lib/utils/random-sample";

function normalizeLandingPage(page: RegionalLandingPage): RegionalLandingPage {
  return {
    ...page,
    category: resolvePageCategory(page),
  };
}

function normalizeLandings(pages: RegionalLandingPage[]): RegionalLandingPage[] {
  return pages.map(normalizeLandingPage);
}

const INDEX_KEY = "regional-landings/index.json";
/** @deprecated Data Cache 미사용 — 관리자/호환용 태그명만 유지 */
export const REGIONAL_LANDINGS_TAG = "regional-landings";
const LOCAL_FILE = path.join(process.cwd(), "data", "regional-landings.json");
/** 인스턴스 메모리 TTL (초) — unstable_cache 대체 */
const INDEX_MEMORY_TTL_MS = 300_000;

type IndexPayload = {
  updatedAt: string;
  pages: RegionalLandingPage[];
};

let regionalIndexMemory: TtlMemoryCache<RegionalLandingPage[]> | null = null;

export function invalidateRegionalLandingsMemoryCache() {
  regionalIndexMemory = null;
}

function indexPublicUrl(): string {
  return `${getPublicBaseUrl()}/${INDEX_KEY}`;
}

async function readLocalSeed(): Promise<RegionalLandingPage[]> {
  try {
    const raw = await readFile(LOCAL_FILE, "utf8");
    const data = JSON.parse(raw) as IndexPayload;
    return Array.isArray(data.pages) ? data.pages : [];
  } catch {
    return [];
  }
}

async function writeLocalSeed(pages: RegionalLandingPage[]): Promise<void> {
  const payload: IndexPayload = {
    updatedAt: new Date().toISOString(),
    pages,
  };
  await writeFile(LOCAL_FILE, JSON.stringify(payload, null, 2), "utf8");
}

export async function fetchRegionalLandingsFromR2(options?: {
  noCache?: boolean;
}): Promise<RegionalLandingPage[]> {
  try {
    // 공개 읽기는 CDN URL 그대로(캐시 활용). noCache일 때만 bust.
    // ?t= 매번 bust 하면 9MB+ index를 요청마다 받아 타임아웃→빈배열→404가 난다.
    const bust = options?.noCache ? `?t=${Date.now()}` : "";
    const res = await fetch(`${indexPublicUrl()}${bust}`, {
      // Next Data Cache에 대용량 body를 넣지 않음 (용량 초과 경고 방지)
      cache: "no-store",
      headers: options?.noCache
        ? { "Cache-Control": "no-cache", Pragma: "no-cache" }
        : undefined,
      signal: AbortSignal.timeout(55_000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as IndexPayload;
    return Array.isArray(data.pages) ? data.pages : [];
  } catch {
    return [];
  }
}

async function loadRegionalLandingsIndexFromSources(): Promise<
  RegionalLandingPage[]
> {
  // 1) CDN (빠름) 2) R2 API 직접 3) 로컬 시드
  const fromCdn = await fetchRegionalLandingsFromR2();
  if (fromCdn.length > 0) return normalizeLandings(fromCdn);

  const direct = await getR2ObjectText(INDEX_KEY);
  if (direct) {
    try {
      const data = JSON.parse(direct) as IndexPayload;
      if (Array.isArray(data.pages) && data.pages.length > 0) {
        return normalizeLandings(data.pages);
      }
    } catch {
      // fall through
    }
  }

  const fromBust = await fetchRegionalLandingsFromR2({ noCache: true });
  if (fromBust.length > 0) return normalizeLandings(fromBust);

  return normalizeLandings(await readLocalSeed());
}

async function loadRegionalLandingsIndex(): Promise<RegionalLandingPage[]> {
  const hit = readTtlMemoryCache(regionalIndexMemory);
  if (hit && hit.length > 0) return hit;

  const pages = await loadRegionalLandingsIndexFromSources();
  // 빈 결과는 캐시하지 않음 — 일시 실패가 5분간 전체 404로 굳는 것 방지
  if (pages.length > 0) {
    regionalIndexMemory = writeTtlMemoryCache(pages, INDEX_MEMORY_TTL_MS);
  }
  return pages;
}

/** 쓰기·관리자용 — R2 API 직접 조회(CDN 우회) → 공개 URL → 로컬 */
export async function loadRegionalLandingsIndexFresh(): Promise<
  RegionalLandingPage[]
> {
  const direct = await getR2ObjectText(INDEX_KEY);
  if (direct) {
    try {
      const data = JSON.parse(direct) as IndexPayload;
      if (Array.isArray(data.pages) && data.pages.length > 0) {
        return normalizeLandings(data.pages);
      }
    } catch {
      // fall through
    }
  }
  const fromR2 = await fetchRegionalLandingsFromR2({ noCache: true });
  const pages = fromR2.length > 0 ? fromR2 : await readLocalSeed();
  return normalizeLandings(pages);
}

export async function getAllRegionalLandings(options?: {
  includeUnpublished?: boolean;
  /** true면 캐시 무시 (관리자 목록·upsert 직전 읽기) */
  fresh?: boolean;
}): Promise<RegionalLandingPage[]> {
  const pages = options?.fresh
    ? await loadRegionalLandingsIndexFresh()
    : await loadRegionalLandingsIndex();
  if (options?.includeUnpublished) return pages;
  return pages.filter((p) => p.isPublished);
}

export async function getRegionalLandingBySlug(
  slug: string,
  options?: { allowUnpublished?: boolean; category?: RegionalServiceCategory }
): Promise<RegionalLandingPage | null> {
  const decoded = decodeURIComponent(slug).trim();
  const all = await getAllRegionalLandings({ includeUnpublished: true });
  const found = all.find((p) => {
    if (p.slug !== decoded) return false;
    if (options?.category && resolvePageCategory(p) !== options.category) {
      return false;
    }
    return true;
  });
  if (!found) return null;
  if (!found.isPublished && !options?.allowUnpublished) return null;
  return found;
}

export async function getPublishedRegionalSlugs(
  category?: RegionalServiceCategory
): Promise<string[]> {
  const pages = await getAllRegionalLandings();
  return pages
    .filter((p) => !category || resolvePageCategory(p) === category)
    .map((p) => p.slug);
}

export async function saveRegionalLandings(
  pages: RegionalLandingPage[]
): Promise<{ ok: true } | { error: string }> {
  const payload: IndexPayload = {
    updatedAt: new Date().toISOString(),
    pages,
  };
  const body = JSON.stringify(payload);

  try {
    await writeLocalSeed(pages);
    invalidateRegionalLandingsMemoryCache();
  } catch {
    // Vercel 등 읽기 전용 환경에서는 R2만 사용
  }

  const presign = await createPresignedPutObject(INDEX_KEY, "application/json");
  if ("error" in presign) {
    if (process.env.VERCEL) {
      return { error: presign.error };
    }
    invalidateRegionalLandingsMemoryCache();
    return { ok: true };
  }

  try {
    await completeR2Uploads([
      {
        uploadUrl: presign.uploadUrl,
        contentType: presign.contentType,
        body,
      },
    ]);
    invalidateRegionalLandingsMemoryCache();
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "R2 저장 실패";
    return { error: msg };
  }
}

export async function insertRegionalLanding(
  input: RegionalLandingInsert
): Promise<{ page: RegionalLandingPage } | { error: string }> {
  const now = new Date().toISOString();
  const all = await getAllRegionalLandings({
    includeUnpublished: true,
    fresh: true,
  });
  const category = resolvePageCategory(input);

  const exists = all.some(
    (p) => p.slug === input.slug && resolvePageCategory(p) === category
  );
  if (exists) {
    return { error: `이미 등록된 URL입니다: ${input.slug}` };
  }

  const page: RegionalLandingPage = {
    ...input,
    category,
    nearbySlugs: (input.nearbySlugs ?? []).slice(0, 5),
    nearbyAreas: (input.nearbyAreas ?? []).slice(0, 5),
    nearbyStations: (input.nearbyStations ?? []).slice(0, 5),
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };

  const saved = await saveRegionalLandings([...all, page]);
  if ("error" in saved) return saved;
  return { page };
}

export async function upsertRegionalLanding(
  input: RegionalLandingInsert
): Promise<{ page: RegionalLandingPage } | { error: string }> {
  const now = new Date().toISOString();
  const all = await getAllRegionalLandings({
    includeUnpublished: true,
    fresh: true,
  });

  const idx = all.findIndex(
    (p) =>
      p.slug === input.slug &&
      resolvePageCategory(p) === resolvePageCategory(input)
  );
  const page: RegionalLandingPage = {
    ...input,
    category: resolvePageCategory(input),
    nearbySlugs: (input.nearbySlugs ?? []).slice(0, 5),
    nearbyAreas: (input.nearbyAreas ?? []).slice(0, 5),
    nearbyStations: (input.nearbyStations ?? []).slice(0, 5),
    createdAt: idx >= 0 ? all[idx].createdAt : input.createdAt ?? now,
    updatedAt: now,
  };

  const next = [...all];
  if (idx >= 0) next[idx] = page;
  else next.push(page);

  const saved = await saveRegionalLandings(next);
  if ("error" in saved) return saved;
  return { page };
}

/**
 * 일괄 upsert — index 전체 읽기/쓰기 1회.
 * (단건 upsert를 N번 하면 R2 roundtrip이 N배가 되어 Cloudflare 524 유발)
 */
export async function upsertRegionalLandingsBatch(
  inputs: RegionalLandingInsert[]
): Promise<
  | {
      pages: RegionalLandingPage[];
      errors: string[];
      createdCount: number;
      updatedCount: number;
    }
  | { error: string }
> {
  const now = new Date().toISOString();
  const all = await getAllRegionalLandings({
    includeUnpublished: true,
    fresh: true,
  });
  const next = [...all];
  const pages: RegionalLandingPage[] = [];
  const errors: string[] = [];
  let createdCount = 0;
  let updatedCount = 0;

  for (const input of inputs) {
    if (!input?.slug || !input?.label) {
      errors.push("slug/label 누락");
      continue;
    }
    const category = resolvePageCategory(input);
    const idx = next.findIndex(
      (p) => p.slug === input.slug && resolvePageCategory(p) === category
    );
    const page: RegionalLandingPage = {
      ...input,
      category,
      nearbySlugs: (input.nearbySlugs ?? []).slice(0, 5),
      nearbyAreas: (input.nearbyAreas ?? []).slice(0, 5),
      nearbyStations: (input.nearbyStations ?? []).slice(0, 5),
      createdAt: idx >= 0 ? next[idx].createdAt : input.createdAt ?? now,
      updatedAt: now,
    };
    if (idx >= 0) {
      next[idx] = page;
      updatedCount += 1;
    } else {
      next.push(page);
      createdCount += 1;
    }
    pages.push(page);
  }

  if (pages.length === 0) {
    return { pages: [], errors, createdCount: 0, updatedCount: 0 };
  }

  const saved = await saveRegionalLandings(next);
  if ("error" in saved) return saved;
  return { pages, errors, createdCount, updatedCount };
}

export async function deleteRegionalLanding(
  slug: string,
  category?: RegionalServiceCategory
): Promise<{ ok: true } | { error: string }> {
  const all = await getAllRegionalLandings({
    includeUnpublished: true,
    fresh: true,
  });
  const next = all.filter((p) => {
    if (p.slug !== slug) return true;
    if (category && resolvePageCategory(p) !== category) return true;
    return false;
  });
  if (next.length === all.length) return { error: "페이지를 찾을 수 없습니다." };
  return saveRegionalLandings(next);
}

export async function resolveNearbyPages(
  page: RegionalLandingPage
): Promise<RegionalLandingPage[]> {
  const category = resolvePageCategory(page);
  const all = await getAllRegionalLandings();
  const bySlug = new Map(
    all
      .filter((p) => resolvePageCategory(p) === category)
      .map((p) => [p.slug, p])
  );
  return page.nearbySlugs
    .map((s) => bySlug.get(s))
    .filter((p): p is RegionalLandingPage => Boolean(p && p.isPublished))
    .slice(0, 5);
}

/**
 * 동일 카테고리 최근 발행글 (최대 limit).
 * 이미 로드된 regional-landings index만 사용 — 추가 R2/API 호출 없음.
 * 페이지마다 안정적으로 다른 조합이 나오도록 slug 시드로 샘플링.
 * RSC payload 절감을 위해 본문(seoBlocks/faq)은 제외한 슬림 객체 반환.
 */
export async function getRelatedRegionalPeers(
  page: RegionalLandingPage,
  limit = 30
): Promise<RegionalLandingPage[]> {
  const category = resolvePageCategory(page);
  const all = await getAllRegionalLandings();
  const peers = all
    .filter(
      (p) =>
        p.isPublished &&
        p.slug !== page.slug &&
        resolvePageCategory(p) === category
    )
    .sort((a, b) => {
      const tb = Date.parse(b.updatedAt || b.createdAt || "") || 0;
      const ta = Date.parse(a.updatedAt || a.createdAt || "") || 0;
      return tb - ta;
    });

  const selected =
    peers.length <= limit
      ? peers
      : sampleStableRandom(
          peers.slice(0, Math.min(peers.length, limit * 3)),
          limit,
          `${page.slug}-related-peers`
        );

  return selected.map((p) => ({
    slug: p.slug,
    category: resolvePageCategory(p),
    label: p.label,
    keyword: p.keyword,
    nearbySlugs: [],
    metaDescription: p.metaDescription,
    regionInfo: p.regionInfo,
    imageUrl: p.imageUrl,
    isPublished: p.isPublished,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));
}
