import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/upload/constants";

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function uploadImageToR2(file: File): Promise<UploadResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
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
        contentType: file.type,
        fileSize: file.size,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.uploadUrl) {
      return {
        ok: false,
        error: data.error ?? "업로드 주소를 받지 못했습니다.",
      };
    }

    const uploadRes = await fetch(data.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!uploadRes.ok) {
      return { ok: false, error: "R2 업로드에 실패했습니다." };
    }

    return { ok: true, url: data.publicUrl as string };
  } catch {
    return { ok: false, error: "네트워크 오류로 업로드에 실패했습니다." };
  }
}
