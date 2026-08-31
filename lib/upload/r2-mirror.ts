import { buildR2Key, MAX_IMAGE_SIZE_BYTES, resolveImageContentType } from "@/lib/upload/constants";
import { createPresignedPutObject } from "@/lib/upload/presign";
import { resolveExternalImageUrl } from "@/lib/upload/r2-mirror-core";

export { completeR2Uploads, resolveExternalImageUrl } from "@/lib/upload/r2-mirror-core";

const DOWNLOAD_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "image/*,*/*;q=0.8",
  Referer: "https://map.naver.com/",
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

export async function mirrorExternalImageToR2(
  imageUrl: string
): Promise<{ publicUrl: string } | { error: string }> {
  const { resizeAcademyImage } = await import("@/lib/upload/resize-image");
  const candidates = [
    ...new Set([resolveExternalImageUrl(imageUrl), imageUrl]),
  ];
  let lastError = "이미지 다운로드 실패";

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: DOWNLOAD_HEADERS,
        signal: AbortSignal.timeout(20_000),
      });

      if (!res.ok) {
        lastError = `이미지 다운로드 실패 (${res.status})`;
        continue;
      }

      let buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
        return { error: "이미지 크기가 10MB를 초과합니다." };
      }

      let contentType: string;
      let filename: string;
      try {
        const resized = await resizeAcademyImage(buffer);
        buffer = Buffer.from(resized.buffer);
        contentType = resized.contentType;
        const base = guessFilenameFromUrl(url).replace(/\.[^.]+$/, "");
        filename = `${base}${resized.extension}`;
      } catch {
        filename = guessFilenameFromUrl(url);
        const headerType = res.headers.get("content-type")?.split(";")[0]?.trim();
        const resolved = resolveImageContentType(filename, headerType);
        if (!resolved) {
          lastError = "지원하지 않는 이미지 형식입니다.";
          continue;
        }
        contentType = resolved;
      }

      if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
        return { error: "이미지 크기가 10MB를 초과합니다." };
      }

      const key = buildR2Key(filename);
      const presign = await createPresignedPutObject(key, contentType);
      if ("error" in presign) {
        lastError = presign.error;
        continue;
      }

      const putRes = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: buffer,
        duplex: "half",
      } as RequestInit & { duplex?: "half" });

      if (!putRes.ok) {
        const detail = await putRes.text().catch(() => "");
        lastError = `R2 이미지 업로드 실패 (${putRes.status}): ${detail.slice(0, 120)}`;
        continue;
      }

      return { publicUrl: presign.publicUrl };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      lastError = `이미지 미러링 실패: ${message}`;
    }
  }

  return { error: lastError };
}

export async function mirrorExternalImagesToR2(
  imageUrls: string[],
  maxCount = 3
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
