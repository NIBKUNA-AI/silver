-- ============================================
-- 👑 SILVER CARE Master Console: 핵심 기능 (RPC) 추가
-- 🛠️ 생성: Antigravity AI
-- 📅 날짜: 2026-01-30
-- ============================================

-- [1] 지점 영구 폐쇄 (Nuclear Delete Center)
-- 지점에 연결된 모든 데이터(직원, 아동, 상담, 결제 등)를 CASCADE로 삭제합니다.
CREATE OR REPLACE FUNCTION public.admin_delete_center(target_center_id UUID)
RETURNS void AS $$
DECLARE
    caller_role TEXT;
BEGIN
    -- 1. 권한 체크 (Super Admin만 가능)
    SELECT role INTO caller_role FROM public.user_profiles WHERE id = auth.uid();
    
    IF caller_role != 'super_admin' THEN
        RAISE EXCEPTION 'Access Denied: Only Super Admin can purge centers.';
    END IF;

    -- 2. 연관 데이터 수동 정리 (CASCADE가 안 되는 것들 위주)
    -- Storage 파일은 수동으로 지워야 하지만, DB 레코드는 CASCADE로 해결
    
    -- 3. Center 삭제 (연결된 테이블들은 ON DELETE CASCADE 설정이 되어 있어야 함)
    -- 만약 CASCADE가 안 되어 있다면 여기서 수동으로 DELETE 실행
    DELETE FROM public.schedules WHERE center_id = target_center_id;
    DELETE FROM public.therapists WHERE center_id = target_center_id;
    DELETE FROM public.children WHERE center_id = target_center_id;
    DELETE FROM public.user_profiles WHERE center_id = target_center_id AND role != 'super_admin';
    
    -- 최종적으로 센터 삭제
    DELETE FROM public.centers WHERE id = target_center_id;

    RAISE NOTICE 'Center % and all linked data completely purged.', target_center_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [2] 사용자 삭제 (Kill User RPC)
-- 기존 migrations에 있었지만, 다시 한 번 확실히 정의합니다.
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS void AS $$
DECLARE
    caller_role TEXT;
BEGIN
    SELECT role INTO caller_role FROM public.user_profiles WHERE id = auth.uid();
    IF caller_role != 'super_admin' AND caller_role != 'admin' THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    -- Cleanup
    DELETE FROM public.user_profiles WHERE id = target_user_id;
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [3] 슈퍼 어드민 여부 확인 함수 (프론트/RLS용)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [4] 현재 사용자의 센터 ID 가져오기
CREATE OR REPLACE FUNCTION public.get_my_center_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT center_id FROM public.user_profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.admin_delete_center TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_center_id TO authenticated;

SELECT '✅ Master Console RPCs established.' as result;
