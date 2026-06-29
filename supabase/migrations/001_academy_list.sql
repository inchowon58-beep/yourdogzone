-- 애견미용학원 정보 테이블
CREATE TABLE IF NOT EXISTS academy_list (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    region_big VARCHAR(50) NOT NULL,
    region_small VARCHAR(50) NOT NULL,
    title_copy TEXT NOT NULL,
    logo_image TEXT,
    academy_images TEXT[],
    phone VARCHAR(50),
    address TEXT NOT NULL,
    curriculum TEXT,
    tuition_info TEXT,
    kakao_url TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_list_region_big ON academy_list (region_big);
CREATE INDEX IF NOT EXISTS idx_academy_list_is_premium ON academy_list (is_premium);
CREATE INDEX IF NOT EXISTS idx_academy_list_slug ON academy_list (slug);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_academy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS academy_list_updated_at ON academy_list;
CREATE TRIGGER academy_list_updated_at
    BEFORE UPDATE ON academy_list
    FOR EACH ROW
    EXECUTE FUNCTION update_academy_updated_at();

-- RLS
ALTER TABLE academy_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academy_list_public_read"
    ON academy_list FOR SELECT
    USING (true);

CREATE POLICY "academy_list_public_insert"
    ON academy_list FOR INSERT
    WITH CHECK (true);

-- Storage 버킷 (Supabase Dashboard에서도 생성 가능)
INSERT INTO storage.buckets (id, name, public)
VALUES ('academy-images', 'academy-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "academy_images_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'academy-images');

CREATE POLICY "academy_images_public_upload"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'academy-images');

-- 샘플 데이터 (선택)
INSERT INTO academy_list (
    slug, name, region_big, region_small, title_copy,
    logo_image, academy_images, phone, address,
    curriculum, tuition_info, is_premium
) VALUES
(
    'gangnam-petbeauty',
    '강남펫뷰티아카데미',
    '서울',
    '강남구',
    '강남 최고의 애견미용 자격증·취업 전문 학원',
    NULL,
    ARRAY[]::TEXT[],
    '02-1234-5678',
    '서울특별시 강남구 테헤란로 123',
    '자격증반, 취업반, 창업반, 원데이 클래스',
    '국비지원 가능 · 수강료 상담 시 10% 할인',
    TRUE
),
(
    'bundang-grooming',
    '분당그루밍스쿨',
    '경기',
    '분당구',
    '분당 애견미용 실무 중심 교육',
    NULL,
    ARRAY[]::TEXT[],
    '031-987-6543',
    '경기도 성남시 분당구 정자동 456',
    '기초반, 심화반, 창업반',
    '분할 납부 가능 · 재수강 20% 할인',
    FALSE
)
ON CONFLICT (slug) DO NOTHING;
