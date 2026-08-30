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
  "cafe",
  "hotel",
  "kindergarten",
  "training",
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
    singular: "분양업체",
    description: "전국 강아지분양 업체 정보를 지역·키워드로 검색하세요",
    listTitle: "전국 강아지분양",
    premiumLabel: "추천 분양업체",
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
    seoKeywords: ["강아지분양", "강아지 분양", "애견분양", "반려견분양"],
  },
  cafe: {
    id: "cafe",
    title: "애견카페",
    singular: "애견카페",
    description: "전국 애견카페 정보를 지역·키워드로 검색하세요",
    listTitle: "전국 애견카페",
    premiumLabel: "인증 추천 애견카페",
    defaultTitleSuffix: "애견카페",
    naverSearchHint: "애견카페",
    fields: [
      {
        key: "service_info",
        label: "카페 소개 · 이용 안내",
        placeholder: "입장 가능 견종·체중, 실내/야외, 메뉴 등",
        step: 2,
      },
      {
        key: "extra_info",
        label: "운영 시간 · 요금",
        placeholder: "입장료, 음료 필수 여부, 운영 시간",
        step: 2,
      },
      {
        key: "extra_info_2",
        label: "예약 · 주의사항",
        placeholder: "예약 필요 여부, 리드줄·예방접종 안내",
        step: 2,
      },
    ],
    seoKeywords: ["애견카페", "반려견 카페", "강아지 카페", "펫카페"],
  },
  hotel: {
    id: "hotel",
    title: "애견호텔",
    singular: "애견호텔",
    description: "전국 애견호텔·위탁 돌봄 정보를 지역별로 검색하세요",
    listTitle: "전국 애견호텔",
    premiumLabel: "인증 추천 애견호텔",
    defaultTitleSuffix: "애견호텔",
    naverSearchHint: "애견호텔",
    fields: [
      {
        key: "service_info",
        label: "호텔 소개 · 돌봄 환경",
        placeholder: "객실 유형, CCTV, 산책·놀이 제공 여부",
        step: 2,
      },
      {
        key: "extra_info",
        label: "요금 · 패키지",
        placeholder: "1박 요금, 장기 할인, 픽업 서비스",
        step: 2,
      },
      {
        key: "extra_info_2",
        label: "예약 · 입소 조건",
        placeholder: "예약 방법, 접종·중성화 조건",
        step: 2,
      },
    ],
    seoKeywords: ["애견호텔", "강아지호텔", "반려견 호텔", "애견위탁"],
  },
  kindergarten: {
    id: "kindergarten",
    title: "애견유치원",
    singular: "애견유치원",
    description: "전국 애견유치원·데이케어 정보를 지역별로 검색하세요",
    listTitle: "전국 애견유치원",
    premiumLabel: "인증 추천 애견유치원",
    defaultTitleSuffix: "애견유치원",
    naverSearchHint: "애견유치원",
    fields: [
      {
        key: "service_info",
        label: "유치원 소개 · 프로그램",
        placeholder: "사회화, 놀이, 배변·기본예절 프로그램",
        step: 2,
      },
      {
        key: "extra_info",
        label: "수강료 · 운영 시간",
        placeholder: "반일/종일, 월 이용료, 등하원 시간",
        step: 2,
      },
      {
        key: "extra_info_2",
        label: "등원 조건 · 주의사항",
        placeholder: "접종 요건, 체중·견종 제한, 상담 절차",
        step: 2,
      },
    ],
    seoKeywords: ["애견유치원", "강아지유치원", "반려견 데이케어", "애견데이케어"],
  },
  training: {
    id: "training",
    title: "애견훈련소",
    singular: "애견훈련소",
    description: "전국 애견훈련소·훈련사 정보를 지역별로 검색하세요",
    listTitle: "전국 애견훈련소",
    premiumLabel: "인증 추천 애견훈련소",
    defaultTitleSuffix: "애견훈련소",
    naverSearchHint: "애견훈련소",
    fields: [
      {
        key: "service_info",
        label: "훈련 프로그램 안내",
        placeholder: "기본예절, 분리불안, 공격성, 사회화 등",
        step: 2,
      },
      {
        key: "extra_info",
        label: "수강료 · 기간",
        placeholder: "개인/그룹, 기숙 훈련, 회당·패키지 요금",
        step: 2,
      },
      {
        key: "extra_info_2",
        label: "상담 · 예약 안내",
        placeholder: "상담 절차, 방문 가능 시간, 자격·경력",
        step: 2,
      },
    ],
    seoKeywords: ["애견훈련소", "강아지훈련", "반려견 훈련", "애견훈련사"],
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
