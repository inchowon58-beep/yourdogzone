import { getPublicBaseUrl } from "@/lib/upload/r2-server";
import type { Breed } from "@/lib/types/breed";

const INDEX_KEY = "breeds/index.json";

function dataKey(slug: string): string {
  return `breeds/data/${slug}.json`;
}

function indexPublicUrl(): string {
  return `${getPublicBaseUrl()}/${INDEX_KEY}`;
}

function dataPublicUrl(slug: string): string {
  const encoded = encodeURIComponent(slug);
  return `${getPublicBaseUrl()}/${dataKey(encoded)}`;
}

export function normalizeBreedSlug(slug: string): string {
  let value = slug.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    // keep
  }
  return value.normalize("NFC");
}

export async function fetchBreedsIndexFromR2(options?: {
  noCache?: boolean;
}): Promise<Breed[]> {
  try {
    const res = await fetch(indexPublicUrl(), {
      ...(options?.noCache ? { cache: "no-store" as const } : { next: { revalidate: 120 } }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { breeds?: Breed[] };
    return Array.isArray(data.breeds) ? data.breeds : [];
  } catch {
    return [];
  }
}

export async function fetchBreedFromR2(
  slug: string,
  options?: { noCache?: boolean }
): Promise<Breed | null> {
  const normalized = normalizeBreedSlug(slug);
  const fetchOpts = options?.noCache
    ? { cache: "no-store" as const }
    : { next: { revalidate: 120 } };

  for (const candidate of [normalized, slug.trim()]) {
    if (!candidate) continue;
    try {
      const res = await fetch(dataPublicUrl(candidate), fetchOpts);
      if (!res.ok) continue;
      const data = (await res.json()) as Breed & { deleted?: boolean };
      if (data.deleted) return null;
      return data;
    } catch {
      // try next
    }
  }

  const list = await fetchBreedsIndexFromR2(options);
  return list.find((b) => normalizeBreedSlug(b.slug) === normalized) ?? null;
}

export async function loadAllBreedsFromR2(): Promise<Breed[]> {
  const indexList = await fetchBreedsIndexFromR2({ noCache: true });
  if (indexList.length === 0) return [];

  const merged = await Promise.all(
    indexList.map(async (summary) => {
      const latest = await fetchBreedFromR2(summary.slug, { noCache: true });
      return latest ?? summary;
    })
  );
  return merged;
}
