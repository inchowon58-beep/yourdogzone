import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { createPresignedPutObject } from "@/lib/upload/presign";
import { getPublicBaseUrl } from "@/lib/upload/r2-server";
import { completeR2Uploads } from "@/lib/upload/r2-mirror";
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
export const REGIONAL_LANDINGS_TAG = "regional-landings";
const LOCAL_FILE = path.join(process.cwd(), "data", "regional-landings.json");

type IndexPayload = {
  updatedAt: string;
  pages: RegionalLandingPage[];
};

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
    const res = await fetch(indexPublicUrl(), {
      ...(options?.noCache
        ? { cache: "no-store" as const }
        : { next: { revalidate: 60 } }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as IndexPayload;
    return Array.isArray(data.pages) ? data.pages : [];
  } catch {
    return [];
  }
}

const loadRegionalLandingsIndex = unstable_cache(
  async (): Promise<RegionalLandingPage[]> => {
    const fromR2 = await fetchRegionalLandingsFromR2({ noCache: true });
    const pages = fromR2.length > 0 ? fromR2 : await readLocalSeed();
    return normalizeLandings(pages);
  },
  ["regional-landings-index-v2"],
  { revalidate: 300, tags: [REGIONAL_LANDINGS_TAG] }
);

export async function getAllRegionalLandings(options?: {
  includeUnpublished?: boolean;
}): Promise<RegionalLandingPage[]> {
  const pages = await loadRegionalLandingsIndex();
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
  const body = JSON.stringify(payload, null, 2);

  try {
    await writeLocalSeed(pages);
    revalidateTag(REGIONAL_LANDINGS_TAG, "max");
  } catch {
    // Vercel 등 읽기 전용 환경에서는 R2만 사용
  }

  const presign = await createPresignedPutObject(INDEX_KEY, "application/json");
  if ("error" in presign) {
    if (process.env.VERCEL) {
      return { error: presign.error };
    }
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
    revalidateTag(REGIONAL_LANDINGS_TAG, "max");
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
  const all = await getAllRegionalLandings({ includeUnpublished: true });
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
  const all = await getAllRegionalLandings({ includeUnpublished: true });

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
  | { pages: RegionalLandingPage[]; errors: string[] }
  | { error: string }
> {
  const now = new Date().toISOString();
  const all = await getAllRegionalLandings({ includeUnpublished: true });
  const next = [...all];
  const pages: RegionalLandingPage[] = [];
  const errors: string[] = [];

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
    if (idx >= 0) next[idx] = page;
    else next.push(page);
    pages.push(page);
  }

  if (pages.length === 0) {
    return { pages: [], errors };
  }

  const saved = await saveRegionalLandings(next);
  if ("error" in saved) return saved;
  return { pages, errors };
}

export async function deleteRegionalLanding(
  slug: string,
  category?: RegionalServiceCategory
): Promise<{ ok: true } | { error: string }> {
  const all = await getAllRegionalLandings({ includeUnpublished: true });
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
 * 이미 캐시된 regional-landings index만 사용 — 추가 R2/API 호출 없음.
 * 페이지마다 안정적으로 다른 조합이 나오도록 slug 시드로 샘플링.
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

  if (peers.length <= limit) return peers;

  // 최근 풀을 넓게 잡은 뒤 페이지별로 다른 30개 선택 (내부링크 다양성)
  const pool = peers.slice(0, Math.min(peers.length, limit * 3));
  return sampleStableRandom(pool, limit, `${page.slug}-related-peers`);
}
