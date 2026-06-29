import {
  MAX_IMAGE_SIZE_BYTES,
  resolveImageContentType,
} from "@/lib/upload/constants";

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

type PresignResponse = {
  uploadUrl?: string;
  publicUrl?: string;
  contentType?: string;
  error?: string;
};

/**
 * Presigned URL PUT 업로드 — 서명에 포함된 Content-Type만 전송합니다.
 * credentials/cache 등 추가 옵션을 넣지 않아 서명 불일치를 방지합니다.
 */
async function putToPresignedUrl(
  uploadUrl: string,
  file: File,
  contentType: string
): Promise<Response> {
  const headers = new Headers();
  headers.set("Content-Type", contentType);

  return fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers,
    mode: "cors",
    credentials: "omit",
    cache: "no-store",
  });
}

export async function uploadImageToR2(file: File): Promise<UploadResult> {
  const resolvedType = resolveImageContentType(file.name, file.type);
  if (!resolvedType) {
    return {
      ok: false,
      error: "JPEG, PNG, WebP, GIF 형식만 업로드할 수 있습니다.",
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { ok: false, error: "파일 크기는 10MB 이하여야 합니다." };
  }

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: resolvedType,
        fileSize: file.size,
      }),
    });

    const data = (await res.json()) as PresignResponse;

    if (!res.ok || !data.uploadUrl || !data.contentType) {
      return {
        ok: false,
        error: data.error ?? "업로드 주소를 받지 못했습니다.",
      };
    }

    const uploadRes = await putToPresignedUrl(
      data.uploadUrl,
      file,
      data.contentType
    );

    if (!uploadRes.ok) {
      const detail = await uploadRes.text().catch(() => "");
      console.error("R2 PUT 실패:", uploadRes.status, detail);
      return {
        ok: false,
        error: `R2 업로드에 실패했습니다. (${uploadRes.status})`,
      };
    }

    if (!data.publicUrl) {
      return { ok: false, error: "publicUrl을 받지 못했습니다." };
    }

    return { ok: true, url: data.publicUrl };
  } catch (error) {
    console.error("업로드 중 에러:", error);
    return { ok: false, error: "네트워크 오류로 업로드에 실패했습니다." };
  }
}
