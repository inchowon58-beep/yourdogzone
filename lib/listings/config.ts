import type { ListingCategory } from "@/lib/types/listing";

export type ListingFieldConfig = {
  key: "service_info" | "extra_info" | "extra_info_2";
  label: string;
  placeholder: string;
  step: number;
};

export type ListingCategoryConfig = {
  id: ListingCategory;
  title: string;
  singular: string;
  description: string;
  listTitle: string;
  premiumLabel: string;
  defaultTitleSuffix: string;
  naverSearchHint: string;
  fields: ListingFieldConfig[];
  seoKeywords: string[];
};

export const LISTING_CATEGORIES: ListingCategory[] = [
  "adoption",
  "shelter",
  "funeral",
  "breeder",
  "hospital",
];

export const LISTING_CATEGORY_CONFIG: Record<
  ListingCategory,
  ListingCategoryConfig
> = {
  adoption: {
    id: "adoption",
    title: "강아지분양",
    singular: "분양 업체",
    description: "윤리적 강아지 분양 정보 및 전국 분양 업체 검색",
    listTitle: "전국 강아지분양 업체",
    premiumLabel: "인증 추천 분양",
    defaultTitleSuffix: "강아지분양",
    naverSearchHint: "강아지분양",
    fields: [
      {
        key: "service_info",
        label: "분양 안내 · 견종 정보",
        placeholder: "분양 가능 견종, 건강 검진, 사육 환경 등",
        step: 2,
      },
      {
        key: "extra_info",
        label: "분양 가격대",
        placeholder: "견종·연령별 분양 가격 범위",
        step: 2,
      },
      {
        key: "extra_info_2",
        label: "입양·분양 절차",
        placeholder: "상담 → 방문 → 계약 → 인도 절차",
        step: 2,
      },
    ],
    seoKeywords: ["강아지분양", "강아지 입양", "견종 분양"],
  },
  shelter: {
    id: "shelter",
    title: "강아지보호소",
    singular: "보호소",
    description: "유기견·구조견 보호소 정보 — 지역별 보호소 검색",
    listTitle: "전국 강아지보호소",
    premiumLabel: "인증 추천 보호소",
    defaultTitleSuffix: "강아지보호소",
    naverSearchHint: "강아지보호소",
    fields: [
      {
        key: "service_info",
        label: "보호소 소개",
        placeholder: "보호 중인 유기견 현황, 보호 정책",
        step: 2,
      },
      {
        key: "extra_info",
        label: "운영 시간 · 입양 가능 안내",
        placeholder: "방문·입양 상담 가능 시간",
        step: 2,
      },
      {
        key: "extra_info_2",
        label: "입양 절차",
        placeholder: "입양 신청 → 면접 → 계약 절차",
        step: 2,
      },
    ],
    seoKeywords: ["강아지보호소", "유기견", "구조견 입양"],
  },
  funeral: {
    id: "funeral",
    title: "강아지장례식장",
    singular: "장례식장",
    description: "반려견 장례식장 정보 및 예약 안내",
    listTitle: "전국 강아지장례식장",
    premiumLabel: "인증 추천 장례식장",
    defaultTitleSuffix: "강아지장례식장",
    naverSearchHint: "강아지장례식장",
    fields: [
      {
        key: "service_info",
        label: "장례 서비스 안내",
        placeholder: "화장, 추모, 운구 등 제공 서비스",
        step: 2,
      },
      {
        key: "extra_info",
        label: "패키지 · 요금 안내",
        placeholder: "기본·프리미엄 패키지 가격",
        step: 2,
      },
      {
        key: "extra_info_2",
        label: "운영 시간 · 예약 방법",
        placeholder: "24시간 응대 여부, 예약 절차",
        step: 2,
      },
    ],
    seoKeywords: ["강아지장례", "반려견 장례식장", "펫 장례"],
  },
  breeder: {
    id: "breeder",
    title: "브리더정보",
    singular: "브리더",
    description: "인증 브리더 리스트 및 견종별 브리더 정보",
    listTitle: "전국 브리더",
    premiumLabel: "인증 추천 브리더",
    defaultTitleSuffix: "브리더",
    naverSearchHint: "애견브리더",
    fields: [
      {
        key: "service_info",
        label: "브리더 소개 · 전문 견종",
        placeholder: "전문 견종, 사육 환경, 경력",
        step: 2,
      },
      {
        key: "extra_info",
        label: "인증 · 등록 정보",
        placeholder: "동물생산업 신고, 협회 등록 등",
        step: 2,
      },
      {
        key: "extra_info_2",
        label: "분양 조건",
        placeholder: "분양 가격, 계약 조건, 건강 보증",
        step: 2,
      },
    ],
    seoKeywords: ["브리더", "견종 브리더", "강아지 브리더"],
  },
  hospital: {
    id: "hospital",
    title: "동물병원",
    singular: "동물병원",
    description: "지역별 동물병원 조회 — 진료과목·응급 정보",
    listTitle: "전국 동물병원",
    premiumLabel: "인증 추천 병원",
    defaultTitleSuffix: "동물병원",
    naverSearchHint: "동물병원",
    fields: [
      {
        key: "service_info",
        label: "진료 과목",
        placeholder: "내과, 외과, 치과, 미용, 입원 등",
        step: 2,
      },
      {
        key: "extra_info",
        label: "운영 시간",
        placeholder: "평일·주말·공휴일 진료 시간",
        step: 2,
      },
      {
        key: "extra_info_2",
        label: "응급 · 특이사항",
        placeholder: "24시 응급 여부, 야간 진료, 주차 등",
        step: 2,
      },
    ],
    seoKeywords: ["동물병원", "24시 동물병원", "반려동물 병원"],
  },
};

export function isListingCategory(value: string): value is ListingCategory {
  return LISTING_CATEGORIES.includes(value as ListingCategory);
}

export function getListingConfig(category: ListingCategory): ListingCategoryConfig {
  return LISTING_CATEGORY_CONFIG[category];
}

export function listingBasePath(category: ListingCategory): string {
  return `/services/${category}`;
}

export function listingDetailPath(category: ListingCategory, slug: string): string {
  return `/services/${category}/${slug}`;
}
