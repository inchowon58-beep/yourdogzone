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

export async function fetchAcademiesFromR2(): Promise<Academy[]> {
  try {
    const res = await fetch(indexPublicUrl(), {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { academies?: Academy[] };
    return Array.isArray(data.academies) ? data.academies : [];
  } catch {
    return [];
  }
}

export async function fetchAcademyFromR2(slug: string): Promise<Academy | null> {
  try {
    const res = await fetch(academyPublicUrl(slug), {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      return (await res.json()) as Academy;
    }
  } catch {
    // fall through to index lookup
  }

  const list = await fetchAcademiesFromR2();
  return list.find((a) => a.slug === slug) ?? null;
}

export async function prepareAcademyR2Insert(
  payload: AcademyInsert
): Promise<
  | { record: Academy; uploads: R2UploadTask[]; error: null }
  | { record: null; uploads: null; error: string }
> {
  const existing = await fetchAcademiesFromR2();
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
