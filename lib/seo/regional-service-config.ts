import type { ListingCategory } from "@/lib/types/listing";
import {
  LISTING_CATEGORY_CONFIG,
  LISTING_CATEGORIES,
  listingBasePath,
} from "@/lib/listings/config";

const ACADEMY_OG_SUBTITLE = "애견미용학원 정보";

function buildCategoryOgSubtitle(categoryTitle: string): string {
  const trimmed = categoryTitle.trim();
  if (!trimmed) return "정보";
  return trimmed.endsWith("정보") ? trimmed : `${trimmed} 정보`;
}

export type RegionalServiceCategory = "academy" | ListingCategory;

export const REGIONAL_SERVICE_CATEGORIES: RegionalServiceCategory[] = [
  "academy",
  ...LISTING_CATEGORIES,
];

export type RegionalServiceConfig = {
  id: RegionalServiceCategory;
  title: string;
  singular: string;
  entityLabel: string;
  premiumLabel: string;
  slugSuffix: string;
  keywordNoise: RegExp;
  defaultKeywordSuffix: string;
  seoKeywords: string[];
  ogSubtitle: string;
  basePath: string;
  registerPath: string;
  guideSectionTitle: string;
  emptyEntityMessage: string;
  listBackLabel: string;
};

const ACADEMY_CONFIG: RegionalServiceConfig = {
  id: "academy",
  title: "애견미용학원",
  singular: "학원",
  entityLabel: "학원",
  premiumLabel: "인증 추천 학원",
  slugSuffix: "dog-grooming-academy",
  keywordNoise:
    /애견미용학원|애견미용|반려견\s*미용|미용학원|미용\s*학원|반려견|강아지|학원/g,
  defaultKeywordSuffix: "애견미용학원",
  seoKeywords: [
    "애견미용학원",
    "애견미용 자격증",
    "반려견 미용 교육",
    "애견미용 수강료",
    "애견미용 국비지원",
  ],
  ogSubtitle: ACADEMY_OG_SUBTITLE,
  basePath: "/services/academy",
  registerPath: "/services/academy/register",
  guideSectionTitle: "수강 전 꼭 알아둘 정보",
  emptyEntityMessage: "등록된 애견미용학원이 없습니다",
  listBackLabel: "전국 애견미용학원",
};

const LISTING_SLUG_SUFFIX: Record<ListingCategory, string> = {
  adoption: "dog-adoption",
  shelter: "dog-shelter",
  funeral: "dog-funeral",
  breeder: "dog-breeder",
  hospital: "pet-hospital",
};

const LISTING_KEYWORD_NOISE: Record<ListingCategory, RegExp> = {
  adoption:
    /강아지분양|강아지\s*분양|견종\s*분양|입양|분양|반려견|강아지|업체/g,
  shelter:
    /강아지보호소|강아지\s*보호소|유기견|구조견|보호소|반려견|강아지/g,
  funeral:
    /강아지장례식장|강아지\s*장례식장|강아지장례|반려견\s*장례|펫\s*장례|장례식장|장례|반려견|강아지/g,
  breeder:
    /브리더정보|애견브리더|견종\s*브리더|브리더|반려견|강아지/g,
  hospital:
    /동물병원|반려동물\s*병원|24시\s*동물병원|병원|반려동물|반려견|강아지/g,
};

function buildListingConfig(category: ListingCategory): RegionalServiceConfig {
  const listing = LISTING_CATEGORY_CONFIG[category];
  const base = listingBasePath(category);
  return {
    id: category,
    title: listing.title,
    singular: listing.singular,
    entityLabel: listing.singular,
    premiumLabel: listing.premiumLabel,
    slugSuffix: LISTING_SLUG_SUFFIX[category],
    keywordNoise: LISTING_KEYWORD_NOISE[category],
    defaultKeywordSuffix: listing.defaultTitleSuffix,
    seoKeywords: listing.seoKeywords,
    ogSubtitle: buildCategoryOgSubtitle(listing.title),
    basePath: base,
    registerPath: `${base}/register`,
    guideSectionTitle: "이용 전 꼭 알아둘 정보",
    emptyEntityMessage: `등록된 ${listing.singular}이 없습니다`,
    listBackLabel: listing.listTitle,
  };
}

export const REGIONAL_SERVICE_CONFIG: Record<
  RegionalServiceCategory,
  RegionalServiceConfig
> = {
  academy: ACADEMY_CONFIG,
  adoption: buildListingConfig("adoption"),
  shelter: buildListingConfig("shelter"),
  funeral: buildListingConfig("funeral"),
  breeder: buildListingConfig("breeder"),
  hospital: buildListingConfig("hospital"),
};

export function isRegionalServiceCategory(
  value: string
): value is RegionalServiceCategory {
  return REGIONAL_SERVICE_CATEGORIES.includes(value as RegionalServiceCategory);
}

export function getRegionalServiceConfig(
  category: RegionalServiceCategory
): RegionalServiceConfig {
  return REGIONAL_SERVICE_CONFIG[category];
}

export function resolvePageCategory(
  page: { category?: RegionalServiceCategory }
): RegionalServiceCategory {
  return page.category ?? "academy";
}

export function buildRegionalLandingKeywords(
  label: string,
  category: RegionalServiceCategory
): string[] {
  const config = getRegionalServiceConfig(category);
  const suffix = config.defaultKeywordSuffix;
  return [
    `${label} ${suffix}`,
    `${label} ${config.title}`,
    `${label} ${suffix} 추천`,
    ...config.seoKeywords.map((kw) => `${label} ${kw}`),
    ...config.seoKeywords,
  ];
}

export function normalizeRegionalKeyword(
  keyword: string,
  label: string,
  category: RegionalServiceCategory
): string {
  const trimmed = keyword.trim();
  const suffix = getRegionalServiceConfig(category).defaultKeywordSuffix;
  if (trimmed.includes(suffix) || trimmed.includes(suffix.replace(/\s/g, ""))) {
    return trimmed;
  }
  return `${label} ${suffix}`;
}
