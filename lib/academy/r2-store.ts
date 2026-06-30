import { createPresignedPutObject } from "@/lib/upload/presign";
import { getPublicBaseUrl } from "@/lib/upload/r2-server";
import type { Academy, AcademyInsert } from "@/lib/types/academy";

const INDEX_KEY = "academies/index.json";

export type R2UploadTask = {
  uploadUrl: string;
  contentType: string;
  body: string;
};

function academyDataKey(slug: string): string {
  return `academies/data/${slug}.json`;
}

function indexPublicUrl(): string {
  return `${getPublicBaseUrl()}/${INDEX_KEY}`;
}

function academyPublicUrl(slug: string): string {
  return `${getPublicBaseUrl()}/${academyDataKey(slug)}`;
}

export async function fetchAcademiesFromR2(options?: {
  noCache?: boolean;
}): Promise<Academy[]> {
  try {
    const res = await fetch(indexPublicUrl(), {
      ...(options?.noCache ? { cache: "no-store" as const } : { next: { revalidate: 60 } }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { academies?: Academy[] };
    return Array.isArray(data.academies) ? data.academies : [];
  } catch {
    return [];
  }
}

export async function fetchAcademyFromR2(
  slug: string,
  options?: { noCache?: boolean }
): Promise<Academy | null> {
  try {
    const res = await fetch(academyPublicUrl(slug), {
      ...(options?.noCache ? { cache: "no-store" as const } : { next: { revalidate: 60 } }),
    });
    if (res.ok) {
      const data = (await res.json()) as Academy & { deleted?: boolean };
      if (data.deleted) return null;
      return data;
    }
  } catch {
    // fall through to index lookup
  }

  const list = await fetchAcademiesFromR2(options);
  return list.find((a) => a.slug === slug) ?? null;
}

/** index + 개별 data JSON을 병합해 최신 학원 목록 반환 (is_premium 등 유지) */
export async function loadLatestAcademyList(): Promise<Academy[]> {
  const indexList = await fetchAcademiesFromR2({ noCache: true });
  if (indexList.length === 0) return [];

  const merged = await Promise.all(
    indexList.map(async (summary) => {
      const latest = await fetchAcademyFromR2(summary.slug, { noCache: true });
      return latest ?? summary;
    })
  );

  return merged;
}

export async function prepareAcademyR2Insert(
  payload: AcademyInsert
): Promise<
  | { record: Academy; uploads: R2UploadTask[]; error: null }
  | { record: null; uploads: null; error: string }
> {
  const existing = await loadLatestAcademyList();
  if (existing.some((a) => a.slug === payload.slug)) {
    return {
      record: null,
      uploads: null,
      error: "이미 등록된 학원 slug입니다. 학원명이나 지역을 조금 바꿔 주세요.",
    };
  }

  const now = new Date().toISOString();
  const record: Academy = {
    id: Date.now(),
    slug: payload.slug,
    name: payload.name,
    region_big: payload.region_big,
    region_small: payload.region_small,
    title_copy: payload.title_copy,
    logo_image: payload.logo_image ?? null,
    academy_images: payload.academy_images ?? null,
    phone: payload.phone ?? null,
    address: payload.address,
    curriculum: payload.curriculum ?? null,
    tuition_info: payload.tuition_info ?? null,
    kakao_url: payload.kakao_url ?? null,
    seo_title_suffix: payload.seo_title_suffix ?? null,
    is_premium: payload.is_premium ?? false,
    created_at: now,
    updated_at: now,
  };

  const dataBody = JSON.stringify(record, null, 2);
  const indexBody = JSON.stringify(
    {
      updatedAt: now,
      academies: [record, ...existing],
    },
    null,
    2
  );

  const dataPresign = await createPresignedPutObject(
    academyDataKey(payload.slug),
    "application/json"
  );
  if ("error" in dataPresign) {
    return { record: null, uploads: null, error: dataPresign.error };
  }

  const indexPresign = await createPresignedPutObject(INDEX_KEY, "application/json");
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

async function buildAcademyR2Uploads(
  record: Academy,
  allAcademies: Academy[]
): Promise<
  | { uploads: R2UploadTask[]; error: null }
  | { uploads: null; error: string }
> {
  const now = new Date().toISOString();
  const updatedRecord = { ...record, updated_at: now };
  const updatedList = allAcademies.map((a) =>
    a.slug === record.slug ? updatedRecord : a
  );

  const dataBody = JSON.stringify(updatedRecord, null, 2);
  const indexBody = JSON.stringify(
    { updatedAt: now, academies: updatedList },
    null,
    2
  );

  const dataPresign = await createPresignedPutObject(
    academyDataKey(record.slug),
    "application/json"
  );
  if ("error" in dataPresign) {
    return { uploads: null, error: dataPresign.error };
  }

  const indexPresign = await createPresignedPutObject(INDEX_KEY, "application/json");
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

export async function prepareAcademyPremiumUpdate(
  slug: string,
  isPremium: boolean
): Promise<
  | { record: Academy; uploads: R2UploadTask[]; error: null }
  | { record: null; uploads: null; error: string }
> {
  const academies = await loadLatestAcademyList();
  const target =
    (await fetchAcademyFromR2(slug, { noCache: true })) ??
    academies.find((a) => a.slug === slug);

  if (!target) {
    return {
      record: null,
      uploads: null,
      error: "해당 학원을 찾을 수 없습니다.",
    };
  }

  if (target.is_premium === isPremium) {
    return {
      record: null,
      uploads: null,
      error: isPremium
        ? "이미 인증 추천 학원으로 설정되어 있습니다."
        : "이미 일반 학원으로 설정되어 있습니다.",
    };
  }

  const record: Academy = { ...target, is_premium: isPremium };
  const mergedList = academies.map((a) => (a.slug === slug ? record : a));
  const built = await buildAcademyR2Uploads(record, mergedList);
  if (built.error || !built.uploads) {
    return {
      record: null,
      uploads: null,
      error: built.error ?? "R2 업로드 준비에 실패했습니다.",
    };
  }

  return { record, uploads: built.uploads, error: null };
}

export async function prepareAcademyR2Deletes(
  slugs: string[]
): Promise<
  | { deleted: string[]; uploads: R2UploadTask[]; error: null }
  | { deleted: string[]; uploads: null; error: string }
> {
  const slugSet = new Set(slugs.map((s) => s.trim()).filter(Boolean));
  if (slugSet.size === 0) {
    return { deleted: [], uploads: null, error: "삭제할 slug가 없습니다." };
  }

  const academies = await loadLatestAcademyList();
  const toDelete = academies.filter((a) => slugSet.has(a.slug));
  if (toDelete.length === 0) {
    return {
      deleted: [],
      uploads: null,
      error: "해당 학원을 찾을 수 없습니다.",
    };
  }

  const remaining = academies.filter((a) => !slugSet.has(a.slug));
  const now = new Date().toISOString();
  const uploads: R2UploadTask[] = [];

  const indexBody = JSON.stringify(
    { updatedAt: now, academies: remaining },
    null,
    2
  );
  const indexPresign = await createPresignedPutObject(INDEX_KEY, "application/json");
  if ("error" in indexPresign) {
    return { deleted: [], uploads: null, error: indexPresign.error };
  }
  uploads.push({
    uploadUrl: indexPresign.uploadUrl,
    contentType: indexPresign.contentType,
    body: indexBody,
  });

  for (const slug of toDelete.map((a) => a.slug)) {
    const tombstone = JSON.stringify({ deleted: true, slug, deleted_at: now }, null, 2);
    const dataPresign = await createPresignedPutObject(
      academyDataKey(slug),
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
    deleted: toDelete.map((a) => a.slug),
    uploads,
    error: null,
  };
}
