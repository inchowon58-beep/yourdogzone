import type { Academy } from "@/lib/types/academy";

/** 대표(logo) + 상세(academy_images)를 중복 없이 최대 max장 */
export function getAcademyGalleryImages(
  academy: Pick<Academy, "logo_image" | "academy_images">,
  max = 3
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  const add = (url: string | null | undefined) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    result.push(url);
  };

  add(academy.logo_image);
  for (const url of academy.academy_images ?? []) add(url);

  return result.slice(0, max);
}

/** 목록용 대표 썸네일 1장 */
export function getAcademyThumbnail(
  academy: Pick<Academy, "logo_image" | "academy_images">
): string | null {
  return academy.logo_image ?? academy.academy_images?.[0] ?? null;
}

/** 1장=대표, 2~3장=상세 이미지로 분리 */
export function splitAcademyImages(urls: string[]): {
  logo_image: string | null;
  academy_images: string[] | null;
} {
  const unique = [...new Set(urls.filter((u) => u.startsWith("http")))].slice(0, 3);
  if (unique.length === 0) {
    return { logo_image: null, academy_images: null };
  }
  return {
    logo_image: unique[0],
    academy_images: unique.length > 1 ? unique.slice(1) : null,
  };
}

export function countAcademyImages(
  logo_image: string | null,
  academy_images: string[] | null | undefined
): number {
  return getAcademyGalleryImages(
    { logo_image, academy_images: academy_images ?? null },
    3
  ).length;
}
