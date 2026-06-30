import { createPresignedPutObject } from "@/lib/upload/presign";
import type { Breed, BreedInsert } from "@/lib/types/breed";
import { loadAllBreedsFromR2 } from "@/lib/breeds/r2-read";

export { fetchBreedsIndexFromR2, fetchBreedFromR2, loadAllBreedsFromR2 } from "@/lib/breeds/r2-read";

export type R2UploadTask = {
  uploadUrl: string;
  contentType: string;
  body: string;
};

const INDEX_KEY = "breeds/index.json";

function dataKey(slug: string): string {
  return `breeds/data/${slug}.json`;
}

async function buildBreedR2Uploads(
  record: Breed,
  allBreeds: Breed[]
): Promise<
  | { uploads: R2UploadTask[]; error: null }
  | { uploads: null; error: string }
> {
  const now = new Date().toISOString();
  const updatedRecord = { ...record, updated_at: now };
  const updatedList = allBreeds.map((item) =>
    item.slug === record.slug ? updatedRecord : item
  );

  const dataPresign = await createPresignedPutObject(
    dataKey(record.slug),
    "application/json"
  );
  if ("error" in dataPresign) {
    return { uploads: null, error: dataPresign.error };
  }

  const indexPresign = await createPresignedPutObject(
    INDEX_KEY,
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
        body: JSON.stringify(updatedRecord, null, 2),
      },
      {
        uploadUrl: indexPresign.uploadUrl,
        contentType: indexPresign.contentType,
        body: JSON.stringify({ updatedAt: now, breeds: updatedList }, null, 2),
      },
    ],
    error: null,
  };
}

export async function prepareBreedR2Upsert(
  payload: BreedInsert,
  existingBreeds: Breed[]
): Promise<
  | { record: Breed; uploads: R2UploadTask[]; error: null }
  | { record: null; uploads: null; error: string }
> {
  const now = new Date().toISOString();
  const prev = existingBreeds.find((b) => b.slug === payload.slug);
  const record: Breed = {
    ...payload,
    created_at: prev?.created_at ?? now,
    updated_at: now,
  };

  const mergedList = prev
    ? existingBreeds.map((b) => (b.slug === record.slug ? record : b))
    : [record, ...existingBreeds];

  const built = await buildBreedR2Uploads(record, mergedList);
  if (built.error || !built.uploads) {
    return { record: null, uploads: null, error: built.error ?? "R2 준비 실패" };
  }
  return { record, uploads: built.uploads, error: null };
}

export async function prepareBreedR2Deletes(
  slugs: string[],
  existingBreeds: Breed[]
): Promise<
  | { deleted: string[]; uploads: R2UploadTask[]; error: null }
  | { deleted: string[]; uploads: null; error: string }
> {
  const slugSet = new Set(slugs.map((s) => s.trim()).filter(Boolean));
  if (slugSet.size === 0) {
    return { deleted: [], uploads: null, error: "삭제할 견종이 없습니다." };
  }

  const toDelete = existingBreeds.filter((b) => slugSet.has(b.slug));
  if (toDelete.length === 0) {
    return { deleted: [], uploads: null, error: "해당 견종을 찾을 수 없습니다." };
  }

  const remaining = existingBreeds.filter((b) => !slugSet.has(b.slug));
  const now = new Date().toISOString();
  const uploads: R2UploadTask[] = [];

  const indexPresign = await createPresignedPutObject(INDEX_KEY, "application/json");
  if ("error" in indexPresign) {
    return { deleted: [], uploads: null, error: indexPresign.error };
  }
  uploads.push({
    uploadUrl: indexPresign.uploadUrl,
    contentType: indexPresign.contentType,
    body: JSON.stringify({ updatedAt: now, breeds: remaining }, null, 2),
  });

  for (const slug of toDelete.map((b) => b.slug)) {
    const dataPresign = await createPresignedPutObject(
      dataKey(slug),
      "application/json"
    );
    if ("error" in dataPresign) {
      return { deleted: [], uploads: null, error: dataPresign.error };
    }
    uploads.push({
      uploadUrl: dataPresign.uploadUrl,
      contentType: dataPresign.contentType,
      body: JSON.stringify({ deleted: true, slug, deleted_at: now }, null, 2),
    });
  }

  return { deleted: toDelete.map((b) => b.slug), uploads, error: null };
}

export async function loadBreedsForAdmin(): Promise<Breed[]> {
  return loadAllBreedsFromR2();
}
