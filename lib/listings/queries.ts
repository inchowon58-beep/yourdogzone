import { cache } from "react";
import type { Listing, ListingCategory, ListingInsert } from "@/lib/types/listing";
import type { Academy } from "@/lib/types/academy";
import {
  loadLatestListingList,
  fetchListingFromR2,
  fetchListingsFromR2,
  normalizeListingSlug,
} from "@/lib/listings/r2-read";
import {
  prepareListingPremiumUpdate,
  prepareListingR2Deletes,
  prepareListingR2Insert,
  type R2UploadTask,
} from "@/lib/listings/r2-store";

export type InsertListingResult =
  | { data: Listing; error: null; uploads?: undefined }
  | { data: Listing; error: null; uploads: R2UploadTask[] }
  | { data: null; error: string; uploads?: undefined };

export async function getListings(
  category: ListingCategory,
  options?: { region?: string; query?: string; noCache?: boolean }
): Promise<Listing[]> {
  const all = await loadLatestListingList(category, {
    noCache: options?.noCache,
  });
  return filterListings(all, options);
}

/** 공개 상세·metadata 공용 (요청당 1회, R2 fetch 캐시 사용) */
export const getListingBySlug = cache(
  async (
    category: ListingCategory,
    slug: string
  ): Promise<Listing | null> => {
    const normalized = normalizeListingSlug(slug);
    const direct = await fetchListingFromR2(category, normalized);
    if (direct) return direct;

    const list = await fetchListingsFromR2(category);
    return (
      list.find((item) => normalizeListingSlug(item.slug) === normalized) ??
      null
    );
  }
);

export async function getListingSlugs(
  category: ListingCategory
): Promise<string[]> {
  const list = await fetchListingsFromR2(category);
  return list.map((item) => item.slug);
}

export async function insertListing(
  payload: ListingInsert
): Promise<InsertListingResult> {
  const prepared = await prepareListingR2Insert(payload);
  if (prepared.error || !prepared.record) {
    return { data: null, error: prepared.error ?? "저장에 실패했습니다." };
  }
  return {
    data: prepared.record,
    error: null,
    uploads: prepared.uploads,
  };
}

export type SetPremiumResult =
  | { data: Listing; error: null; uploads?: undefined }
  | { data: Listing; error: null; uploads: R2UploadTask[] }
  | { data: null; error: string; uploads?: undefined };

export async function setListingPremium(
  category: ListingCategory,
  slug: string,
  isPremium: boolean
): Promise<SetPremiumResult> {
  const prepared = await prepareListingPremiumUpdate(category, slug, isPremium);
  if (prepared.error || !prepared.record) {
    return { data: null, error: prepared.error ?? "변경에 실패했습니다." };
  }
  return {
    data: prepared.record,
    error: null,
    uploads: prepared.uploads,
  };
}

export type DeleteListingsResult =
  | { ok: true; deleted: string[]; uploads?: undefined }
  | { ok: true; deleted: string[]; uploads: R2UploadTask[] }
  | { ok: false; error: string; deleted: string[] };

export async function deleteListings(
  category: ListingCategory,
  slugs: string[]
): Promise<DeleteListingsResult> {
  const unique = [...new Set(slugs.map((s) => s.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return { ok: false, error: "삭제할 slug가 필요합니다.", deleted: [] };
  }

  const prepared = await prepareListingR2Deletes(category, unique);
  if (prepared.error || !prepared.uploads) {
    return {
      ok: false,
      error: prepared.error ?? "삭제에 실패했습니다.",
      deleted: [],
    };
  }

  return {
    ok: true,
    deleted: prepared.deleted,
    uploads: prepared.uploads,
  };
}

function filterListings(
  listings: Listing[],
  options?: { region?: string; query?: string }
): Listing[] {
  let result = [...listings].sort((a, b) => {
    if (a.is_premium !== b.is_premium) return a.is_premium ? -1 : 1;
    return b.created_at.localeCompare(a.created_at);
  });

  if (options?.region && options.region !== "전체") {
    result = result.filter((item) => item.region_big === options.region);
  }
  if (options?.query) {
    const q = options.query.toLowerCase();
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.region_small.includes(q) ||
        item.address.includes(q) ||
        item.title_copy.includes(q)
    );
  }
  return result;
}

/** AcademyList·PremiumAcademyGrid 재사용용 어댑터 */
export function listingAsAcademy(listing: Listing): Academy {
  return {
    id: listing.id,
    slug: listing.slug,
    name: listing.name,
    region_big: listing.region_big,
    region_small: listing.region_small,
    title_copy: listing.title_copy,
    logo_image: listing.logo_image,
    academy_images: listing.gallery_images,
    phone: listing.phone,
    address: listing.address,
    curriculum: listing.service_info,
    tuition_info: listing.extra_info,
    kakao_url: listing.kakao_url,
    seo_title_suffix: listing.seo_title_suffix,
    is_premium: listing.is_premium,
    created_at: listing.created_at,
    updated_at: listing.updated_at,
  };
}

export function getGalleryImages(listing: Listing, max = 3): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  const add = (url: string | null | undefined) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    result.push(url);
  };
  add(listing.logo_image);
  const gallery = listing.gallery_images;
  if (Array.isArray(gallery)) {
    for (const url of gallery) add(url);
  }
  return result.slice(0, max);
}

export function getThumbnail(listing: Listing): string | null {
  return listing.logo_image ?? listing.gallery_images?.[0] ?? null;
}
