export type ListingCategory =
  | "adoption"
  | "shelter"
  | "funeral"
  | "breeder"
  | "hospital";

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
};

export type ListingInsert = Omit<
  Listing,
  "id" | "created_at" | "updated_at" | "is_premium"
> & {
  is_premium?: boolean;
};
