import { parseKoreanAddress } from "@/lib/academy/parse-address";
import { getListingConfig } from "@/lib/listings/config";
import { insertListing } from "@/lib/listings/queries";
import { generateListingSlug, listingPageUrl } from "@/lib/listings/slug";
import { submitToIndexNow } from "@/lib/indexnow/submit";
import {
  completeR2Uploads,
  mirrorExternalImagesToR2,
} from "@/lib/upload/r2-mirror";
import type { ListingCategory } from "@/lib/types/listing";

export type BulkListingInput = {
  name: string;
  address: string;
  phone?: string | null;
  description?: string | null;
  title_copy?: string | null;
  service_info?: string | null;
  extra_info?: string | null;
  extra_info_2?: string | null;
  kakao_url?: string | null;
  region_big?: string | null;
  region_small?: string | null;
  image_urls?: string[];
  logo_image?: string | null;
  gallery_images?: string[];
  is_premium?: boolean;
  naver_place_url?: string | null;
  seo_title_suffix?: string | null;
};

export type BulkListingItemResult = {
  ok: boolean;
  name: string;
  slug?: string;
  url?: string;
  storage?: "r2";
  imageCount?: number;
  indexnow?: { ok: boolean; status: number; message: string };
  error?: string;
};

export type BulkListingRegisterOptions = {
  deferIndexNow?: boolean;
};

function splitImages(urls: string[]): {
  logo_image: string | null;
  gallery_images: string[] | null;
} {
  const unique = [...new Set(urls.filter((u) => u.startsWith("http")))].slice(0, 3);
  if (unique.length === 0) {
    return { logo_image: null, gallery_images: null };
  }
  return {
    logo_image: unique[0],
    gallery_images: unique.length > 1 ? unique.slice(1) : null,
  };
}

export async function bulkRegisterListing(
  category: ListingCategory,
  input: BulkListingInput,
  options: BulkListingRegisterOptions = {}
): Promise<BulkListingItemResult> {
  const config = getListingConfig(category);
  const name = input.name?.trim();
  const address = input.address?.trim();

  if (!name || !address) {
    return { ok: false, name: name ?? "(이름 없음)", error: "name과 address는 필수입니다." };
  }

  const { region_big, region_small } =
    input.region_big && input.region_small
      ? { region_big: input.region_big, region_small: input.region_small }
      : parseKoreanAddress(address);

  const title_copy =
    input.title_copy?.trim() ||
    input.description?.trim().slice(0, 80) ||
    `${name} ${config.defaultTitleSuffix}`;

  const service_info =
    input.service_info?.trim() || input.description?.trim() || null;
  const extra_info = input.extra_info?.trim() || null;
  const extra_info_2 = input.extra_info_2?.trim() || null;

  let logo_image = input.logo_image ?? null;
  let gallery_images = input.gallery_images ?? null;
  let imageCount = 0;

  const rawUrls = [
    ...(input.image_urls ?? []),
    ...(logo_image ? [logo_image] : []),
    ...(gallery_images ?? []),
  ].filter(Boolean) as string[];

  if (rawUrls.length > 0) {
    const mirrored = await mirrorExternalImagesToR2(rawUrls, 3);
    const split = splitImages(mirrored.urls);
    logo_image = split.logo_image;
    gallery_images = split.gallery_images;
    imageCount = mirrored.urls.length;
  }

  const slug = generateListingSlug(category);

  const insertResult = await insertListing({
    slug,
    category,
    name,
    region_big,
    region_small,
    title_copy,
    phone: input.phone?.trim() || null,
    address,
    service_info,
    extra_info,
    extra_info_2,
    kakao_url: input.kakao_url?.trim() || null,
    logo_image,
    gallery_images,
    seo_title_suffix: input.seo_title_suffix?.trim() || null,
    is_premium: input.is_premium ?? false,
  });

  if (insertResult.error || !insertResult.data) {
    return {
      ok: false,
      name,
      error: insertResult.error ?? "등록에 실패했습니다.",
    };
  }

  if (insertResult.uploads?.length) {
    await completeR2Uploads(insertResult.uploads);
  }

  const url = listingPageUrl(category, insertResult.data.slug);
  const indexnow = options.deferIndexNow
    ? { ok: false, status: 0, message: "세션 종료 후 일괄 IndexNow 예정" }
    : await submitToIndexNow([url]);

  return {
    ok: true,
    name,
    slug: insertResult.data.slug,
    url,
    storage: "r2",
    imageCount,
    indexnow,
  };
}

export async function bulkRegisterListings(
  category: ListingCategory,
  items: BulkListingInput[],
  options: BulkListingRegisterOptions = {}
): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  results: BulkListingItemResult[];
}> {
  const results: BulkListingItemResult[] = [];
  for (const item of items) {
    results.push(await bulkRegisterListing(category, item, options));
  }
  const succeeded = results.filter((r) => r.ok).length;
  return {
    total: items.length,
    succeeded,
    failed: items.length - succeeded,
    results,
  };
}
