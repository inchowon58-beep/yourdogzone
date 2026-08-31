import { parseKoreanAddress } from "@/lib/academy/parse-address";
import { getListingConfig } from "@/lib/listings/config";
import { insertListing } from "@/lib/listings/queries";
import { loadLatestListingList } from "@/lib/listings/r2-read";
import { generateListingSlug, listingPageUrl } from "@/lib/listings/slug";
import { submitToIndexNow } from "@/lib/indexnow/submit";
import { completeR2Uploads } from "@/lib/upload/r2-mirror-core";
import type { ListingCategory, NaverBlogReview } from "@/lib/types/listing";

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
  naver_rating?: number | null;
  naver_review_count?: number | null;
  naver_blog_reviews?: NaverBlogReview[] | null;
  seo_title_suffix?: string | null;
};

export type BulkListingItemResult = {
  ok: boolean;
  name: string;
  slug?: string;
  url?: string;
  storage?: "r2";
  imageCount?: number;
  imageErrors?: string[];
  indexnow?: { ok: boolean; status: number; message: string };
  error?: string;
};

export type BulkListingRegisterOptions = {
  deferIndexNow?: boolean;
  /** true면 image_urls 미러링 생략 (크롤러가 이미 R2 URL을 logo/gallery로 보낼 때) */
  skipImageMirror?: boolean;
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

  const existingList = await loadLatestListingList(category);
  const duplicate = existingList.find((row) => row.name.trim() === name);
  if (duplicate) {
    return {
      ok: true,
      name,
      slug: duplicate.slug,
      url: listingPageUrl(category, duplicate.slug),
      imageCount: 0,
      indexnow: { ok: false, status: 0, message: "중복 업체명 — 기존 페이지 유지" },
    };
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

  const r2Images: string[] = [
    ...(input.logo_image?.startsWith("http") ? [input.logo_image] : []),
    ...(input.gallery_images ?? []).filter((u) => u.startsWith("http")),
  ];
  let imageErrors: string[] = [];

  if (!options.skipImageMirror && input.image_urls?.length) {
    const { mirrorExternalImagesToR2 } = await import("@/lib/upload/r2-mirror");
    const mirrored = await mirrorExternalImagesToR2(input.image_urls, 3);
    r2Images.push(...mirrored.urls);
    imageErrors = mirrored.errors;
  }

  const uniqueImages = [...new Set(r2Images.filter((u) => u.startsWith("http")))].slice(
    0,
    3
  );
  const { logo_image, gallery_images } = splitImages(uniqueImages);
  const imageCount = uniqueImages.length;

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
    naver_place_url: input.naver_place_url?.trim() || null,
    naver_rating: input.naver_rating ?? null,
    naver_review_count: input.naver_review_count ?? null,
    naver_blog_reviews: input.naver_blog_reviews?.slice(0, 5) ?? null,
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
      imageErrors: imageErrors.length ? imageErrors : undefined,
    };
  }

  try {
    if (insertResult.uploads?.length) {
      await completeR2Uploads(insertResult.uploads);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "R2 저장 실패";
    return {
      ok: false,
      name,
      slug: insertResult.data.slug,
      error: message,
      imageErrors: imageErrors.length ? imageErrors : undefined,
    };
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
    imageErrors: imageErrors.length ? imageErrors : undefined,
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
