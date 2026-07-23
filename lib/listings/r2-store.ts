import { createPresignedPutObject } from "@/lib/upload/presign";
import type { Listing, ListingCategory, ListingInsert } from "@/lib/types/listing";
import {
  fetchListingFromR2,
  loadLatestListingList,
} from "@/lib/listings/r2-read";

export {
  fetchListingsFromR2,
  fetchListingFromR2,
  loadLatestListingList,
} from "@/lib/listings/r2-read";

export type R2UploadTask = {
  uploadUrl: string;
  contentType: string;
  body: string;
};

function dataKey(category: ListingCategory, slug: string): string {
  return `listings/${category}/data/${slug}.json`;
}

function indexKey(category: ListingCategory): string {
  return `listings/${category}/index.json`;
}

async function buildListingR2Uploads(
  category: ListingCategory,
  record: Listing,
  allListings: Listing[]
): Promise<
  | { uploads: R2UploadTask[]; error: null }
  | { uploads: null; error: string }
> {
  const now = new Date().toISOString();
  const updatedRecord = { ...record, updated_at: now };
  const updatedList = allListings.map((item) =>
    item.slug === record.slug ? updatedRecord : item
  );

  const dataBody = JSON.stringify(updatedRecord, null, 2);
  const indexBody = JSON.stringify(
    { updatedAt: now, listings: updatedList },
    null,
    2
  );

  const dataPresign = await createPresignedPutObject(
    dataKey(category, record.slug),
    "application/json"
  );
  if ("error" in dataPresign) {
    return { uploads: null, error: dataPresign.error };
  }

  const indexPresign = await createPresignedPutObject(
    indexKey(category),
    "application/json"
  );
  if ("error" in indexPresign) {
    return { uploads: null, error: indexPresign.error };
  }

  return {
    uploads: [
      {
        uploadUrl: dataPresign.uploadUrl,
        contentType: dataPresign.contentType,
        body: dataBody,
      },
      {
        uploadUrl: indexPresign.uploadUrl,
        contentType: indexPresign.contentType,
        body: indexBody,
      },
    ],
    error: null,
  };
}

export async function prepareListingR2Insert(
  payload: ListingInsert
): Promise<
  | { record: Listing; uploads: R2UploadTask[]; error: null }
  | { record: null; uploads: null; error: string }
> {
  const existing = await loadLatestListingList(payload.category, {
    noCache: true,
  });
  if (existing.some((item) => item.slug === payload.slug)) {
    return {
      record: null,
      uploads: null,
      error: "이미 등록된 slug입니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  const now = new Date().toISOString();
  const record: Listing = {
    id: Date.now(),
    slug: payload.slug,
    category: payload.category,
    name: payload.name,
    region_big: payload.region_big,
    region_small: payload.region_small,
    title_copy: payload.title_copy,
    logo_image: payload.logo_image ?? null,
    gallery_images: payload.gallery_images ?? null,
    phone: payload.phone ?? null,
    address: payload.address,
    kakao_url: payload.kakao_url ?? null,
    seo_title_suffix: payload.seo_title_suffix ?? null,
    is_premium: payload.is_premium ?? false,
    service_info: payload.service_info ?? null,
    extra_info: payload.extra_info ?? null,
    extra_info_2: payload.extra_info_2 ?? null,
    created_at: now,
    updated_at: now,
  };

  const dataBody = JSON.stringify(record, null, 2);
  const indexBody = JSON.stringify(
    {
      updatedAt: now,
      listings: [record, ...existing],
    },
    null,
    2
  );

  const dataPresign = await createPresignedPutObject(
    dataKey(payload.category, payload.slug),
    "application/json"
  );
  if ("error" in dataPresign) {
    return { record: null, uploads: null, error: dataPresign.error };
  }

  const indexPresign = await createPresignedPutObject(
    indexKey(payload.category),
    "application/json"
  );
  if ("error" in indexPresign) {
    return { record: null, uploads: null, error: indexPresign.error };
  }

  return {
    record,
    uploads: [
      {
        uploadUrl: dataPresign.uploadUrl,
        contentType: dataPresign.contentType,
        body: dataBody,
      },
      {
        uploadUrl: indexPresign.uploadUrl,
        contentType: indexPresign.contentType,
        body: indexBody,
      },
    ],
    error: null,
  };
}

export async function prepareListingPremiumUpdate(
  category: ListingCategory,
  slug: string,
  isPremium: boolean
): Promise<
  | { record: Listing; uploads: R2UploadTask[]; error: null }
  | { record: null; uploads: null; error: string }
> {
  const listings = await loadLatestListingList(category, { noCache: true });
  const target =
    (await fetchListingFromR2(category, slug, { noCache: true })) ??
    listings.find((item) => item.slug === slug);

  if (!target) {
    return {
      record: null,
      uploads: null,
      error: "해당 업체를 찾을 수 없습니다.",
    };
  }

  if (target.is_premium === isPremium) {
    return {
      record: null,
      uploads: null,
      error: isPremium
        ? "이미 인증 추천으로 설정되어 있습니다."
        : "이미 일반 목록으로 설정되어 있습니다.",
    };
  }

  const record: Listing = { ...target, is_premium: isPremium };
  const mergedList = listings.map((item) => (item.slug === slug ? record : item));
  const built = await buildListingR2Uploads(category, record, mergedList);
  if (built.error || !built.uploads) {
    return {
      record: null,
      uploads: null,
      error: built.error ?? "R2 업로드 준비에 실패했습니다.",
    };
  }

  return { record, uploads: built.uploads, error: null };
}

export async function prepareListingR2Deletes(
  category: ListingCategory,
  slugs: string[]
): Promise<
  | { deleted: string[]; uploads: R2UploadTask[]; error: null }
  | { deleted: string[]; uploads: null; error: string }
> {
  const slugSet = new Set(slugs.map((s) => s.trim()).filter(Boolean));
  if (slugSet.size === 0) {
    return { deleted: [], uploads: null, error: "삭제할 slug가 없습니다." };
  }

  const listings = await loadLatestListingList(category, { noCache: true });
  const toDelete = listings.filter((item) => slugSet.has(item.slug));
  if (toDelete.length === 0) {
    return {
      deleted: [],
      uploads: null,
      error: "해당 업체를 찾을 수 없습니다.",
    };
  }

  const remaining = listings.filter((item) => !slugSet.has(item.slug));
  const now = new Date().toISOString();
  const uploads: R2UploadTask[] = [];

  const indexBody = JSON.stringify(
    { updatedAt: now, listings: remaining },
    null,
    2
  );
  const indexPresign = await createPresignedPutObject(
    indexKey(category),
    "application/json"
  );
  if ("error" in indexPresign) {
    return { deleted: [], uploads: null, error: indexPresign.error };
  }
  uploads.push({
    uploadUrl: indexPresign.uploadUrl,
    contentType: indexPresign.contentType,
    body: indexBody,
  });

  for (const slug of toDelete.map((item) => item.slug)) {
    const tombstone = JSON.stringify({ deleted: true, slug, deleted_at: now }, null, 2);
    const dataPresign = await createPresignedPutObject(
      dataKey(category, slug),
      "application/json"
    );
    if ("error" in dataPresign) {
      return { deleted: [], uploads: null, error: dataPresign.error };
    }
    uploads.push({
      uploadUrl: dataPresign.uploadUrl,
      contentType: dataPresign.contentType,
      body: tombstone,
    });
  }

  return {
    deleted: toDelete.map((item) => item.slug),
    uploads,
    error: null,
  };
}
