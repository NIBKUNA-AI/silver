-- 🚨 FIX RLS RECURSION (무한 루프 문제 해결)
-- Description: user_profiles 테이블 안에서 권한을 확인하려고 하면,
-- "내 권한 확인 -> 테이블 조회 -> 또 권한 확인 -> 또 테이블 조회..." 무한 루프가 발생하여 500 에러가 뜹니다.
-- 이를 해결하기 위해 "보안 우회 함수(Security Definer)"를 만들어 권한 체크를 안전하게 수행합니다.

-- 1. [Helper Function] 내 역할(Role) 안전하게 가져오기
-- SECURITY DEFINER: 이 함수는 호출자가 누구든 상관없이 '작성자(Superuser)'의 권한으로 실행됩니다. (RLS 우회)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
DECLARE
  my_role text;
BEGIN
  SELECT role INTO my_role FROM public.user_profiles WHERE id = auth.uid();
  RETURN my_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 정책 수정: 재귀 호출을 제거하고 함수 사용
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.user_profiles;

CREATE POLICY "Staff can view all profiles"
ON public.user_profiles FOR SELECT
USING (
  -- 테이블을 직접 조회하는 대신, 위에서 만든 안전한 함수를 사용
  public.get_my_role() IN ('admin', 'super_admin', 'therapist')
);

-- 결과 확인
SELECT 'RLS Recursion Fixed' as status;
