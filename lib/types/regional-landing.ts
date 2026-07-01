/** 지역 애견미용학원 SEO 랜딩 페이지 (관리자에서 키워드로 자동 생성) */
export type RegionalSeoBlockStored = {
  title: string;
  paragraphs: string[];
  bullets: string[];
};

export type RegionalFaqItemStored = {
  question: string;
  answer: string;
};

export type RegionalLandingPage = {
  /** 영문 URL 슬러그 (예: ansan-dog-grooming-academy) */
  slug: string;
  /** 화면·SEO 지역명 (예: 안산) */
  label: string;
  /** 등록 키워드 (예: 안산 애견미용학원) */
  keyword: string;
  /** 시·도 필터 */
  regionBig?: string;
  /** 학원 검색 query */
  query?: string;
  /** 해당 지역 소개 (네이버 SEO용) */
  regionInfo?: string;
  /** 근방 지역 소개 문구 */
  nearbyIntro?: string;
  /** 근방 지역 슬러그 (최대 5, 영문 slug) */
  nearbySlugs: string[];
  /** 근방 구·동 5곳 (SEO 노출용, 광역 단위 아님) */
  nearbyAreas?: string[];
  /** 인근 지하철역 5곳 (SEO 노출용) */
  nearbyStations?: string[];
  /** Gemini 생성 SEO 본문 (A안 — 지역 내 인증추천 있을 때) */
  seoBlocks?: RegionalSeoBlockStored[];
  /** B안 — 해당 지역 인증추천 없음·인근 학원 안내 */
  seoBlocksNearby?: RegionalSeoBlockStored[];
  /** Gemini 생성 FAQ (A안) */
  faqItems?: RegionalFaqItemStored[];
  /** B안 FAQ */
  faqItemsNearby?: RegionalFaqItemStored[];
  /** Gemini 생성 메타 설명 (A안) */
  metaDescription?: string;
  /** B안 메타 설명 */
  metaDescriptionNearby?: string;
  /** B안 히어로 소개 */
  regionInfoNearby?: string;
  /** @deprecated 렌더 시 변수 치환으로 처리 — 더 이상 slug 변경 시 재생성하지 않음 */
  seoBoundAcademySlug?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RegionalLandingInsert = Omit<
  RegionalLandingPage,
  "createdAt" | "updatedAt"
> & {
  createdAt?: string;
  updatedAt?: string;
};
