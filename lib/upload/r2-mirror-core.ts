import type { R2UploadTask } from "@/lib/academy/r2-store";

/** search.pstatic.net 프록시 URL → ldb-phinf 등 실제 이미지 URL */
export function resolveExternalImageUrl(imageUrl: string): string {
  try {
    const u = new URL(imageUrl);
    const src = u.searchParams.get("src");
    if (
      src &&
      (u.hostname.includes("pstatic.net") || u.hostname.includes("naver"))
    ) {
      return decodeURIComponent(src);
    }
  } catch {
    // ignore
  }
  return imageUrl;
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
