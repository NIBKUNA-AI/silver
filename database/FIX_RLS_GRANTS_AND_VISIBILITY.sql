-- ============================================================
-- 🛡️ [FIX_RLS_GRANTS] RLS 함수 권한 및 관리자 조회 정책 보강
-- 1. is_admin, is_therapist 등 보안 함수의 실행 권한(GRANT) 부여
-- 2. user_profiles RLS 정책이 is_admin() 내부 호출을 막지 않도록 수정
-- 3. children 테이블의 관리자 조회 정책 확실하게 재정의
-- ============================================================

-- 1. 함수 실행 권한 부여 (필수)
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_therapist() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_parent_of(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.connect_child_with_code(UUID, TEXT) TO authenticated;

-- RAISE NOTICE는 DO 블록 밖에서 사용할 수 없으므로 SELECT로 대체
SELECT '✅ RLS Helper 함수 실행 권한(GRANT) 부여 완료' AS log;

-- 2. children 테이블 RLS 재확인
-- 관리자는 무조건 모든 데이터를 볼 수 있어야 함

DROP POLICY IF EXISTS "p_children_admin_all" ON public.children;

CREATE POLICY "p_children_admin_all" ON public.children
    FOR ALL USING (
        public.is_admin() 
        OR 
        auth.role() = 'service_role' -- 서비스 롤 허용
    );

SELECT '✅ children 테이블 관리자 정책(p_children_admin_all) 재설정 완료' AS log;


-- 3. user_profiles RLS 점검
-- is_admin() 함수가 내부적으로 user_profiles를 조회하므로,
-- 무한 재귀를 막기 위해 is_admin()은 이미 SECURITY DEFINER로 선언되어 있음.
-- 하지만 일반 쿼리에서도 관리자가 '다른 사람의 프로필'을 볼 수 있어야 함.

DROP POLICY IF EXISTS "p_profiles_read_all" ON public.user_profiles;

-- (1) 읽기는 누구나 가능 (이름 등을 표시해야 하므로)
CREATE POLICY "p_profiles_read_all" ON public.user_profiles
    FOR SELECT USING (true);

-- (2) 수정: 본인 OR 관리자
DROP POLICY IF EXISTS "p_profiles_update_admin_self" ON public.user_profiles;
CREATE POLICY "p_profiles_update_admin_self" ON public.user_profiles
    FOR UPDATE USING (
        auth.uid() = id 
        OR 
        EXISTS ( SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin') )
    );

SELECT '✅ user_profiles 정책 재설정 완료' AS log;

-- 4. family_relationships 관리자 접근 확인
DROP POLICY IF EXISTS "p_fr_all_admin" ON public.family_relationships;
CREATE POLICY "p_fr_all_admin" ON public.family_relationships
    FOR ALL USING (
        EXISTS ( SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin') )
    );

SELECT '✅ [FIX COMPLETED] 관리자 권한 조회 문제 해결됨' AS result;
