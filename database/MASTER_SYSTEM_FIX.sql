-- ============================================================
-- 🛠️ [MASTER_SYSTEM_FIX] 통합 시스템 리팩토링 SQL
-- 1. 인증/권한: is_admin, is_therapist 보안 함수 재정의 (SECURITY DEFINER)
-- 2. RLS 정책: 무한 재귀 방지 및 관리자 우회 권한 보장
-- 3. 데이터 무결성: upsert RPC 및 트리거 개선
-- ============================================================

-- [1] 보안 함수 재정의 (Infinite Recursion 방지 핵심)
-- SECURITY DEFINER를 사용하여 함수 내부에서는 테이블 소유자 권한으로 실행 (RLS 우회)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Service Role (Supabase Admin) 항상 허용
    IF (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role') = 'service_role' THEN
        RETURN true;
    END IF;

    -- 순수 DB 역할 조회 (하드코딩 제거됨)
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin')
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_therapist()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Service Role (Supabase Admin) 항상 허용
    IF (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role') = 'service_role' THEN
        RETURN true;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('therapist', 'super_admin', 'admin')
    );
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_therapist() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_parent_of(UUID) TO authenticated;

-- [2] RLS 정책 전면 재설정 (Clean Slate)

-- 2.1 user_profiles (단일 진실 공급원)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_profiles_base_read" ON public.user_profiles;
DROP POLICY IF EXISTS "p_profiles_base_update" ON public.user_profiles;

CREATE POLICY "p_profiles_base_read" ON public.user_profiles
    FOR SELECT USING (true); -- 누구나 읽기 가능 (이름 표시 등 필수)

CREATE POLICY "p_profiles_base_update" ON public.user_profiles
    FOR UPDATE USING (
        auth.uid() = id OR public.is_admin() -- 본인 또는 관리자
    );

-- 2.2 children (가장 복잡한 테이블 - 재귀 방지)
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_children_admin_all" ON public.children;
DROP POLICY IF EXISTS "p_children_access" ON public.children;

CREATE POLICY "p_children_admin_all" ON public.children
    FOR ALL USING ( public.is_admin() ); -- 관리자 프리패스

CREATE POLICY "p_children_access" ON public.children
    FOR SELECT USING (
        -- 직접 부모 (Legacy)
        parent_id = auth.uid()
        OR
        -- 연결된 부모 (family_relationships 조회 - user_profiles 안 거침 -> 재귀 없음)
        EXISTS (
            SELECT 1 FROM public.family_relationships fr
            WHERE fr.child_id = children.id
            AND fr.parent_id = auth.uid()
        )
    );

-- 2.3 family_relationships
ALTER TABLE public.family_relationships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_fr_access" ON public.family_relationships;

CREATE POLICY "p_fr_access" ON public.family_relationships
    FOR ALL USING (
        parent_id = auth.uid() OR public.is_admin()
    );

-- 2.4 counseling_logs (직원/관리자 전용)
ALTER TABLE public.counseling_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_logs_admin_all" ON public.counseling_logs;
DROP POLICY IF EXISTS "p_logs_therapist_access" ON public.counseling_logs;
DROP POLICY IF EXISTS "p_logs_parent_read" ON public.counseling_logs;

CREATE POLICY "p_logs_admin_all" ON public.counseling_logs
    FOR ALL USING ( public.is_admin() );

CREATE POLICY "p_logs_therapist_access" ON public.counseling_logs
    FOR ALL USING (
        therapist_id = auth.uid() -- 본인이 작성한 로그
    );

CREATE POLICY "p_logs_parent_read" ON public.counseling_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.children c
            WHERE c.id = counseling_logs.child_id
            AND (c.parent_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.family_relationships fr WHERE fr.child_id = c.id AND fr.parent_id = auth.uid()
            ))
        )
    );

-- 2.5 development_assessments (발달 평가)
ALTER TABLE public.development_assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_assess_admin_all" ON public.development_assessments;
DROP POLICY IF EXISTS "p_assess_therapist_access" ON public.development_assessments;
DROP POLICY IF EXISTS "p_assess_parent_read" ON public.development_assessments;

CREATE POLICY "p_assess_admin_all" ON public.development_assessments
    FOR ALL USING ( public.is_admin() );

CREATE POLICY "p_assess_therapist_access" ON public.development_assessments
    FOR ALL USING (
        therapist_id = auth.uid()
    );

CREATE POLICY "p_assess_parent_read" ON public.development_assessments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.children c
            WHERE c.id = development_assessments.child_id
            AND (c.parent_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.family_relationships fr WHERE fr.child_id = c.id AND fr.parent_id = auth.uid()
            ))
        )
    );


-- [3] Upsert 지원 RPC (Integrity Fix)
-- 직원 정보 업데이트 시 충돌 방지
CREATE OR REPLACE FUNCTION public.update_user_role_safe(
    target_user_id UUID,
    new_role TEXT,
    new_status TEXT,
    user_email TEXT,
    user_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. 관리자 권한 체크
    IF NOT public.is_admin() THEN
        RETURN jsonb_build_object('success', false, 'message', '관리자 권한이 없습니다.');
    END IF;

    -- 2. user_profiles 업데이트 (Upsert)
    INSERT INTO public.user_profiles (id, email, name, role, status, updated_at)
    VALUES (target_user_id, user_email, user_name, new_role, new_status, NOW())
    ON CONFLICT (id) DO UPDATE
    SET role = EXCLUDED.role,
        status = EXCLUDED.status,
        name = COALESCE(EXCLUDED.name, user_profiles.name), -- 이름은 기존 유지 우선
        updated_at = NOW();

    -- 3. therapists 테이블 동기화 (Upsert)
    IF new_role IN ('therapist', 'admin', 'super_admin') THEN
        INSERT INTO public.therapists (user_id, name, email, specialty, status)
        VALUES (target_user_id, user_name, user_email, '일반 치료사', new_status)
        ON CONFLICT (user_id) DO UPDATE
        SET status = EXCLUDED.status;
    END IF;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_role_safe(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

SELECT '✅ MASTER_SYSTEM_FIX 적용 완료: 리팩토링 및 무결성 확보' AS result;
