import {
  MAX_IMAGE_SIZE_BYTES,
  resolveImageContentType,
} from "@/lib/upload/constants";

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

type UploadResponse = {
  publicUrl?: string;
  error?: string;
};

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
    formData.append("file", file, file.name);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    let data: UploadResponse;
    try {
      data = (await res.json()) as UploadResponse;
    } catch {
      return { ok: false, error: `서버 응답 오류 (${res.status})` };
    }

    if (!res.ok || !data.publicUrl) {
      return {
        ok: false,
        error: data.error ?? `업로드에 실패했습니다. (${res.status})`,
      };
    }

    return { ok: true, url: data.publicUrl };
  } catch (error) {
    console.error("업로드 중 에러:", error);
    return { ok: false, error: "네트워크 오류로 업로드에 실패했습니다." };
  }
}
