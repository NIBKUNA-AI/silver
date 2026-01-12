-- ============================================================
-- Zarada ERP: 누락된 사용자 프로필 긴급 복구 (Ghost User Fix)
-- 🚨 증상: "승인하기" 눌러도 반응 없음, 계속 대기 상태로 보임
-- 원인: user_profiles 테이블에 데이터가 아예 없어서 UPDATE가 무시됨
-- 작성자: 안욱빈
-- ============================================================

-- 1. auth.users에는 있지만 user_profiles에는 없는 사용자 복구
INSERT INTO public.user_profiles (id, email, name, role, status)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'name', '복구된사용자'), 
  'therapist', -- 치료사로 복구
  'active'     -- 바로 승인 상태로
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles);

-- 2. therapists 테이블에는 있지만 user_profiles가 없는 경우도 처리
-- (이미 1번에서 처리되었겠지만 이중 안전장치)
UPDATE user_profiles
SET status = 'active', role = 'therapist'
WHERE status IS NULL OR status = 'pending';

-- 3. 확인용 쿼리 (dd 사용자가 active로 바뀌었는지 확인)
SELECT id, email, name, role, status 
FROM user_profiles 
ORDER BY created_at DESC;
