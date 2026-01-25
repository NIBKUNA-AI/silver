-- 1. Create 'jamsil' center
INSERT INTO public.centers (name, slug, address, phone, email, is_active)
VALUES (
    '자라다 잠실점',
    'jamsil',
    '서울 송파구 올림픽로 35길 123',
    '02-1234-5678',
    'jamsil@zarada.kr',
    true
)
ON CONFLICT (slug) DO NOTHING;

-- Retrieve Center ID
DO $$
DECLARE
    v_center_id uuid;
    v_user_id uuid;
BEGIN
    SELECT id INTO v_center_id FROM public.centers WHERE slug = 'jamsil';

    -- 2. Create/Update Admin User (Linked to Auth User if exists, or placeholder)
    -- WARNING: Inserting into auth.users is restricted. 
    -- Assuming a user already exists or we create a profile for an existing auth user.
    -- For testing, we often use the current signed-in user's ID.
    -- HERE, we will just ensure a profile exists for a specific email if you provide one.
    -- OR, we just let the frontend signup create it.
    
    -- Let's just create a dummy blog post to verify 'jamsil' page loads data.
    INSERT INTO public.blog_posts (
        center_id, slug, title, content, is_published, published_at, seo_title, seo_description
    ) VALUES (
        v_center_id,
        'hello-jamsil',
        '잠실점에 오신 것을 환영합니다',
        '자라다 잠실점이 새롭게 오픈했습니다. 많은 관심 부탁드립니다.',
        true,
        now(),
        '잠실점 오픈 안내',
        '자라다 잠실점의 새로운 소식을 전해드립니다.'
    );

    -- Create Admin Settings for Jamsil
    INSERT INTO public.admin_settings (center_id, key, value) 
    VALUES 
        (v_center_id, 'site_title', '자라다 잠실점 공식 홈페이지'),
        (v_center_id, 'center_name', '자라다 잠실점'),
        (v_center_id, 'main_banner_url', 'https://images.unsplash.com/photo-1606092195730-5d7b9af1ef4d?auto=format&fit=crop&q=80&w=2000'),
        (v_center_id, 'notice_text', '🎉 잠실점 신규 오픈 기념 무료 상담 이벤트 진행 중!'),
        (v_center_id, 'theme_primary_color', '#4F46E5')
    ON CONFLICT (center_id, key) DO UPDATE SET value = EXCLUDED.value;

END $$;
