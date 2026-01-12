-- ============================================================
-- 직원 권한 수정 문제 해결
-- 1. user_profiles UPDATE 권한 열기
-- 2. 관리자가 다른 사용자의 role을 수정할 수 있게 허용
-- ============================================================

-- 1. 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Allow update for self" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow update for admin" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_self" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_super_admin_all" ON public.user_profiles;

-- 2. 새 RLS 정책: 본인 수정 허용
CREATE POLICY "user_profiles_update_self" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 3. 새 RLS 정책: 관리자는 모든 사용자 수정 가능
CREATE POLICY "user_profiles_admin_update_all" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 4. 관리자 INSERT 권한 (upsert 용)
DROP POLICY IF EXISTS "user_profiles_admin_insert" ON public.user_profiles;
CREATE POLICY "user_profiles_admin_insert" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    -- 본인이거나 관리자인 경우 허용
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 5. therapists 테이블도 관리자 수정 허용
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "therapists_admin_all" ON public.therapists;
CREATE POLICY "therapists_admin_all" ON public.therapists
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 6. 치료사 본인도 자기 정보 읽기 가능
DROP POLICY IF EXISTS "therapists_read_self" ON public.therapists;
CREATE POLICY "therapists_read_self" ON public.therapists
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR true); -- 일단 전체 읽기 허용

SELECT '✅ 권한 수정 RLS 정책 업데이트 완료' AS result;
