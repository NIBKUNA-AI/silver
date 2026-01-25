-- 🛠️ [FIX] Centers 테이블 권한 복구 스크립트 (v2: 충돌 방지)
-- 슈퍼 어드민이 지점을 개설(INSERT)하고 수정할 수 있도록 허용합니다.

ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;

-- 1. 기존 정책 전면 초기화 (이름 기반)
DROP POLICY IF EXISTS "Allow public select on centers" ON public.centers;
DROP POLICY IF EXISTS "centers_super_admin_all" ON public.centers;
DROP POLICY IF EXISTS "centers_insert_policy" ON public.centers;
DROP POLICY IF EXISTS "centers_select_policy" ON public.centers;
DROP POLICY IF EXISTS "centers_update_policy" ON public.centers;
DROP POLICY IF EXISTS "centers_delete_policy" ON public.centers;

-- 2. [조회] 지점 정보는 누구나 조회 가능 (공개 페이지 및 로그인을 위함)
CREATE POLICY "centers_select_policy" ON public.centers
FOR SELECT USING (true);

-- 3. [생성] 슈퍼 어드민만 새로운 지점을 개설 가능
CREATE POLICY "centers_insert_policy" ON public.centers
FOR INSERT WITH CHECK (
  public.is_super_admin()
);

-- 4. [수정] 슈퍼 어드민만 지점 정보 수정 가능
CREATE POLICY "centers_update_policy" ON public.centers
FOR UPDATE USING (
  public.is_super_admin()
);

-- 5. [삭제] 슈퍼 어드민만 지점 삭제 가능
CREATE POLICY "centers_delete_policy" ON public.centers
FOR DELETE USING (
  public.is_super_admin()
);
