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
  created_at: string;
  updated_at: string;
};

export type AcademyInsert = Omit<
  Academy,
  "id" | "created_at" | "updated_at" | "is_premium"
> & {
  is_premium?: boolean;
};
