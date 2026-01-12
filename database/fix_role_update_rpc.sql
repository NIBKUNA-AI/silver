-- ============================================================
-- 🚨 관리자 권한 수정 강제 적용 함수 (RPC)
-- RLS 정책 때문에 update가 막히는 문제를 우회하기 위해 
-- SECURITY DEFINER 함수를 사용하여 권한을 강제로 변경합니다.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_user_role_safe(
  target_user_id UUID,
  new_role TEXT,
  new_status TEXT
)
RETURNS JSONB AS $$
DECLARE
  caller_role TEXT;
  result JSONB;
BEGIN
  -- 1. 호출자가 관리자(admin/super_admin)인지 확인
  SELECT role INTO caller_role
  FROM public.user_profiles
  WHERE id = auth.uid();

  IF caller_role NOT IN ('admin', 'super_admin') THEN
    RETURN jsonb_build_object('success', false, 'message', '권한이 없습니다.');
  END IF;

  -- 2. 대상 유저 업데이트
  UPDATE public.user_profiles
  SET role = new_role, status = new_status, updated_at = now()
  WHERE id = target_user_id;

  -- 3. 결과 반환
  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'message', '권한이 변경되었습니다.');
  ELSE
    -- 대상이 없으면 만들어주기 (upsert 효과)
    -- 하지만 이메일 정보가 없어서 여기서는 생략하고 에러 리턴
    RETURN jsonb_build_object('success', false, 'message', '대상 프로필을 찾을 수 없습니다.');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.update_user_role_safe TO authenticated;
