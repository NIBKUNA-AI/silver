-- ============================================================
-- 👁️ [FINAL_VISIBILITY_FIX] 테이블 권한 및 조회 강제 복구
-- 1. authenticated 역할에 대한 테이블 기본 권한(SELECT, INSERT...) 재부여
-- 2. is_admin 함수 로직 안전장치 추가 (서비스 롤 우회 등)
-- 3. children 테이블 정책 최종 점검
-- ============================================================

-- 1. 기본 테이블 권한 부여 (RLS보다 상위 개념, 이게 없으면 아예 접근 불가)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

SELECT '✅ 기본 테이블/함수 권한(GRANT) 전체 부여 완료' AS log;

-- 2. 관리자 조회 함수(is_admin) 안전장치 강화
-- 혹시 user_profiles 조회가 실패하더라도 에러가 나지 않도록 처리
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
    v_email TEXT;
BEGIN
    -- 1. 서비스 롤(Supabase Admin)이면 무조건 True
    IF (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role') = 'service_role' THEN
        RETURN true;
    END IF;

    -- 2. DB 역할 조회
    SELECT role, email INTO v_role, v_email
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    -- 3. 특정 이메일 강제 허용 (안전장치: zaradajoo@gmail.com)
    IF v_email = 'zaradajoo@gmail.com' THEN
        RETURN true;
    END IF;

    RETURN v_role IN ('super_admin', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

SELECT '✅ is_admin 함수 안전장치(이메일 하드코딩 백업) 적용 완료' AS log;

-- 3. children 테이블 정책 최종 확인 (단순화)
DROP POLICY IF EXISTS "p_children_admin_all" ON public.children;

CREATE POLICY "p_children_admin_all" ON public.children
    FOR ALL USING (
        public.is_admin()  -- 위에서 정의한 안전한 함수 사용
    );

SELECT '✅ children 테이블 관리자 정책 최종 적용 완료' AS log;

-- 4. (추가) zaradajoo@gmail.com 계정 확실하게 super_admin으로 지정
UPDATE public.user_profiles
SET role = 'super_admin'
WHERE email = 'zaradajoo@gmail.com';

SELECT '✅ zaradajoo@gmail.com 권한 재확인(Super Admin)' AS log;
