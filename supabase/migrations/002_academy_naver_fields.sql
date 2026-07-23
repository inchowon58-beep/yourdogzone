-- 학원 네이버 플레이스 평점·블로그 리뷰 (등록 시 1회 저장)
ALTER TABLE academy_list
  ADD COLUMN IF NOT EXISTS naver_place_url TEXT,
  ADD COLUMN IF NOT EXISTS naver_rating NUMERIC(3, 1),
  ADD COLUMN IF NOT EXISTS naver_review_count INTEGER,
  ADD COLUMN IF NOT EXISTS naver_blog_reviews JSONB;
