-- 🛡️ REPAIR RLS POLICIES (Fix 403/Forbidden for Super Admin)
-- Description: 슈퍼 어드민이 모든 센터의 데이터에 접근/쓰기 가능하도록 RLS 정책을 전면 재설정합니다.
-- Usage: Supabase SQL Editor에서 전체 선택 후 실행하세요.

-- 1. 유틸리티 함수: 슈퍼 어드민 여부 확인 (재귀 호출 방지)
-- (성능 및 무한 루프 방지를 위해 SECURITY DEFINER 함수 사용 권장)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 유틸리티 함수: 현재 사용자의 센터 ID 반환
CREATE OR REPLACE FUNCTION public.get_my_center_id()
RETURNS UUID AS $$
DECLARE
  cid UUID;
BEGIN
  SELECT center_id INTO cid FROM public.user_profiles WHERE id = auth.uid();
  RETURN cid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. 테이블별 정책 적용 (기존 정책 초기화 후 재설정)

-- ==========================================
-- [Table] programs
-- ==========================================
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "programs_all_policy" ON public.programs;

CREATE POLICY "programs_select" ON public.programs
FOR SELECT USING (
  -- 1. 슈퍼 어드민은 다 봄
  public.is_super_admin() 
  -- 2. 내 센터 데이터만 봄
  OR center_id = public.get_my_center_id()
  -- 3. (옵션) 공개 프로그램 등 조건 추가 가능
);

CREATE POLICY "programs_insert" ON public.programs
FOR INSERT WITH CHECK (
  public.is_super_admin() 
  OR center_id = public.get_my_center_id()
);

CREATE POLICY "programs_update" ON public.programs
FOR UPDATE USING (
  public.is_super_admin() 
  OR center_id = public.get_my_center_id()
);

CREATE POLICY "programs_delete" ON public.programs
FOR DELETE USING (
  public.is_super_admin() 
  OR center_id = public.get_my_center_id()
);


-- ==========================================
-- [Table] schedules
-- ==========================================
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "schedules_all_policy" ON public.schedules;
DROP POLICY IF EXISTS "schedules_select" ON public.schedules;
DROP POLICY IF EXISTS "schedules_insert" ON public.schedules;
DROP POLICY IF EXISTS "schedules_update" ON public.schedules;
DROP POLICY IF EXISTS "schedules_delete" ON public.schedules;

CREATE POLICY "schedules_select" ON public.schedules FOR SELECT USING ( public.is_super_admin() OR center_id = public.get_my_center_id() );
CREATE POLICY "schedules_insert" ON public.schedules FOR INSERT WITH CHECK ( public.is_super_admin() OR center_id = public.get_my_center_id() );
CREATE POLICY "schedules_update" ON public.schedules FOR UPDATE USING ( public.is_super_admin() OR center_id = public.get_my_center_id() );
CREATE POLICY "schedules_delete" ON public.schedules FOR DELETE USING ( public.is_super_admin() OR center_id = public.get_my_center_id() );


-- ==========================================
-- [Table] children
-- ==========================================
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "children_select" ON public.children;
DROP POLICY IF EXISTS "children_insert" ON public.children;
DROP POLICY IF EXISTS "children_update" ON public.children;
DROP POLICY IF EXISTS "children_delete" ON public.children;

CREATE POLICY "children_select" ON public.children FOR SELECT USING ( public.is_super_admin() OR center_id = public.get_my_center_id() );
CREATE POLICY "children_insert" ON public.children FOR INSERT WITH CHECK ( public.is_super_admin() OR center_id = public.get_my_center_id() );
CREATE POLICY "children_update" ON public.children FOR UPDATE USING ( public.is_super_admin() OR center_id = public.get_my_center_id() );
CREATE POLICY "children_delete" ON public.children FOR DELETE USING ( public.is_super_admin() OR center_id = public.get_my_center_id() );


-- ==========================================
-- [Table] counseling_logs
-- ==========================================
ALTER TABLE public.counseling_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "logs_select" ON public.counseling_logs;
DROP POLICY IF EXISTS "logs_modify" ON public.counseling_logs;

CREATE POLICY "logs_select" ON public.counseling_logs FOR SELECT USING ( public.is_super_admin() OR center_id = public.get_my_center_id() );
CREATE POLICY "logs_insert" ON public.counseling_logs FOR INSERT WITH CHECK ( public.is_super_admin() OR center_id = public.get_my_center_id() );
CREATE POLICY "logs_update" ON public.counseling_logs FOR UPDATE USING ( public.is_super_admin() OR center_id = public.get_my_center_id() );
CREATE POLICY "logs_delete" ON public.counseling_logs FOR DELETE USING ( public.is_super_admin() OR center_id = public.get_my_center_id() );


-- ==========================================
-- [Table] consultations
-- ==========================================
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "consult_select" ON public.consultations;
DROP POLICY IF EXISTS "consult_modify" ON public.consultations;

CREATE POLICY "consult_select" ON public.consultations FOR SELECT USING ( public.is_super_admin() OR center_id = public.get_my_center_id() );
CREATE POLICY "consult_insert" ON public.consultations FOR INSERT WITH CHECK ( public.is_super_admin() OR center_id = public.get_my_center_id() );
CREATE POLICY "consult_update" ON public.consultations FOR UPDATE USING ( public.is_super_admin() OR center_id = public.get_my_center_id() );
CREATE POLICY "consult_delete" ON public.consultations FOR DELETE USING ( public.is_super_admin() OR center_id = public.get_my_center_id() );


-- ==========================================
-- [Table] user_profiles
-- ==========================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
-- 프로필은 '내 프로필'은 무조건 볼 수 있어야 함 (role 체크 등을 위해)
-- 같은 센터 사람들도 볼 수 있어야 함 (직원 목록 등)
-- 슈퍼 어드민은 다 봐야 함

DROP POLICY IF EXISTS "profiles_select" ON public.user_profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.user_profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.user_profiles;

CREATE POLICY "profiles_select" ON public.user_profiles 
FOR SELECT USING (
  auth.uid() = id -- 자기 자신
  OR public.is_super_admin() -- 슈퍼 어드민
  OR center_id = public.get_my_center_id() -- 같은 센터 동료
);

CREATE POLICY "profiles_insert" ON public.user_profiles 
FOR INSERT WITH CHECK (
  public.is_super_admin() 
  -- 일반 관리자는 '자기 센터' 소속만 생성 가능 (센터 ID 일치 강제)
  OR (center_id = public.get_my_center_id()) 
);

CREATE POLICY "profiles_update" ON public.user_profiles 
FOR UPDATE USING (
  public.is_super_admin()
  OR auth.uid() = id -- 내 정보 수정 (단, role 변경 등은 트리거로 막거나 해야 함. 일단 RLS는 허용)
  OR (center_id = public.get_my_center_id() AND EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin')))
);


-- ==========================================
-- [Table] admin_settings
-- ==========================================
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_select" ON public.admin_settings;
DROP POLICY IF EXISTS "settings_modify" ON public.admin_settings;
DROP POLICY IF EXISTS "Public can view admin settings" ON public.admin_settings;

CREATE POLICY "settings_select" ON public.admin_settings FOR SELECT USING (true); -- 설정은 보통 공개되거나 프론트에서 필터링
CREATE POLICY "settings_insert" ON public.admin_settings FOR INSERT WITH CHECK ( public.is_super_admin() OR center_id = public.get_my_center_id() );
CREATE POLICY "settings_update" ON public.admin_settings FOR UPDATE USING ( public.is_super_admin() OR center_id = public.get_my_center_id() );
CREATE POLICY "settings_delete" ON public.admin_settings FOR DELETE USING ( public.is_super_admin() OR center_id = public.get_my_center_id() );


-- ==========================================
-- [Table] blog_posts
-- ==========================================
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "blog_select" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_insert" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_update" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_delete" ON public.blog_posts;

CREATE POLICY "blog_select" ON public.blog_posts FOR SELECT USING (true);
CREATE POLICY "blog_insert" ON public.blog_posts FOR INSERT WITH CHECK ( public.is_super_admin() OR center_id = public.get_my_center_id() );
CREATE POLICY "blog_update" ON public.blog_posts FOR UPDATE USING ( public.is_super_admin() OR center_id = public.get_my_center_id() );
CREATE POLICY "blog_delete" ON public.blog_posts FOR DELETE USING ( public.is_super_admin() OR center_id = public.get_my_center_id() );


-- ==========================================
-- [Table] therapists
-- ==========================================
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "therapists_select" ON public.therapists;
DROP POLICY IF EXISTS "therapists_insert" ON public.therapists;
DROP POLICY IF EXISTS "therapists_update" ON public.therapists;
DROP POLICY IF EXISTS "therapists_delete" ON public.therapists;

CREATE POLICY "therapists_select" ON public.therapists FOR SELECT USING ( public.is_super_admin() OR center_id = public.get_my_center_id() );
CREATE POLICY "therapists_insert" ON public.therapists FOR INSERT WITH CHECK ( public.is_super_admin() OR center_id = public.get_my_center_id() );
CREATE POLICY "therapists_update" ON public.therapists FOR UPDATE USING ( public.is_super_admin() OR center_id = public.get_my_center_id() );
CREATE POLICY "therapists_delete" ON public.therapists FOR DELETE USING ( public.is_super_admin() OR center_id = public.get_my_center_id() );

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ All RLS Policies have been repaired for Super Admin and Center Isolation.';
END $$;
