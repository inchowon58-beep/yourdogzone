import type { RegionalServiceCategory } from "@/lib/seo/regional-service-config";

/** 지역 서비스 SEO 랜딩 페이지 (관리자에서 키워드·카테고리로 자동 생성) */
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
  /** 서비스 카테고리 (미설정 시 academy) */
  category?: RegionalServiceCategory;
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
  /** Gemini 생성 SEO 본문 (소제목 3~4개) */
  seoBlocks?: RegionalSeoBlockStored[];
  /** @deprecated 단일 SEO 문서로 통합 — 신규 생성 시 미사용 */
  seoBlocksNearby?: RegionalSeoBlockStored[];
  /** Gemini 생성 FAQ */
  faqItems?: RegionalFaqItemStored[];
  /** @deprecated 단일 FAQ로 통합 */
  faqItemsNearby?: RegionalFaqItemStored[];
  /** Gemini 생성 메타 설명 (OG·네이버 스니펫) */
  metaDescription?: string;
  /** SEO 발행 시 지정한 대표 이미지 (CDN 랜덤 등) */
  imageUrl?: string;
  /**
   * 보호소/분양 SEO 레이아웃
   * - v1(기본): 기존 seoBlocks 섹션 UI (웹 발행·기존 글)
   * - v2: TrustGuide UI (로컬 SEO 도구 발행)
   */
  layoutVersion?: "v1" | "v2";
  /** 발행 출처 — 로컬 SEO 도구는 offline-seo */
  publishSource?: "web" | "offline-seo";
  /**
   * 분양 콘텐츠 양식 id (예: dog_basic, goldendoodle)
   * URL 카테고리(adoption)와 별개로 본문/UI 뼈대를 고릅니다.
   */
  formId?: string;
  /** 양식 표시명 (발행 스냅샷) */
  formLabel?: string;
  /** @deprecated */
  metaDescriptionNearby?: string;
  /** @deprecated */
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
