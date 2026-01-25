-- 1. 유예 없이 데이터 비우기 (TRUNCATE)
-- CASCADE를 사용하여 의존성 있는 테이블 데이터도 함께 삭제
TRUNCATE TABLE public.centers CASCADE;
TRUNCATE TABLE public.profiles CASCADE;
-- blog_posts, admin_settings 등은 centers에 FK가 없으면 CASCADE로 안 지워질 수 있으므로 명시적 TRUNCATE
TRUNCATE TABLE public.blog_posts CASCADE;
TRUNCATE TABLE public.admin_settings CASCADE;
TRUNCATE TABLE public.counseling_logs CASCADE;
TRUNCATE TABLE public.consultations CASCADE;
TRUNCATE TABLE public.schedules CASCADE;
TRUNCATE TABLE public.leads CASCADE;

-- 2. 스키마 변경 (ALTER)

-- Centers 테이블: slug 및 is_active 추가
ALTER TABLE public.centers 
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Blog Posts 테이블: center_id 추가
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id);

-- Admin Settings 테이블: center_id 추가 및 PK 변경 준비
-- (기존 PK가 key 하나였다면, 이제 (center_id, key)가 되어야 함)
ALTER TABLE public.admin_settings 
ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id);

-- admin_settings의 PK 재설정 (데이터가 비어있으므로 안전)
ALTER TABLE public.admin_settings DROP CONSTRAINT IF EXISTS admin_settings_pkey;
ALTER TABLE public.admin_settings ADD PRIMARY KEY (center_id, key);

-- Counseling Logs 테이블: center_id 추가
ALTER TABLE public.counseling_logs 
ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id);

-- 3. RLS 정책 업데이트 (기본적인 SaaS 격리 정책 적용)

-- Centers: Slug로 조회 허용
DROP POLICY IF EXISTS "Allow public select on centers" ON public.centers;
CREATE POLICY "Allow public select on centers" ON public.centers FOR SELECT USING (true);

-- Blog Posts: center_id 일치 시 조회
DROP POLICY IF EXISTS "Public can view published blog posts" ON public.blog_posts;
CREATE POLICY "Public can view published blog posts" ON public.blog_posts FOR SELECT USING (is_published = true);
-- (실제 필터링은 쿼리 레벨에서 수행하지만, RLS도 뚫어둠)

-- Admin Settings: Public read (쿼리에서 center_id 필터 필수)
DROP POLICY IF EXISTS "Public can view admin settings" ON public.admin_settings;
CREATE POLICY "Public can view admin settings" ON public.admin_settings FOR SELECT USING (true);
