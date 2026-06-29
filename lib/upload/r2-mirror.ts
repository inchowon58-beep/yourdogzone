import { buildR2Key, MAX_IMAGE_SIZE_BYTES, resolveImageContentType } from "@/lib/upload/constants";
import { createPresignedPutObject } from "@/lib/upload/presign";
import type { R2UploadTask } from "@/lib/academy/r2-store";

const DOWNLOAD_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "image/*,*/*;q=0.8",
};

function guessFilenameFromUrl(imageUrl: string): string {
  try {
    const pathname = new URL(imageUrl).pathname;
    const base = pathname.split("/").pop() ?? "image.jpg";
    return base.includes(".") ? base : `${base}.jpg`;
  } catch {
    return "image.jpg";
  }
}

export async function completeR2Uploads(uploads: R2UploadTask[]): Promise<void> {
  for (const upload of uploads) {
    const res = await fetch(upload.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": upload.contentType },
      body: upload.body,
      duplex: "half",
    } as RequestInit & { duplex?: "half" });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`R2 JSON 업로드 실패 (${res.status}): ${detail.slice(0, 120)}`);
    }
  }
}

export async function mirrorExternalImageToR2(
  imageUrl: string
): Promise<{ publicUrl: string } | { error: string }> {
  try {
    const res = await fetch(imageUrl, {
      headers: DOWNLOAD_HEADERS,
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      return { error: `이미지 다운로드 실패 (${res.status})` };
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      return { error: "이미지 크기가 10MB를 초과합니다." };
    }

    const filename = guessFilenameFromUrl(imageUrl);
    const headerType = res.headers.get("content-type")?.split(";")[0]?.trim();
    const contentType = resolveImageContentType(filename, headerType);
    if (!contentType) {
      return { error: "지원하지 않는 이미지 형식입니다." };
    }

    const key = buildR2Key(filename);
    const presign = await createPresignedPutObject(key, contentType);
    if ("error" in presign) {
      return { error: presign.error };
    }

    const putRes = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: buffer,
      duplex: "half",
    } as RequestInit & { duplex?: "half" });

    if (!putRes.ok) {
      const detail = await putRes.text().catch(() => "");
      return {
        error: `R2 이미지 업로드 실패 (${putRes.status}): ${detail.slice(0, 120)}`,
      };
    }

    return { publicUrl: presign.publicUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return { error: `이미지 미러링 실패: ${message}` };
  }
}

export async function mirrorExternalImagesToR2(
  imageUrls: string[],
  maxCount = 10
): Promise<{ urls: string[]; errors: string[] }> {
  const urls: string[] = [];
  const errors: string[] = [];

  for (const imageUrl of imageUrls.slice(0, maxCount)) {
    const result = await mirrorExternalImageToR2(imageUrl);
    if ("publicUrl" in result) {
      urls.push(result.publicUrl);
    } else {
      errors.push(`${imageUrl}: ${result.error}`);
    }
  }

  return { urls, errors };
}
