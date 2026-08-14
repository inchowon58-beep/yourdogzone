import { getPublicBaseUrl } from "@/lib/upload/r2-server";
import type { Listing, ListingCategory } from "@/lib/types/listing";

function indexKey(category: ListingCategory): string {
  return `listings/${category}/index.json`;
}

function dataKey(category: ListingCategory, slug: string): string {
  return `listings/${category}/data/${slug}.json`;
}

function indexPublicUrl(category: ListingCategory): string {
  return `${getPublicBaseUrl()}/${indexKey(category)}`;
}

function dataPublicUrl(category: ListingCategory, slug: string): string {
  const encodedSlug = encodeURIComponent(slug);
  return `${getPublicBaseUrl()}/${dataKey(category, encodedSlug)}`;
}

function withCacheBust(url: string, noCache?: boolean): string {
  if (!noCache) return url;
  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}t=${Date.now()}`;
}

export function normalizeListingSlug(slug: string): string {
  let value = slug.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    // keep original
  }
  return value.normalize("NFC");
}

export async function fetchListingsFromR2(
  category: ListingCategory,
  options?: { noCache?: boolean }
): Promise<Listing[]> {
  try {
    const res = await fetch(withCacheBust(indexPublicUrl(category), options?.noCache), {
      ...(options?.noCache ? { cache: "no-store" as const } : { next: { revalidate: 60 } }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { listings?: Listing[] };
    return Array.isArray(data.listings) ? data.listings : [];
  } catch {
    return [];
  }
}

export async function fetchListingFromR2(
  category: ListingCategory,
  slug: string,
  options?: { noCache?: boolean }
): Promise<Listing | null> {
  const normalized = normalizeListingSlug(slug);
  const fetchOpts = options?.noCache
    ? { cache: "no-store" as const }
    : { next: { revalidate: 60 } };

  for (const candidate of [normalized, slug.trim()]) {
    if (!candidate) continue;
    try {
      const res = await fetch(
        withCacheBust(dataPublicUrl(category, candidate), options?.noCache),
        fetchOpts
      );
      if (!res.ok) continue;
      const data = (await res.json()) as Listing & { deleted?: boolean };
      if (data.deleted) return null;
      return data;
    } catch {
      // try next
    }
  }

  const list = await fetchListingsFromR2(category, options);
  return (
    list.find((item) => normalizeListingSlug(item.slug) === normalized) ?? null
  );
}

export async function loadLatestListingList(
  category: ListingCategory,
  options?: { noCache?: boolean }
): Promise<Listing[]> {
  const indexList = await fetchListingsFromR2(category, options);
  if (indexList.length === 0) return [];

  const merged = await Promise.all(
    indexList.map(async (summary) => {
      const latest = await fetchListingFromR2(category, summary.slug, options);
      return latest ?? summary;
    })
  );

  return merged;
}
