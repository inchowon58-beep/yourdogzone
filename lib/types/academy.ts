import type { NaverBlogReview } from "@/lib/types/listing";

export type Academy = {
  id: number;
  slug: string;
  name: string;
  region_big: string;
  region_small: string;
  title_copy: string;
  logo_image: string | null;
  academy_images: string[] | null;
  phone: string | null;
  address: string;
  curriculum: string | null;
  tuition_info: string | null;
  kakao_url: string | null;
  seo_title_suffix?: string | null;
  /** 네이버 플레이스/지도 URL */
  naver_place_url?: string | null;
  naver_rating?: number | null;
  naver_review_count?: number | null;
  naver_blog_reviews?: NaverBlogReview[] | null;
  is_premium: boolean;
  /**
   * 지역 SEO 랜딩 상단(인증 추천) 상세 설명 HTML.
   * 리스팅에서 listingAsAcademy 로 전달되거나 학원 직접 저장.
   */
  seo_detail_html?: string | null;
  /** SEO 상단 「홈페이지」 버튼 링크 */
  homepage_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type AcademyInsert = Omit<
  Academy,
  "id" | "created_at" | "updated_at" | "is_premium"
> & {
  is_premium?: boolean;
};
