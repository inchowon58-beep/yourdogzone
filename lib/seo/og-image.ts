import { absoluteUrl } from "@/lib/site/config";

/** 사이트 기본 OG 이미지 (public/og-default.png) */
export const DEFAULT_OG_IMAGE_PATH = "/og-default.png";

export function getDefaultOgImageUrl(): string {
  return absoluteUrl(DEFAULT_OG_IMAGE_PATH);
}

/** 페이지 이미지가 있으면 사용하고, 없으면 사이트 기본 OG 이미지 */
export function resolveOgImageUrls(
  images?: (string | null | undefined)[],
  max = 3
): string[] {
  const normalized = (images ?? [])
    .filter((src): src is string => typeof src === "string" && src.trim().length > 0)
    .map((src) => (src.startsWith("http") ? src : absoluteUrl(src)));

  const unique = [...new Set(normalized)].filter((url) => url.startsWith("http"));
  if (unique.length > 0) return unique.slice(0, max);
  return [getDefaultOgImageUrl()];
}

export function buildOgImageMetadata(
  title: string,
  images?: (string | null | undefined)[]
): { url: string; alt: string }[] {
  return resolveOgImageUrls(images).map((url) => ({
    url,
    alt: title,
  }));
}
