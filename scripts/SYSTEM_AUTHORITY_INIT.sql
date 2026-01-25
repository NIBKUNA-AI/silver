-- 🏛️ [ZARADA SAAS] SYSTEM AUTHORITY REINFORCEMENT
-- Description: 슈퍼 어드민 권한 체계를 확립하고 센터 관리 정책을 영구적으로 정의합니다.

-- 1. 슈퍼 어드민 판별 함수 고도화 (SECURITY DEFINER로 실행되어 권한 우회 가능)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- 1) 프로필 테이블에서 역할 확인
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role = 'super_admin' THEN RETURN TRUE; END IF;

  -- 2) 만약 프로필에 없다면 auth.users의 메타데이터에서 백업 확인
  IF (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' THEN RETURN TRUE; END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Centers 테이블 RLS 정책 전면 재수립
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;

-- 기존의 모든 불완전한 정책 삭제
DROP POLICY IF EXISTS "centers_read_all" ON public.centers;
DROP POLICY IF EXISTS "centers_super_admin_all" ON public.centers;
DROP POLICY IF EXISTS "centers_select_policy" ON public.centers;
DROP POLICY IF EXISTS "centers_insert_policy" ON public.centers;
DROP POLICY IF EXISTS "centers_update_policy" ON public.centers;
DROP POLICY IF EXISTS "centers_delete_policy" ON public.centers;
DROP POLICY IF EXISTS "centers_allow_insert_for_authenticated" ON public.centers;
DROP POLICY IF EXISTS "centers_super_admin_modify" ON public.centers;

-- [정책 1] 모든 인증된 사용자는 센터 정보를 조회할 수 있음 (SaaS 운영 필수)
CREATE POLICY "centers_select_authenticated" 
ON public.centers FOR SELECT 
TO authenticated 
USING (true);

-- [정책 2] 슈퍼 어드민은 모든 작업(생성, 수정, 삭제)에 대해 무제한 권한을 가짐
CREATE POLICY "centers_master_full_access" 
ON public.centers FOR ALL 
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- 3. 마스터 계정 권한 동기화 (영구 적용)
DO $$
DECLARE
  target_emails TEXT[] := ARRAY['anukbin@gmail.com', 'zaradajoo@gmail.com'];
  e TEXT;
  u_id UUID;
BEGIN
  FOREACH e IN ARRAY target_emails
  LOOP
    SELECT id INTO u_id FROM auth.users WHERE email = e;
    
    IF u_id IS NOT NULL THEN
      -- profiles 테이블 동기화
      INSERT INTO public.profiles (id, email, name, role, status)
      VALUES (
        u_id, 
        e, 
        COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = u_id), '마스터 관리자'),
        'super_admin',
        'active'
      )
      ON CONFLICT (id) DO UPDATE SET role = 'super_admin', status = 'active';

      -- auth.users 메타데이터 동기화
      UPDATE auth.users 
      SET raw_user_meta_data = raw_user_meta_data || '{"role": "super_admin"}'::jsonb
      WHERE id = u_id;
    END IF;
  END LOOP;
END $$;
