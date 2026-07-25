import type { RegionalServiceCategory } from "@/lib/seo/regional-service-config";
import { getRegionalServiceConfig } from "@/lib/seo/regional-service-config";

/** 키워드·카테고리에 맞는 상단 부제 (화이트파크형) */
const LINE2_BY_CATEGORY: Record<RegionalServiceCategory, string[]> = {
  academy: [
    "어디가 좋을까?",
    "어디서 알아볼까?",
    "어느 곳을 알아볼까?",
    "어디를 고를까?",
  ],
  adoption: [
    "어디서 분양받을까?",
    "어디가 좋을까?",
    "어느 곳을 볼까?",
    "어디서 알아볼까?",
  ],
  shelter: [
    "어디서 알아볼까?",
    "어느 곳을 알아볼까?",
    "어디가 좋을까?",
    "어디를 알아볼까?",
  ],
  funeral: [
    "어디서 알아볼까?",
    "어느 곳을 알아볼까?",
    "어디가 좋을까?",
    "어디를 준비할까?",
  ],
  breeder: [
    "어디서 알아볼까?",
    "어디가 좋을까?",
    "어느 곳을 볼까?",
    "어디를 알아볼까?",
  ],
  hospital: [
    "어디가 좋을까?",
    "어디서 알아볼까?",
    "어느 곳을 알아볼까?",
    "어디를 고를까?",
  ],
};

/** 키워드에 특정 표현이 있으면 더 맞는 풀로 보정 */
function poolForKeyword(
  keyword: string,
  category: RegionalServiceCategory
): string[] {
  const kw = keyword.replace(/\s+/g, "");
  if (/분양|입양|애견샵/.test(kw)) return LINE2_BY_CATEGORY.adoption;
  if (/보호소|파양|유기/.test(kw)) return LINE2_BY_CATEGORY.shelter;
  if (/장례/.test(kw)) return LINE2_BY_CATEGORY.funeral;
  if (/학원|미용/.test(kw)) return LINE2_BY_CATEGORY.academy;
  if (/병원/.test(kw)) return LINE2_BY_CATEGORY.hospital;
  if (/브리더/.test(kw)) return LINE2_BY_CATEGORY.breeder;
  return LINE2_BY_CATEGORY[category];
}

function hashSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** 화이트파크 GuideHeroThumb 스타일 — 상단·OG 공통 카피 */
export function resolveRegionalHeroThumbCopy(input: {
  keyword: string;
  category: RegionalServiceCategory;
  /** 페이지마다 다른 부제를 위해 slug 등 추가 시드 */
  seedKey?: string;
}): {
  badge: string;
  line1: string;
  line2: string;
  bar: string;
} {
  const keyword = input.keyword.trim() || "지역 정보";
  const config = getRegionalServiceConfig(input.category);
  const pool = poolForKeyword(keyword, input.category);
  const seed = hashSeed(`${input.seedKey || ""}|${keyword}|${input.category}`);
  const line2 = pool[seed % pool.length];

  return {
    badge: "반려동물포털 유아독존",
    line1: keyword,
    line2,
    bar: `${config.title} · 비교·상담 가이드`,
  };
}
