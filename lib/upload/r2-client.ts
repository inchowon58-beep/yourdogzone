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
 * 1) 서버에서 Presigned URL 발급 (R2에 직접 연결 없음 — SSL 안전)
 * 2) 브라우저에서 R2로 PUT 업로드
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
    const presignRes = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: resolvedType,
        fileSize: file.size,
      }),
    });

    const presignData = (await presignRes.json()) as PresignResponse;

    if (!presignRes.ok || !presignData.uploadUrl || !presignData.contentType) {
      return {
        ok: false,
        error: presignData.error ?? "업로드 주소를 받지 못했습니다.",
      };
    }

    const uploadRes = await fetch(presignData.uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": presignData.contentType,
      },
      // Node/Next fetch 호환 (브라우저에서는 무시됨)
      duplex: "half",
    } as RequestInit & { duplex?: "half" });

    if (!uploadRes.ok) {
      const detail = await uploadRes.text().catch(() => "");
      console.error("R2 PUT 실패:", uploadRes.status, detail);
      return {
        ok: false,
        error: `R2 업로드에 실패했습니다. (${uploadRes.status})`,
      };
    }

    if (!presignData.publicUrl) {
      return { ok: false, error: "publicUrl을 받지 못했습니다." };
    }

    return { ok: true, url: presignData.publicUrl };
  } catch (error) {
    console.error("업로드 중 에러:", error);
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return { ok: false, error: `네트워크 오류로 업로드에 실패했습니다. (${message})` };
  }
}
