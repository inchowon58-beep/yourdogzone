import { absoluteUrl } from "@/lib/site/config";
import {
  ACADEMY_OG_SUBTITLE,
  buildCategoryOgSubtitle,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
} from "@/lib/seo/og-image-render";

/** 사이트 기본 OG 이미지 — API 실패·크롤러 폴백 */
export const DEFAULT_OG_IMAGE_PATH = "/og-default.png";
export const ACADEMY_OG_IMAGE_PATH = "/og-academy.png";

export function getDefaultOgImageUrl(): string {
  return absoluteUrl(DEFAULT_OG_IMAGE_PATH);
}

export function getAcademyOgImageUrl(): string {
  return absoluteUrl(ACADEMY_OG_IMAGE_PATH);
}

/** 동적 OG API URL (1200×630) — 카테고리별 부제 */
export function buildBrandedOgImageUrl(subtitle: string): string {
  const trimmed = subtitle.trim();
  if (trimmed === ACADEMY_OG_SUBTITLE) {
    return getAcademyOgImageUrl();
  }
  const params = new URLSearchParams({ subtitle: trimmed });
  return absoluteUrl(`/api/og?${params.toString()}`);
}

export function buildAcademyOgImageUrl(): string {
  return getAcademyOgImageUrl();
}

export function buildCategoryOgImageUrl(categoryTitle: string): string {
  return buildBrandedOgImageUrl(buildCategoryOgSubtitle(categoryTitle));
}

export type OgImageDescriptor = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

export function buildOgImageDescriptor(
  alt: string,
  options?: {
    images?: (string | null | undefined)[];
    ogSubtitle?: string;
  }
): OgImageDescriptor {
  const url = resolveOgImageUrls(options)[0];
  return {
    url,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt,
  };
}

/** ogSubtitle 우선 → images → 기본 OG (학원 상단 사진은 OG에 사용하지 않음) */
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
  return [getDefaultOgImageUrl()];
}

export function buildOgImageMetadata(
  title: string,
  options?: {
    images?: (string | null | undefined)[];
    ogSubtitle?: string;
  }
): OgImageDescriptor[] {
  const alt = options?.ogSubtitle
    ? `${title} | ${options.ogSubtitle}`
    : title;
  return [buildOgImageDescriptor(alt, options)];
}
