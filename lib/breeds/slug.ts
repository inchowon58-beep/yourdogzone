import { generateUniqueSlug } from "@/lib/slug/unique-id";

/** 견종 상세 URL slug — 영문 접두사 + 숫자 ID (한글명 미사용) */
export function generateBreedSlug(): string {
  return generateUniqueSlug("breed");
}

export function breedPageUrl(slug: string): string {
  return `https://www.yourdogzone.co.kr/dognose/${slug}`;
}
