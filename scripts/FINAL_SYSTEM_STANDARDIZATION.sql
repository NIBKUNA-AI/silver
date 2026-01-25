-- 🏗️ [ZARADA SAAS] FINAL SYSTEM STANDARDIZATION & INFRASTRUCTURE REPAIR
-- Description: 1. 마케팅 트래픽 분석(site_visits) 테이블 구축
--              2. 매출 분석(payments) 테이블 구축
--              3. 상담 문의(consultations) RLS 개방 및 컬럼 정규화
--              4. 알림 시스템 및 시스템 함수 무결성 검증

-- 1. 마케팅 트래픽 분석 (site_visits)
CREATE TABLE IF NOT EXISTS public.site_visits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id uuid REFERENCES public.centers(id),
    source_category text, -- 'Naver', 'Google', 'Direct' 등
    utm_source text,
    utm_medium text,
    utm_campaign text,
    page_url text,
    referrer_url text,
    user_agent text,
    visited_at timestamptz DEFAULT now()
);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "site_visits_public_insert" ON public.site_visits;
DROP POLICY IF EXISTS "site_visits_staff_read" ON public.site_visits;

CREATE POLICY "site_visits_public_insert" ON public.site_visits FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "site_visits_staff_read" ON public.site_visits FOR SELECT TO authenticated USING (public.is_super_admin() OR center_id = public.get_my_center_id());


-- 2. 매출 수납 기록 (payments) - 대시보드 매출 집계용
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id uuid REFERENCES public.centers(id),
    child_id uuid REFERENCES public.children(id) ON DELETE CASCADE,
    amount integer NOT NULL DEFAULT 0,
    paid_at timestamptz DEFAULT now(),
    payment_method text, -- 'card', 'bank', 'cash'
    status text DEFAULT 'completed',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_staff_all" ON public.payments;
CREATE POLICY "payments_staff_all" ON public.payments FOR ALL TO authenticated USING (public.is_super_admin() OR center_id = public.get_my_center_id());


-- 3. 상담 문의 (consultations) 테이블 보강 및 RLS 개방
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id);
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS marketing_source text;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS inflow_source text;

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "consultations_public_insert" ON public.consultations;
DROP POLICY IF EXISTS "consultations_staff_manage" ON public.consultations;

CREATE POLICY "consultations_public_insert" ON public.consultations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "consultations_staff_manage" ON public.consultations FOR ALL TO authenticated USING (public.is_super_admin() OR center_id = public.get_my_center_id());


-- 4. 알림 시스템 (admin_notifications)
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id uuid REFERENCES public.centers(id),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    message text,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_notifications_owner_all" ON public.admin_notifications;
CREATE POLICY "admin_notifications_owner_all" ON public.admin_notifications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- 5. 시스템 유지보수 함수
CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_center_id() RETURNS UUID AS $$
BEGIN
  RETURN (SELECT center_id FROM public.profiles WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ✅ 인프라 구축 완료
DO $$ BEGIN RAISE NOTICE '🏆 Zarada SaaS Full Infrastructure Standardization Complete. Marketing, Payments, and Consultations are now SaaS-ready.'; END $$;
