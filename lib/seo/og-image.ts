import { absoluteUrl } from "@/lib/site/config";
import {
  ACADEMY_OG_SUBTITLE,
  buildCategoryOgSubtitle,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
} from "@/lib/seo/og-image-shared";

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

/** CDN 사진 + 키워드 오버레이 OG (지역 SEO 웹문서형) */
export function buildRegionalPhotoOgImageUrl(input: {
  backgroundUrl: string;
  title: string;
  badge: string;
  line2: string;
  bar: string;
}): string {
  const params = new URLSearchParams({
    mode: "photo",
    bg: input.backgroundUrl,
    title: input.title.slice(0, 48),
    badge: input.badge.slice(0, 40),
    line2: input.line2.slice(0, 40),
    bar: input.bar.slice(0, 60),
  });
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
  const isPhotoHero = url.includes("/api/og?") && url.includes("mode=photo");
  return {
    url,
    width: isPhotoHero ? 1200 : OG_IMAGE_WIDTH,
    height: isPhotoHero ? 1200 : OG_IMAGE_HEIGHT,
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
