import "server-only";

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { createPresignedPutObject } from "@/lib/upload/presign";
import { getPublicBaseUrl } from "@/lib/upload/r2-server";
import { completeR2Uploads } from "@/lib/upload/r2-mirror";
import type {
  RegionalLandingInsert,
  RegionalLandingPage,
} from "@/lib/types/regional-landing";

const INDEX_KEY = "regional-landings/index.json";
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

export async function getAllRegionalLandings(options?: {
  includeUnpublished?: boolean;
}): Promise<RegionalLandingPage[]> {
  const fromR2 = await fetchRegionalLandingsFromR2();
  const pages = fromR2.length > 0 ? fromR2 : await readLocalSeed();
  if (options?.includeUnpublished) return pages;
  return pages.filter((p) => p.isPublished);
}

export async function getRegionalLandingBySlug(
  slug: string,
  options?: { allowUnpublished?: boolean }
): Promise<RegionalLandingPage | null> {
  const decoded = decodeURIComponent(slug).trim();
  const all = await getAllRegionalLandings({ includeUnpublished: true });
  const found = all.find((p) => p.slug === decoded);
  if (!found) return null;
  if (!found.isPublished && !options?.allowUnpublished) return null;
  return found;
}

export async function getPublishedRegionalSlugs(): Promise<string[]> {
  const pages = await getAllRegionalLandings();
  return pages.map((p) => p.slug);
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
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "R2 저장 실패";
    return { error: msg };
  }
}

export async function upsertRegionalLanding(
  input: RegionalLandingInsert
): Promise<{ page: RegionalLandingPage } | { error: string }> {
  const now = new Date().toISOString();
  const all = await getAllRegionalLandings({ includeUnpublished: true });

  const idx = all.findIndex((p) => p.slug === input.slug);
  const page: RegionalLandingPage = {
    ...input,
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

export async function deleteRegionalLanding(
  slug: string
): Promise<{ ok: true } | { error: string }> {
  const all = await getAllRegionalLandings({ includeUnpublished: true });
  const next = all.filter((p) => p.slug !== slug);
  if (next.length === all.length) return { error: "페이지를 찾을 수 없습니다." };
  return saveRegionalLandings(next);
}

export async function resolveNearbyPages(
  page: RegionalLandingPage
): Promise<RegionalLandingPage[]> {
  const all = await getAllRegionalLandings();
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  return page.nearbySlugs
    .map((s) => bySlug.get(s))
    .filter((p): p is RegionalLandingPage => Boolean(p && p.isPublished))
    .slice(0, 5);
}
