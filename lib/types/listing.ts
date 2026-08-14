export type ListingCategory =
  | "adoption"
  | "shelter"
  | "funeral"
  | "breeder"
  | "hospital";

/** 등록 시 1회 수집 · 상세에서는 저장된 값만 표시 (런타임 스크래핑 없음) */
export type NaverBlogReview = {
  title: string;
  body: string;
  url?: string | null;
};

export type Listing = {
  id: number;
  slug: string;
  category: ListingCategory;
  name: string;
  region_big: string;
  region_small: string;
  title_copy: string;
  logo_image: string | null;
  gallery_images: string[] | null;
  phone: string | null;
  address: string;
  kakao_url: string | null;
  /** 네이버 플레이스/지도 URL (있으면 상세에서 바로가기) */
  naver_place_url?: string | null;
  /** 네이버 방문자리뷰 평점 (1~5) */
  naver_rating?: number | null;
  /** 네이버 방문자리뷰 수 */
  naver_review_count?: number | null;
  /** 네이버 블로그 리뷰 미리보기 (최대 5) */
  naver_blog_reviews?: NaverBlogReview[] | null;
  seo_title_suffix?: string | null;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
  /** 카테고리별 주요 안내 (교육과정·진료과목·분양안내 등) */
  service_info: string | null;
  /** 카테고리별 부가 정보 (수강료·가격·운영시간 등) */
  extra_info: string | null;
  /** 카테고리별 추가 정보 (입양절차·응급여부 등) */
  extra_info_2: string | null;
  /**
   * 지역 SEO 랜딩 상단(인증 추천)에 노출할 상세 설명.
   * HTML 또는 일반 텍스트(저장 시 문단 변환).
   */
  seo_detail_html?: string | null;
};

export type ListingInsert = Omit<
  Listing,
  "id" | "created_at" | "updated_at" | "is_premium"
> & {
  is_premium?: boolean;
};
