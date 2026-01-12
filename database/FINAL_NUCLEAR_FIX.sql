-- ============================================================
-- ☢️ [FINAL_NUCLEAR_FIX] RLS 정책 완전 초기화 및 재설정
-- 기존에 이름이 달라서 삭제되지 않은 '유령 정책'들이 재귀를 유발하고 있습니다.
-- 이 스크립트는 테이블에 붙은 "모든" 정책을 강제로 찾아내어 지우고 다시 만듭니다.
-- ============================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- [1] User Profiles의 모든 정책 삭제
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.user_profiles';
    END LOOP;

    -- [2] Children의 모든 정책 삭제 (재귀의 원흉)
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'children') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.children';
    END LOOP;

    -- [3] Family Relationships의 모든 정책 삭제
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'family_relationships') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.family_relationships';
    END LOOP;

    -- [4] Schedules의 모든 정책 삭제
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'schedules') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.schedules';
    END LOOP;

    -- [5] Counseling Logs의 모든 정책 삭제
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'counseling_logs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.counseling_logs';
    END LOOP;

    -- [6] Development Assessments의 모든 정책 삭제
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'development_assessments') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.development_assessments';
    END LOOP;
END $$;


-- [7] 보안 함수 재정의 (SECURITY DEFINER 필수)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Service Role
    IF (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role') = 'service_role' THEN
        RETURN true;
    END IF;
    -- DB Lookup (No RLS)
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin')
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- [8] 정책 다시 입히기 (Clean Slate)

-- 8.1 User Profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_profiles_admin_update" ON public.user_profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "p_profiles_read_all" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "p_profiles_admin_all" ON public.user_profiles FOR ALL USING (public.is_admin()); 

-- 8.2 Family Relationships
ALTER TABLE public.family_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_fr_read" ON public.family_relationships FOR SELECT USING (parent_id = auth.uid() OR public.is_admin());
CREATE POLICY "p_fr_write" ON public.family_relationships FOR INSERT WITH CHECK (parent_id = auth.uid() OR public.is_admin());
CREATE POLICY "p_fr_all_admin" ON public.family_relationships FOR ALL USING (public.is_admin());

-- 8.3 Children (재귀 없는 버전)
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_children_admin_all" ON public.children FOR ALL USING (public.is_admin());
CREATE POLICY "p_children_parent_read" ON public.children FOR SELECT USING (
    parent_id = auth.uid() -- Legacy
    OR
    EXISTS (SELECT 1 FROM public.family_relationships fr WHERE fr.child_id = children.id AND fr.parent_id = auth.uid()) -- Modern
);
-- 부모는 자녀를 생성하므로 Insert 허용 (자신의 아이디로)
CREATE POLICY "p_children_parent_write" ON public.children FOR INSERT WITH CHECK (parent_id = auth.uid());
CREATE POLICY "p_children_parent_update" ON public.children FOR UPDATE USING (parent_id = auth.uid()); -- Legacy Owner

-- 8.4 Schedules (부모 조회 허용)
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_schedules_admin_all" ON public.schedules FOR ALL USING (public.is_admin());
CREATE POLICY "p_schedules_therapist" ON public.schedules FOR ALL USING (therapist_id = auth.uid());
CREATE POLICY "p_schedules_parent_read" ON public.schedules FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.children c
        LEFT JOIN public.family_relationships fr ON fr.child_id = c.id
        WHERE c.id = schedules.child_id
        AND (c.parent_id = auth.uid() OR fr.parent_id = auth.uid())
    )
);

-- 8.5 Counseling Logs
ALTER TABLE public.counseling_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_logs_admin_all" ON public.counseling_logs FOR ALL USING (public.is_admin());
CREATE POLICY "p_logs_therapist" ON public.counseling_logs FOR ALL USING (therapist_id = auth.uid());
CREATE POLICY "p_logs_parent_read" ON public.counseling_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.children c
        LEFT JOIN public.family_relationships fr ON fr.child_id = c.id
        WHERE c.id = counseling_logs.child_id
        AND (c.parent_id = auth.uid() OR fr.parent_id = auth.uid())
    )
);

-- 8.6 Development Assessments
ALTER TABLE public.development_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_assess_admin_all" ON public.development_assessments FOR ALL USING (public.is_admin());
CREATE POLICY "p_assess_therapist" ON public.development_assessments FOR ALL USING (therapist_id = auth.uid());
CREATE POLICY "p_assess_parent_read" ON public.development_assessments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.children c
        LEFT JOIN public.family_relationships fr ON fr.child_id = c.id
        WHERE c.id = development_assessments.child_id
        AND (c.parent_id = auth.uid() OR fr.parent_id = auth.uid())
    )
);

SELECT '✅ 모든 정책 초기화 후 재설정 완료 (재귀 원인 제거됨)' AS result;
