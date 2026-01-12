-- 1. 슈퍼 어드민 프로필 강제 복구 (혹시 삭제되었을 경우 대비)
INSERT INTO public.user_profiles (id, email, name, role, status)
SELECT 
  id, 
  email, 
  'Admin', 
  'super_admin', 
  'active'
FROM auth.users 
WHERE email = 'anukbin@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'super_admin', status = 'active';

-- 2. 안전한 승인 함수 (RPC) 재정의
--    Security Definer를 사용하여 RLS를 우회하고 무조건 실행됨
CREATE OR REPLACE FUNCTION approve_therapist_v2(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. 프로필 업데이트
  UPDATE public.user_profiles
  SET role = 'therapist', status = 'active'
  WHERE id = target_user_id;

  -- 2. 치료사 정보 색상 업데이트 (없으면 무시됨)
  UPDATE public.therapists
  SET color = '#3b82f6'
  WHERE id = target_user_id;

  RETURN json_build_object('success', true, 'message', '승인 완료');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;
