-- ============================================================
-- 🔄 [FIX_RECURSION] 무한 재귀 및 권한 문제 원천 해결
-- 1. 하드코딩된 이메일 제거 (순수 DB 역할 기반 인증)
-- 2. 무한 재귀(Infinite Recursion)를 유발하는 잘못된 RLS 정책 전면 교체
-- 3. children, user_profiles, family_relationships 정책 최적화
-- ============================================================

-- 1. 안전을 위해 RLS 잠시 비활성화 (재귀 끊기)
ALTER TABLE public.children DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_relationships DISABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 싹 다 제거 (충돌/중복/재귀 원인 제거)
DROP POLICY IF EXISTS "p_children_parent_read" ON public.children;
DROP POLICY IF EXISTS "p_children_admin_all" ON public.children;
DROP POLICY IF EXISTS "p_children_read" ON public.children;
DROP POLICY IF EXISTS "p_children_write" ON public.children;

DROP POLICY IF EXISTS "p_profiles_read_all" ON public.user_profiles;
DROP POLICY IF EXISTS "p_profiles_update_admin_self" ON public.user_profiles;
DROP POLICY IF EXISTS "p_user_profiles_read" ON public.user_profiles;
DROP POLICY IF EXISTS "p_user_profiles_update" ON public.user_profiles;

DROP POLICY IF EXISTS "p_fr_read_self" ON public.family_relationships;
DROP POLICY IF EXISTS "p_fr_all_admin" ON public.family_relationships;

-- 3. is_admin 함수 재정의 (하드코딩 제거 + DB 기반)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- RLS 우회하여 내부 쿼리 실행
AS $$
BEGIN
    -- 서비스 롤 우회
    IF (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role') = 'service_role' THEN
        RETURN true;
    END IF;

    -- 순수하게 user_profiles 테이블의 role만 확인
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin')
    );
END;
$$;

-- 권한 다시 확실하게 부여
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_therapist() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_parent_of(UUID) TO authenticated;


-- 4. 정책 재설정 (깔끔하고 재귀 없는 버전)

-- [A] User Profiles (가장 중요: 읽기가 허용되어야 is_admin이 재귀 없이 작동함)
CREATE POLICY "base_profiles_read" ON public.user_profiles
    FOR SELECT USING (true); -- 누구나 프로필 기본 조회 가능 (이름 등 표시 필요)

CREATE POLICY "base_profiles_update" ON public.user_profiles
    FOR UPDATE USING (
        auth.uid() = id -- 본인
        OR
        public.is_admin() -- 관리자
    );

-- [B] Family Relationships
CREATE POLICY "base_fr_read" ON public.family_relationships
    FOR SELECT USING (
        parent_id = auth.uid() OR public.is_admin()
    );

CREATE POLICY "base_fr_write" ON public.family_relationships
    FOR INSERT WITH CHECK (
        parent_id = auth.uid() OR public.is_admin()
    );

-- [C] Children (무한 재귀의 원흉 해결)
-- 주의: children 테이블 정책 내에서 children 테이블을 다시 조회하는 함수(is_parent_of 등)를 쓰면 안됨!
-- family_relationships 테이블을 조회하는 것은 괜찮음 (Cross-table check)

CREATE POLICY "base_children_select" ON public.children
    FOR SELECT USING (
        -- 1. 관리자 or 서비스롤
        public.is_admin()
        OR
        -- 2. 직접 부모 (Legacy)
        parent_id = auth.uid()
        OR
        -- 3. 연결된 부모 (Modern - RLS Loop 없음, 다른 테이블 조회)
        EXISTS (
            SELECT 1 FROM public.family_relationships fr
            WHERE fr.child_id = children.id
            AND fr.parent_id = auth.uid()
        )
    );

CREATE POLICY "base_children_all_other" ON public.children
    FOR ALL USING (
        public.is_admin() 
        OR 
        parent_id = auth.uid() -- 생성/수정/삭제 권한
    );


-- 5. RLS 다시 활성화
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_relationships ENABLE ROW LEVEL SECURITY;

SELECT '✅ 무한 재귀 해결 및 권한 정상화 완료 (하드코딩 제거됨)' AS result;
