import type { RegionalServiceCategory } from "@/lib/seo/regional-service-config";
import { getRegionalServiceConfig } from "@/lib/seo/regional-service-config";

/** 화이트파크 GuideHeroThumb 스타일 — 상단·OG 공통 카피 */
export function resolveRegionalHeroThumbCopy(input: {
  keyword: string;
  category: RegionalServiceCategory;
}): {
  badge: string;
  line1: string;
  line2: string;
  bar: string;
} {
  const keyword = input.keyword.trim() || "지역 정보";
  const config = getRegionalServiceConfig(input.category);
  const line2ByCategory: Record<RegionalServiceCategory, string> = {
    academy: "어디가 좋을까?",
    adoption: "어디서 분양받을까?",
    shelter: "어떻게 해야 할까?",
    funeral: "어떻게 준비할까?",
    breeder: "어디를 볼까?",
    hospital: "어디가 좋을까?",
  };

  return {
    badge: "반려동물포털 유아독존",
    line1: keyword,
    line2: line2ByCategory[input.category],
    bar: `${config.title} · 비교·상담 가이드`,
  };
}
