-- 🏗️ [ZARADA SAAS] DATABASE HARDENING v2.1 (VIEW ERROR FIX)
-- 🚨 관리자(anukbin@gmail.com)는 어떠한 정책도 우회하도록 설계됨.

-- [0] 슈퍼 어드민 체크 함수 (필수)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (auth.jwt() ->> 'email') = 'anukbin@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- [1] User Profiles 보안 설정 (VIEW 에러 회피 로직)
DO $$ 
DECLARE
    is_table BOOLEAN;
BEGIN
    -- user_profiles가 일반 테이블('r')인지 확인
    SELECT (relkind = 'r') INTO is_table FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE n.nspname = 'public' AND c.relname = 'user_profiles';

    IF is_table THEN
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "profiles_master_access" ON public.user_profiles;
        CREATE POLICY "profiles_master_access" ON public.user_profiles FOR ALL TO authenticated
        USING (public.is_super_admin() OR id = auth.uid());
    ELSE
        RAISE NOTICE 'user_profiles is a VIEW or other object. Skipping RLS set directly on it.';
    END IF;
END $$;

-- [2] Admin Settings 보안 강화 (테넌트 격리)
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_isolation" ON public.admin_settings;
CREATE POLICY "settings_isolation" ON public.admin_settings FOR ALL TO authenticated
USING (
    public.is_super_admin() OR 
    center_id = (SELECT center_id FROM public.user_profiles WHERE id = auth.uid())
)
WITH CHECK (
    public.is_super_admin() OR 
    center_id = (SELECT center_id FROM public.user_profiles WHERE id = auth.uid())
);

-- [3] Centers 보안 강화 (활성 지점만 공개)
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "centers_isolation" ON public.centers;
CREATE POLICY "centers_isolation" ON public.centers FOR SELECT TO anon, authenticated
USING (is_active = true OR public.is_super_admin());

-- ✅ 수정 완료 메시지
DO $$ BEGIN RAISE NOTICE '🏆 Hardening v2.1 적용 완료. 관리자 권한은 안전하게 보존되었습니다.'; END $$;
