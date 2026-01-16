-- 🛡️ FIX RLS UPDATE POLICY (관리자의 수정 권한 추가)
-- Description: 관리자가 직원의 상태(status)를 'retired'로 변경하려고 할 때,
-- "내 정보만 수정 가능" 정책에 막혀서 에러가 발생했습니다.
-- 관리자 등급은 "타인의 정보도 수정할 수 있는" 권한을 추가합니다.

-- 1. 기존 수정 정책 확인 (내꺼만 수정 가능)
-- DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles; -- 이건 유지

-- 2. [신규] 관리자/치료사 등 스탭은 모든 프로필 수정 가능
DROP POLICY IF EXISTS "Staff can update all profiles" ON public.user_profiles;

CREATE POLICY "Staff can update all profiles"
ON public.user_profiles FOR UPDATE
USING (
  -- 안전한 함수를 사용하여 무한 루프 없이 권한 확인
  public.get_my_role() IN ('admin', 'super_admin', 'therapist')
);

-- 결과 확인
SELECT 'RLS Update Policy Added' as status;
