-- 🛡️ [ZARADA SAAS] SECURITY REINFORCEMENT & MISSING TABLES FIX
-- Description: 1. 미비된 테이블(family_relationships, parent_observations, development_assessments) 생성
--              2. 상담 일지 및 평가 데이터에 대한 부모 격리 RLS 강화

-- ==========================================
-- 1. 누락된 시스템 테이블 생성 (UI 연동 필수)
-- ==========================================

-- 1) 가족 관계 테이블 (부모-아동 N:N 연결)
CREATE TABLE IF NOT EXISTS public.family_relationships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id uuid REFERENCES public.centers(id),
    parent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id uuid REFERENCES public.children(id) ON DELETE CASCADE,
    relationship text, -- 'father', 'mother', 'guardian' 등
    created_at timestamptz DEFAULT now(),
    UNIQUE(parent_id, child_id)
);

-- 2) 부모 관찰 일기 테이블
CREATE TABLE IF NOT EXISTS public.parent_observations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id uuid REFERENCES public.centers(id),
    parent_id uuid REFERENCES auth.users(id),
    child_id uuid REFERENCES public.children(id),
    content text NOT NULL,
    observation_date date DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now()
);

-- 3) 발달 평가 테이블 (성장 그래프 데이터)
CREATE TABLE IF NOT EXISTS public.development_assessments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id uuid REFERENCES public.centers(id),
    child_id uuid REFERENCES public.children(id) ON DELETE CASCADE,
    therapist_id uuid REFERENCES auth.users(id),
    schedule_id uuid REFERENCES public.schedules(id),
    score_communication integer DEFAULT 0,
    score_social integer DEFAULT 0,
    score_cognitive integer DEFAULT 0,
    score_motor integer DEFAULT 0,
    score_adaptive integer DEFAULT 0,
    evaluation_content text,
    summary text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- 2. 민감 데이터 RLS 보안 강화 (부모 격리)
-- ==========================================

-- 1) 상담 일지 (counseling_logs) 보호
ALTER TABLE public.counseling_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "counseling_logs_parent_select" ON public.counseling_logs;
DROP POLICY IF EXISTS "counseling_logs_staff_all" ON public.counseling_logs;
DROP POLICY IF EXISTS "counseling_logs_master_policy" ON public.counseling_logs;

-- [부모] 자신이 연결된 자녀의 일지만 조회 가능
CREATE POLICY "counseling_logs_parent_select" ON public.counseling_logs
FOR SELECT TO authenticated
USING (
  child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid()) OR 
  child_id IN (SELECT child_id FROM public.family_relationships WHERE parent_id = auth.uid())
);

-- [직원] 해당 센터 데이터만 관리
CREATE POLICY "counseling_logs_staff_all" ON public.counseling_logs
FOR ALL TO authenticated
USING (public.is_super_admin() OR center_id = public.get_my_center_id())
WITH CHECK (public.is_super_admin() OR center_id = public.get_my_center_id());


-- 2) 발달 평가 (development_assessments) 보호
ALTER TABLE public.development_assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "development_assessments_parent_select" ON public.development_assessments;
DROP POLICY IF EXISTS "development_assessments_staff_all" ON public.development_assessments;

-- [부모] 본인 자녀 평가서만 조회
CREATE POLICY "development_assessments_parent_select" ON public.development_assessments
FOR SELECT TO authenticated
USING (
  child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid()) OR 
  child_id IN (SELECT child_id FROM public.family_relationships WHERE parent_id = auth.uid())
);

-- [직원] 해당 센터 관리
CREATE POLICY "development_assessments_staff_all" ON public.development_assessments
FOR ALL TO authenticated
USING (public.is_super_admin() OR center_id = public.get_my_center_id())
WITH CHECK (public.is_super_admin() OR center_id = public.get_my_center_id());


-- 3) 부모 관찰 일기 (parent_observations) 보호
ALTER TABLE public.parent_observations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parent_observations_own" ON public.parent_observations;
DROP POLICY IF EXISTS "parent_observations_staff_read" ON public.parent_observations;

-- [부모] 본인이 쓴 것만 관리
CREATE POLICY "parent_observations_own" ON public.parent_observations
FOR ALL TO authenticated
USING (parent_id = auth.uid())
WITH CHECK (parent_id = auth.uid());

-- [직원] 케어 목적으로 조회 허용
CREATE POLICY "parent_observations_staff_read" ON public.parent_observations
FOR SELECT TO authenticated
USING (public.is_super_admin() OR center_id = public.get_my_center_id());

-- ✅ 모든 설정 완료
DO $$ BEGIN RAISE NOTICE '� Security reinforcement applied. Missing relations (family_relationships, observations, assessments) created.'; END $$;
