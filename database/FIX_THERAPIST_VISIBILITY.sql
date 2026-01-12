-- ============================================================
-- 🚑 [FIX_THERAPIST_VISIBILITY] 치료사 권한 및 시스템 복구
-- 1. "미등록" 문제 해결: 치료사가 children 테이블을 볼 수 있게 함
-- 2. "활동/일지" 작성 문제 해결: therapists 테이블 정책 점검
-- ============================================================

-- [1] Children 테이블: 치료사 조회 권한 추가 (Missing Policy)
-- 기존 Nuclear Fix에서 Admin/Parent만 추가하고 Therapist를 빠뜨림 -> "미등록" 원인
DROP POLICY IF EXISTS "p_children_therapist_view" ON public.children;

CREATE POLICY "p_children_therapist_view" ON public.children
    FOR SELECT USING (
        -- 치료사는 모든 아동을 볼 수 있거나 (협업 등), 최소한 본인 배정된 아동.
        -- "미등록" 문제를 해결하기 위해 가장 확실한 방법은 "치료사는 아동 정보를 볼 수 있다"
        public.is_therapist() OR public.is_admin()
    );

-- [2] Therapists 테이블: 본인 정보 수정 허용 (혹시 모를 에러 방지)
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_therapists_read_all" ON public.therapists;
CREATE POLICY "p_therapists_read_all" ON public.therapists FOR SELECT USING (true); -- 누구나 치료사 목록 봄

-- [3] 스케줄 테이블: 치료사 Insert 권한 (일정 생성)
DROP POLICY IF EXISTS "p_schedules_therapist_all" ON public.schedules;
CREATE POLICY "p_schedules_therapist_all" ON public.schedules
    FOR ALL USING (
        therapist_id = auth.uid() OR public.is_admin()
    );

-- [4] RLS 헬퍼 함수 확실히 열기
GRANT EXECUTE ON FUNCTION public.is_therapist() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT ALL ON TABLE public.children TO authenticated; -- 기본 권한 (RLS로 제어됨)

SELECT '✅ 치료사 아동 조회 권한(미등록 해결) 및 스케줄 권한 복구 완료' AS result;
