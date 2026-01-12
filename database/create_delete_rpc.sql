-- ============================================================
-- Zarada ERP: 사용자 완전 삭제 RPC (Hard Delete RPC)
-- 🚨 기능: 직원 삭제 시 auth.users 계정까지 완전히 제거하여 재가입 오류 방지
-- 작성자: 안욱빈
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_user_completely(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- 1. 권한 체크 (슈퍼 어드민만 가능, 혹은 본인 삭제 방지 등)
  -- (여기서는 UI에서 체크하므로 생략하지만, 안전을 위해 추가 가능)
  
  -- 2. 앱 데이터 삭제 (순서 중요: 종속성 제거)
  DELETE FROM public.therapists WHERE id = target_user_id;
  DELETE FROM public.admin_notifications WHERE user_id = target_user_id;
  DELETE FROM public.user_profiles WHERE id = target_user_id;
  
  -- 3. 인증 계정 삭제 (가장 중요)
  -- 이 구문은 Security Definer 권한으로 실행되어야 auth 스키마에 접근 가능
  DELETE FROM auth.users WHERE id = target_user_id;
  
EXCEPTION WHEN OTHERS THEN
  -- 만약 auth.users 삭제가 권한 문제로 실패할 경우 (Supabase 정책 변경 등)
  -- 이메일을 'deleted'로 변경하여 재가입이라도 가능하게 함
  UPDATE auth.users 
  SET 
    email = 'deleted_' || target_user_id || '@deleted.com',
    phone = NULL,
    encrypted_password = 'deleted',
    raw_user_meta_data = '{"deleted": true}'::jsonb
  WHERE id = target_user_id;
  
  RAISE WARNING 'User deletion failed, fell back to anonymization: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 확인 메시지
SELECT '✅ 완전 삭제 함수(delete_user_completely) 생성 완료' AS result;
