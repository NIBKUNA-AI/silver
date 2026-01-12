-- 슈퍼 어드민(anukbin@gmail.com) 제외 모든 계정 삭제
-- ⚠️ 주의: 이 스크립트는 되돌릴 수 없습니다!

-- 0. admin_notifications 테이블 먼저 삭제 (외래 키 제약)
DELETE FROM public.admin_notifications
WHERE user_id NOT IN (SELECT id FROM public.user_profiles WHERE email = 'anukbin@gmail.com');

-- 1. therapists 테이블에서 슈퍼 어드민 제외 삭제
DELETE FROM public.therapists
WHERE email != 'anukbin@gmail.com' OR email IS NULL;

-- 2. user_profiles 테이블에서 슈퍼 어드민 제외 삭제
DELETE FROM public.user_profiles
WHERE email != 'anukbin@gmail.com' OR email IS NULL;

-- 3. Auth 유저는 Supabase Dashboard > Authentication > Users에서 수동 삭제 필요
-- (또는 Service Role Key를 사용한 Admin API 호출)

-- 확인용 조회
SELECT * FROM public.user_profiles;
SELECT * FROM public.therapists;
