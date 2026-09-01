import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { buildSitemapChunk } from "@/lib/seo/sitemap-build";
import type { SitemapChunkName } from "@/lib/seo/sitemap-types";

export const SITEMAP_CACHE_TAG = "sitemap";
const REVALIDATE_SECONDS = 43200;

function chunkCacheKey(name: SitemapChunkName): string[] {
  return ["sitemap-chunk", name];
}

export function getCachedSitemapChunk(name: SitemapChunkName) {
  return unstable_cache(
    () => buildSitemapChunk(name),
    chunkCacheKey(name),
    {
      revalidate: REVALIDATE_SECONDS,
      tags: [SITEMAP_CACHE_TAG, `sitemap-${name}`],
    }
  )();
}

/** 등록·삭제 시 sitemap.xml + 모든 청크 캐시 무효화 */
export function revalidateSitemap() {
  revalidatePath("/sitemap.xml");
  revalidateTag(SITEMAP_CACHE_TAG, "max");
}
