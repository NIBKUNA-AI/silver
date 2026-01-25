-- 👑 [ZARADA SAAS] TOTAL SYSTEM REPAIR MASTER SCRIPT (v2: Fixed Table Name)
-- Description: user_profiles(VIEW) 대신 profiles(TABLE)을 타겟으로 모든 구조적 결합을 해결합니다.

-- 1. 유틸리티 함수 초기화 (보안 정의)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles -- profiles 테이블 참조
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_center_id()
RETURNS UUID AS $$
DECLARE
  cid UUID;
BEGIN
  SELECT center_id INTO cid FROM public.profiles WHERE id = auth.uid();
  RETURN cid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 모든 테이블에 center_id 컬럼 전수 추가 (있으면 무시)
DO $$
DECLARE
    t_name text;
    tables_to_fix text[] := ARRAY['children', 'therapists', 'programs', 'schedules', 'counseling_logs', 'consultations', 'admin_settings', 'blog_posts'];
BEGIN
    FOREACH t_name IN ARRAY tables_to_fix
    LOOP
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id)', t_name);
    END LOOP;
END $$;

-- 3. 유령 데이터 복구 (center_id가 NULL인 경우 첫 번째 센터로 귀속)
DO $$
DECLARE
    v_default_center_id uuid;
    t_name text;
    tables_to_fix text[] := ARRAY['children', 'therapists', 'programs', 'schedules', 'counseling_logs', 'consultations', 'admin_settings', 'blog_posts'];
BEGIN
    SELECT id INTO v_default_center_id FROM public.centers LIMIT 1;
    
    IF v_default_center_id IS NOT NULL THEN
        FOREACH t_name IN ARRAY tables_to_fix
        LOOP
            EXECUTE format('UPDATE public.%I SET center_id = %L WHERE center_id IS NULL', t_name, v_default_center_id);
        END LOOP;
    END IF;
END $$;

-- 4. [CRITICAL] Centers 테이블 RLS 전면 개방
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "centers_read_all" ON public.centers;
DROP POLICY IF EXISTS "centers_super_admin_all" ON public.centers;
DROP POLICY IF EXISTS "centers_select_policy" ON public.centers;
DROP POLICY IF EXISTS "centers_insert_policy" ON public.centers;
DROP POLICY IF EXISTS "centers_update_policy" ON public.centers;
DROP POLICY IF EXISTS "centers_delete_policy" ON public.centers;

CREATE POLICY "centers_read_all" ON public.centers FOR SELECT USING (true);
CREATE POLICY "centers_super_admin_all" ON public.centers FOR ALL 
USING (public.is_super_admin()) 
WITH CHECK (public.is_super_admin());

-- 5. 나머지 모든 테이블 RLS 통합 재설정 (SaaS + Super Admin)
-- profiles(TABLE)을 타겟으로 설정합니다.
DO $$
DECLARE
    t_name text;
    tables_to_secure text[] := ARRAY['children', 'therapists', 'programs', 'schedules', 'counseling_logs', 'consultations', 'admin_settings', 'blog_posts', 'profiles'];
BEGIN
    FOREACH t_name IN ARRAY tables_to_secure
    LOOP
        -- 기존 정책 제거
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t_name || '_all_policy', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t_name || '_select', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t_name || '_insert', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t_name || '_update', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t_name || '_delete', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t_name || '_master_policy', t_name);
        
        -- 새 통합 정책 수립
        EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (public.is_super_admin() OR center_id = public.get_my_center_id() OR id = auth.uid()) WITH CHECK (public.is_super_admin() OR center_id = public.get_my_center_id() OR id = auth.uid())', t_name || '_master_policy', t_name);
    END LOOP;
END $$;

-- 6. user_profiles(VIEW)에 대한 보안은 profiles(TABLE) 정책을 따르므로 별도 작업 불요.
-- 만약 View가 깨졌을 경우를 대비해 재생성
CREATE OR REPLACE VIEW public.user_profiles AS SELECT * FROM public.profiles;

-- ✅ 검증 완료 알림
DO $$ BEGIN RAISE NOTICE '🚀 Zarada SaaS Master Repair V2 Complete. profiles table fixed.'; END $$;
