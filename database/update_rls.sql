-- 🛡️ [중요] 관리자(Admin)에게 모든 사용자 프로필 수정 권한 부여
-- 이 쿼리를 실행해야 "승인하기" 버튼이 정상 작동합니다.

-- 1. 기존 정책 정리 (혹시 모를 중복 방지)
DROP POLICY IF EXISTS "Enable update for admins" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for admins" ON public.user_profiles;

-- 2. 관리자(admin, super_admin)에게 UPDATE 권한 부여
CREATE POLICY "Enable update for admins"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
)
WITH CHECK (
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
);

-- 3. 관리자에게 INSERT 권한 부여 (직접 등록 시 필요)
CREATE POLICY "Enable insert for admins"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
);

-- 4. 확인용 (관리자 계정 조회)
SELECT * FROM public.user_profiles WHERE role IN ('admin', 'super_admin');
