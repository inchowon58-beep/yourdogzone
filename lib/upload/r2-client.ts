import {
  MAX_IMAGE_SIZE_BYTES,
  resolveImageContentType,
} from "@/lib/upload/constants";

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

type DirectUploadResponse = {
  publicUrl?: string;
  error?: string;
};

/**
 * 브라우저 → 우리 서버 → R2 경로로 업로드합니다.
 * (CORS / Presigned URL 서명 문제를 피하기 위함)
 */
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
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload/direct", {
      method: "POST",
      body: formData,
    });

    const data = (await res.json()) as DirectUploadResponse;

    if (!res.ok || !data.publicUrl) {
      return {
        ok: false,
        error: data.error ?? "업로드에 실패했습니다.",
      };
    }

    return { ok: true, url: data.publicUrl };
  } catch (error) {
    console.error("업로드 중 에러:", error);
    return { ok: false, error: "네트워크 오류로 업로드에 실패했습니다." };
  }
}
