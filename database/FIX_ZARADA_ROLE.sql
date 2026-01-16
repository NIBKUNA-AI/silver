-- 👑 FIX ZARADA ROLE
-- Description: zaradajoo@gmail.com 계정을 강제로 'admin'으로 승격시킵니다.
-- UI에서 등록 시 therapist로 잘못 들어간 데이터를 보정합니다.

-- 1. user_profiles 테이블 수정 (메인 권한)
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'zaradajoo@gmail.com';

-- 2. therapist 테이블 수정 (직원 명단)
UPDATE public.therapists
SET system_role = 'admin'
WHERE email = 'zaradajoo@gmail.com';

-- 결과 확인
SELECT email, role FROM public.user_profiles WHERE email = 'zaradajoo@gmail.com';
