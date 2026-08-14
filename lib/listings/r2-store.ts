import { createPresignedPutObject } from "@/lib/upload/presign";
import { normalizeSeoDetailInput } from "@/lib/seo/sanitize-seo-html";
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
    naver_place_url: payload.naver_place_url ?? null,
    naver_rating: payload.naver_rating ?? null,
    naver_review_count: payload.naver_review_count ?? null,
    naver_blog_reviews: payload.naver_blog_reviews?.slice(0, 5) ?? null,
    seo_title_suffix: payload.seo_title_suffix ?? null,
    is_premium: payload.is_premium ?? false,
    service_info: payload.service_info ?? null,
    extra_info: payload.extra_info ?? null,
    extra_info_2: payload.extra_info_2 ?? null,
    seo_detail_html: payload.seo_detail_html ?? null,
    homepage_url: payload.homepage_url ?? null,
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

export type ListingFieldPatch = {
  name?: string;
  address?: string;
  phone?: string | null;
  title_copy?: string | null;
  region_big?: string;
  region_small?: string;
  logo_image?: string | null;
  gallery_images?: string[] | null;
  service_info?: string | null;
  extra_info?: string | null;
  extra_info_2?: string | null;
  naver_place_url?: string | null;
  kakao_url?: string | null;
  seo_detail_html?: string | null;
  homepage_url?: string | null;
};

export async function prepareListingFieldsUpdate(
  category: ListingCategory,
  slug: string,
  patch: ListingFieldPatch
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

  const name = patch.name !== undefined ? patch.name.trim() : target.name;
  const address =
    patch.address !== undefined ? patch.address.trim() : target.address;
  if (!name || !address) {
    return {
      record: null,
      uploads: null,
      error: "이름과 주소는 비울 수 없습니다.",
    };
  }

  const gallery =
    patch.gallery_images !== undefined
      ? patch.gallery_images
          ?.map((u) => u.trim())
          .filter((u) => u.startsWith("http"))
          .slice(0, 5) ?? null
      : target.gallery_images;

  const logo =
    patch.logo_image !== undefined
      ? patch.logo_image?.trim() || null
      : target.logo_image;

  const record: Listing = {
    ...target,
    name,
    address,
    phone:
      patch.phone !== undefined
        ? patch.phone?.trim() || null
        : target.phone,
    title_copy:
      patch.title_copy !== undefined
        ? patch.title_copy?.trim() || ""
        : target.title_copy,
    region_big:
      patch.region_big !== undefined
        ? patch.region_big.trim() || target.region_big
        : target.region_big,
    region_small:
      patch.region_small !== undefined
        ? patch.region_small.trim() || target.region_small
        : target.region_small,
    logo_image: logo,
    gallery_images: gallery && gallery.length > 0 ? gallery : null,
    service_info:
      patch.service_info !== undefined
        ? patch.service_info?.trim() || null
        : target.service_info,
    extra_info:
      patch.extra_info !== undefined
        ? patch.extra_info?.trim() || null
        : target.extra_info,
    extra_info_2:
      patch.extra_info_2 !== undefined
        ? patch.extra_info_2?.trim() || null
        : target.extra_info_2,
    naver_place_url:
      patch.naver_place_url !== undefined
        ? patch.naver_place_url?.trim() || null
        : target.naver_place_url,
    kakao_url:
      patch.kakao_url !== undefined
        ? patch.kakao_url?.trim() || null
        : target.kakao_url,
    seo_detail_html:
      patch.seo_detail_html !== undefined
        ? normalizeSeoDetailInput(patch.seo_detail_html ?? "")
        : target.seo_detail_html,
    homepage_url:
      patch.homepage_url !== undefined
        ? patch.homepage_url?.trim() || null
        : target.homepage_url,
  };

  const mergedList = listings.map((item) =>
    item.slug === slug ? record : item
  );
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
