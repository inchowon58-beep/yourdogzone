import "server-only";

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { createPresignedPutObject } from "@/lib/upload/presign";
import { getPublicBaseUrl } from "@/lib/upload/r2-server";
import { completeR2Uploads } from "@/lib/upload/r2-mirror-core";
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
  REGIONAL_SERVICE_CATEGORIES,
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
const SUMMARY_KEY = "regional-landings/summary.json";
/** @deprecated Data Cache 미사용 — 관리자/호환용 태그명만 유지 */
export const REGIONAL_LANDINGS_TAG = "regional-landings";
const LOCAL_FILE = path.join(process.cwd(), "data", "regional-landings.json");
const INDEX_MEMORY_TTL_MS = 300_000;
const SUMMARY_MEMORY_TTL_MS = 300_000;
const FULL_INDEX_TIMEOUT_MS = 120_000;

type IndexPayload = {
  updatedAt: string;
  pages: RegionalLandingPage[];
};

/** seoBlocks/faq 제외 — 목록·관련글·슬러그용 (수 MB → ~1MB) */
export type RegionalLandingSummary = {
  slug: string;
  category: RegionalServiceCategory;
  label: string;
  keyword: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  metaDescription?: string;
  regionInfo?: string;
  imageUrl?: string;
};

type SummaryPayload = {
  updatedAt: string;
  items: RegionalLandingSummary[];
};

let regionalIndexMemory: TtlMemoryCache<RegionalLandingPage[]> | null = null;
let regionalSummaryMemory: TtlMemoryCache<RegionalLandingSummary[]> | null =
  null;

export function invalidateRegionalLandingsMemoryCache() {
  regionalIndexMemory = null;
  regionalSummaryMemory = null;
}

function indexPublicUrl(): string {
  return `${getPublicBaseUrl()}/${INDEX_KEY}`;
}

function summaryPublicUrl(): string {
  return `${getPublicBaseUrl()}/${SUMMARY_KEY}`;
}

export function regionalPageDataKey(
  category: RegionalServiceCategory,
  slug: string
): string {
  return `regional-landings/data/${category}/${slug}.json`;
}

function regionalPageDataPublicUrl(
  category: RegionalServiceCategory,
  slug: string
): string {
  return `${getPublicBaseUrl()}/${regionalPageDataKey(category, slug)}`;
}

function toSummary(page: RegionalLandingPage): RegionalLandingSummary {
  return {
    slug: page.slug,
    category: resolvePageCategory(page),
    label: page.label,
    keyword: page.keyword,
    isPublished: page.isPublished,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    metaDescription: page.metaDescription,
    regionInfo: page.regionInfo,
    imageUrl: page.imageUrl,
  };
}

function summaryAsPage(item: RegionalLandingSummary): RegionalLandingPage {
  return {
    slug: item.slug,
    category: item.category,
    label: item.label,
    keyword: item.keyword,
    nearbySlugs: [],
    metaDescription: item.metaDescription,
    regionInfo: item.regionInfo,
    imageUrl: item.imageUrl,
    isPublished: item.isPublished,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
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
    const bust = options?.noCache ? `?t=${Date.now()}` : "";
    const res = await fetch(`${indexPublicUrl()}${bust}`, {
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
  // 대용량 index: R2 API 직접(타임아웃 여유) → CDN → bust → 로컬
  const direct = await getR2ObjectText(INDEX_KEY, {
    requestTimeoutMs: FULL_INDEX_TIMEOUT_MS,
  });
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

  const fromCdn = await fetchRegionalLandingsFromR2();
  if (fromCdn.length > 0) return normalizeLandings(fromCdn);

  const fromBust = await fetchRegionalLandingsFromR2({ noCache: true });
  if (fromBust.length > 0) return normalizeLandings(fromBust);

  return normalizeLandings(await readLocalSeed());
}

async function loadRegionalLandingsIndex(): Promise<RegionalLandingPage[]> {
  const hit = readTtlMemoryCache(regionalIndexMemory);
  if (hit && hit.length > 0) return hit;

  const pages = await loadRegionalLandingsIndexFromSources();
  if (pages.length > 0) {
    regionalIndexMemory = writeTtlMemoryCache(pages, INDEX_MEMORY_TTL_MS);
  }
  return pages;
}

async function fetchSummaryFromCdn(): Promise<RegionalLandingSummary[]> {
  try {
    const res = await fetch(summaryPublicUrl(), {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as SummaryPayload;
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

async function loadRegionalSummary(): Promise<RegionalLandingSummary[]> {
  const hit = readTtlMemoryCache(regionalSummaryMemory);
  if (hit && hit.length > 0) return hit;

  let items = await fetchSummaryFromCdn();
  if (items.length === 0) {
    const direct = await getR2ObjectText(SUMMARY_KEY, {
      requestTimeoutMs: 30_000,
    });
    if (direct) {
      try {
        const data = JSON.parse(direct) as SummaryPayload;
        if (Array.isArray(data.items)) items = data.items;
      } catch {
        // fall through
      }
    }
  }

  // summary 아직 없으면 풀 index에서 한 번 만들어 메모리에만 보관
  if (items.length === 0) {
    const pages = await loadRegionalLandingsIndex();
    items = pages.map(toSummary);
  }

  if (items.length > 0) {
    regionalSummaryMemory = writeTtlMemoryCache(items, SUMMARY_MEMORY_TTL_MS);
  }
  return items;
}

async function fetchPageDataFile(
  category: RegionalServiceCategory,
  slug: string
): Promise<RegionalLandingPage | null> {
  try {
    const res = await fetch(regionalPageDataPublicUrl(category, slug), {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (res.ok) {
      const page = (await res.json()) as RegionalLandingPage;
      if (page?.slug) return normalizeLandingPage(page);
    }
  } catch {
    // fall through to R2 API
  }

  const direct = await getR2ObjectText(regionalPageDataKey(category, slug), {
    requestTimeoutMs: 20_000,
  });
  if (!direct) return null;
  try {
    const page = JSON.parse(direct) as RegionalLandingPage;
    return page?.slug ? normalizeLandingPage(page) : null;
  } catch {
    return null;
  }
}

/** 쓰기·관리자용 — R2 API 직접 조회(CDN 우회) → 공개 URL → 로컬 */
export async function loadRegionalLandingsIndexFresh(): Promise<
  RegionalLandingPage[]
> {
  const direct = await getR2ObjectText(INDEX_KEY, {
    requestTimeoutMs: FULL_INDEX_TIMEOUT_MS,
  });
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

  // 1) 단건 JSON (가벼움) — category 힌트 또는 summary로 경로 확정
  const categoriesToTry: RegionalServiceCategory[] = options?.category
    ? [options.category]
    : [];
  if (!options?.category) {
    const summary = await loadRegionalSummary();
    const hit = summary.find((p) => p.slug === decoded);
    if (hit) categoriesToTry.push(hit.category);
    for (const cat of REGIONAL_SERVICE_CATEGORIES) {
      if (!categoriesToTry.includes(cat)) categoriesToTry.push(cat);
    }
  }

  for (const cat of categoriesToTry) {
    const fromFile = await fetchPageDataFile(cat, decoded);
    if (fromFile) {
      if (options?.category && resolvePageCategory(fromFile) !== options.category) {
        continue;
      }
      if (!fromFile.isPublished && !options?.allowUnpublished) return null;
      return fromFile;
    }
  }

  // 2) 풀 index 폴백 (구 데이터·백필 전)
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
  const items = await loadRegionalSummary();
  return items
    .filter(
      (p) =>
        p.isPublished && (!category || p.category === category)
    )
    .map((p) => p.slug);
}

async function uploadSummary(pages: RegionalLandingPage[]): Promise<void> {
  const payload: SummaryPayload = {
    updatedAt: new Date().toISOString(),
    items: pages.map(toSummary),
  };
  const presign = await createPresignedPutObject(
    SUMMARY_KEY,
    "application/json"
  );
  if ("error" in presign) return;
  await completeR2Uploads([
    {
      uploadUrl: presign.uploadUrl,
      contentType: presign.contentType,
      body: JSON.stringify(payload),
    },
  ]);
}

/** 발행·수정된 페이지만 단건 JSON 업로드 (전체 N건 PUT 방지) */
export async function uploadRegionalPageDataFiles(
  pages: RegionalLandingPage[]
): Promise<void> {
  if (pages.length === 0) return;
  const uploads: {
    uploadUrl: string;
    contentType: string;
    body: string;
  }[] = [];

  for (const page of pages) {
    const category = resolvePageCategory(page);
    const presign = await createPresignedPutObject(
      regionalPageDataKey(category, page.slug),
      "application/json"
    );
    if ("error" in presign) continue;
    uploads.push({
      uploadUrl: presign.uploadUrl,
      contentType: presign.contentType,
      body: JSON.stringify(normalizeLandingPage(page)),
    });
  }

  // 청크 업로드 (한 번에 너무 많으면 타임아웃)
  const chunkSize = 40;
  for (let i = 0; i < uploads.length; i += chunkSize) {
    await completeR2Uploads(uploads.slice(i, i + chunkSize));
  }
}

export async function saveRegionalLandings(
  pages: RegionalLandingPage[],
  options?: { pageDataFiles?: RegionalLandingPage[] }
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
    // summary 는 가벼워서 항상 같이 갱신
    await uploadSummary(pages);
    if (options?.pageDataFiles?.length) {
      await uploadRegionalPageDataFiles(options.pageDataFiles);
    }
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

  const saved = await saveRegionalLandings([...all, page], {
    pageDataFiles: [page],
  });
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

  const saved = await saveRegionalLandings(next, { pageDataFiles: [page] });
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

  const saved = await saveRegionalLandings(next, { pageDataFiles: pages });
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
  const summary = await loadRegionalSummary();
  const bySlug = new Map(
    summary
      .filter((p) => p.category === category && p.isPublished)
      .map((p) => [p.slug, p])
  );
  return page.nearbySlugs
    .map((s) => bySlug.get(s))
    .filter((p): p is RegionalLandingSummary => Boolean(p))
    .slice(0, 5)
    .map(summaryAsPage);
}

/**
 * 동일 카테고리 최근 발행글 (최대 limit).
 * summary.json(경량) 우선 — 풀 index 다운로드 없음.
 */
export async function getRelatedRegionalPeers(
  page: RegionalLandingPage,
  limit = 30
): Promise<RegionalLandingPage[]> {
  const category = resolvePageCategory(page);
  const all = await loadRegionalSummary();
  const peers = all
    .filter(
      (p) =>
        p.isPublished &&
        p.slug !== page.slug &&
        p.category === category
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

  return selected.map(summaryAsPage);
}
