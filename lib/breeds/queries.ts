import type { Breed, BreedInsert } from "@/lib/types/breed";
import type { BreedGroupTab } from "@/lib/breeds/config";
import { matchesBreedTab } from "@/lib/breeds/config";
import { getSeedBreeds } from "@/lib/breeds/data";
import {
  fetchBreedFromR2,
  loadAllBreedsFromR2,
  normalizeBreedSlug,
} from "@/lib/breeds/r2-read";
import {
  prepareBreedR2Deletes,
  prepareBreedR2Upsert,
  type R2UploadTask,
} from "@/lib/breeds/r2-store";

function mergeBreeds(seed: Breed[], remote: Breed[]): Breed[] {
  const map = new Map<string, Breed>();
  for (const b of seed) map.set(b.slug, b);
  for (const b of remote) map.set(b.slug, b);
  return Array.from(map.values()).sort((a, b) =>
    a.name_ko.localeCompare(b.name_ko, "ko")
  );
}

export async function getBreeds(options?: {
  tab?: BreedGroupTab;
  query?: string;
}): Promise<Breed[]> {
  const seed = getSeedBreeds();
  const remote = await loadAllBreedsFromR2();
  let list = mergeBreeds(seed, remote);

  if (options?.tab && options.tab !== "all") {
    list = list.filter((b) => matchesBreedTab(b, options.tab!));
  }

  if (options?.query?.trim()) {
    const q = options.query.trim().toLowerCase();
    list = list.filter(
      (b) =>
        b.name_ko.toLowerCase().includes(q) ||
        b.name_en.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q)) ||
        b.summary.toLowerCase().includes(q)
    );
  }

  return list;
}

export async function getBreedBySlug(slug: string): Promise<Breed | null> {
  const normalized = normalizeBreedSlug(slug);
  const remote = await fetchBreedFromR2(normalized, { noCache: true });
  if (remote) return remote;

  const seed = getSeedBreeds().find((b) => b.slug === normalized);
  return seed ?? null;
}

export async function getBreedSlugs(): Promise<string[]> {
  const breeds = await getBreeds();
  return breeds.map((b) => b.slug);
}

export type UpsertBreedResult =
  | { data: Breed; error: null; uploads: R2UploadTask[] }
  | { data: Breed; error: null; uploads?: undefined }
  | { data: null; error: string; uploads?: undefined };

export async function upsertBreed(payload: BreedInsert): Promise<UpsertBreedResult> {
  const remote = await loadAllBreedsFromR2();

  const prepared = await prepareBreedR2Upsert(payload, remote);
  if (prepared.error || !prepared.record) {
    return { data: null, error: prepared.error ?? "저장에 실패했습니다." };
  }

  if (prepared.uploads?.length) {
    return { data: prepared.record, error: null, uploads: prepared.uploads };
  }
  return { data: prepared.record, error: null };
}

export type DeleteBreedsResult =
  | { ok: true; deleted: string[]; uploads: R2UploadTask[] }
  | { ok: false; error: string; deleted: string[] };

export async function deleteBreeds(slugs: string[]): Promise<DeleteBreedsResult> {
  const remote = await loadAllBreedsFromR2();
  const prepared = await prepareBreedR2Deletes(slugs, remote);
  if (prepared.error || !prepared.uploads) {
    return { ok: false, error: prepared.error ?? "삭제 실패", deleted: [] };
  }
  return { ok: true, deleted: prepared.deleted, uploads: prepared.uploads };
}

export function groupBreedsByKoreanInitial(breeds: Breed[]): Map<string, Breed[]> {
  const groups = new Map<string, Breed[]>();
  for (const breed of breeds) {
    const ch = breed.name_ko.charAt(0);
    const key = /[가-힣]/.test(ch) ? ch : "#";
    const bucket = groups.get(key) ?? [];
    bucket.push(breed);
    groups.set(key, bucket);
  }
  return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b, "ko")));
}
