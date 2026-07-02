import { absoluteUrl } from "@/lib/site/config";
import {
  ACADEMY_OG_SUBTITLE,
  buildCategoryOgSubtitle,
} from "@/lib/seo/og-image-render";

/** 사이트 기본 OG 이미지 (public/og-default.png) — API 실패 시 폴백 */
export const DEFAULT_OG_IMAGE_PATH = "/og-default.png";

export function getDefaultOgImageUrl(): string {
  return absoluteUrl(DEFAULT_OG_IMAGE_PATH);
}

/** 동적 OG API URL (1200×630, www 도메인) */
export function buildBrandedOgImageUrl(subtitle: string): string {
  const params = new URLSearchParams({ subtitle: subtitle.trim() });
  return absoluteUrl(`/api/og?${params.toString()}`);
}

export function buildAcademyOgImageUrl(): string {
  return buildBrandedOgImageUrl(ACADEMY_OG_SUBTITLE);
}

export function buildCategoryOgImageUrl(categoryTitle: string): string {
  return buildBrandedOgImageUrl(buildCategoryOgSubtitle(categoryTitle));
}

/** ogSubtitle 우선 → images → 기본 OG */
export function resolveOgImageUrls(
  options?: {
    images?: (string | null | undefined)[];
    ogSubtitle?: string;
  },
  max = 3
): string[] {
  if (options?.ogSubtitle?.trim()) {
    return [buildBrandedOgImageUrl(options.ogSubtitle)];
  }

  const normalized = (options?.images ?? [])
    .filter((src): src is string => typeof src === "string" && src.trim().length > 0)
    .map((src) => (src.startsWith("http") ? src : absoluteUrl(src)));

  const unique = [...new Set(normalized)].filter((url) => url.startsWith("http"));
  if (unique.length > 0) return unique.slice(0, max);
  return [buildBrandedOgImageUrl("반려견 생활 정보")];
}

export function buildOgImageMetadata(
  title: string,
  options?: {
    images?: (string | null | undefined)[];
    ogSubtitle?: string;
  }
): { url: string; alt: string }[] {
  return resolveOgImageUrls(options).map((url) => ({
    url,
    alt: title,
  }));
}
