-- ==========================================================
-- 🛡️ FINAL ROLE-BASED ACCESS CONTROL (RBAC) ENFORCEMENT (V2)
-- ==========================================================
-- Fixed: Removed 'settlements' table (does not exist).
-- Enforced strict separation as requested.
-- ==========================================================

-- 1. Helper Functions
CREATE OR REPLACE FUNCTION public.is_therapist() RETURNS boolean AS $$
SELECT EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE id = auth.uid() AND role = 'therapist'
);
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_manager() RETURNS boolean AS $$
SELECT EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE id = auth.uid() AND role IN ('manager', 'staff')
);
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Counseling Logs (Therapist Own, Admin All, Manager NONE)
ALTER TABLE public.counseling_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "p_logs_admin_all" ON public.counseling_logs;
DROP POLICY IF EXISTS "p_logs_therapist_own" ON public.counseling_logs;
DROP POLICY IF EXISTS "p_logs_manager_read" ON public.counseling_logs;

CREATE POLICY "p_logs_admin_all" ON public.counseling_logs
FOR ALL TO authenticated
USING (public.is_admin() OR public.is_super_admin());

CREATE POLICY "p_logs_therapist_own" ON public.counseling_logs
FOR ALL TO authenticated
USING (
    public.is_therapist() AND 
    therapist_id = (SELECT id FROM public.therapists WHERE profile_id = auth.uid())
);

-- 3. Schedules (Manager/Admin All, Therapist View All/Update Own)
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "p_schedule_admin_manager_all" ON public.schedules;
DROP POLICY IF EXISTS "p_schedule_therapist_view" ON public.schedules;
DROP POLICY IF EXISTS "p_schedule_therapist_update" ON public.schedules;

CREATE POLICY "p_schedule_admin_manager_all" ON public.schedules
FOR ALL TO authenticated
USING (public.is_admin() OR public.is_super_admin() OR public.is_manager());

CREATE POLICY "p_schedule_therapist_view" ON public.schedules
FOR SELECT TO authenticated
USING (
    public.is_therapist() AND 
    center_id = (SELECT center_id FROM public.user_profiles WHERE id = auth.uid())
);

CREATE POLICY "p_schedule_therapist_update" ON public.schedules
FOR UPDATE TO authenticated
USING (
    public.is_therapist() AND 
    therapist_id = (SELECT id FROM public.therapists WHERE profile_id = auth.uid())
);

-- 4. Payments (Manager/Admin Only)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_payments_access" ON public.payments;

CREATE POLICY "p_payments_access" ON public.payments
FOR ALL TO authenticated
USING (
    public.is_admin() OR public.is_super_admin() OR public.is_manager()
);

-- 5. Therapists (Admin Full, Manager/Therapist Read Only)
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_therapist_write_admin" ON public.therapists;
DROP POLICY IF EXISTS "p_therapist_read_staff" ON public.therapists;

CREATE POLICY "p_therapist_write_admin" ON public.therapists
FOR ALL TO authenticated
USING (public.is_admin() OR public.is_super_admin());

CREATE POLICY "p_therapist_read_staff" ON public.therapists
FOR SELECT TO authenticated
USING (
    (public.is_manager() OR public.is_therapist()) AND
    center_id = (SELECT center_id FROM public.user_profiles WHERE id = auth.uid())
);

-- 6. Children / Parents (Manager/Admin Full, Therapist Read Only)
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_children_access_full" ON public.children;
DROP POLICY IF EXISTS "p_children_read_therapist" ON public.children;
-- Clean up old policies
DROP POLICY IF EXISTS "p_children_access" ON public.children;
DROP POLICY IF EXISTS "p_children_modify" ON public.children;
DROP POLICY IF EXISTS "p_children_update" ON public.children;
DROP POLICY IF EXISTS "p_children_delete" ON public.children;

CREATE POLICY "p_children_access_full" ON public.children
FOR ALL TO authenticated
USING (public.is_admin() OR public.is_super_admin() OR public.is_manager());

CREATE POLICY "p_children_read_therapist" ON public.children
FOR SELECT TO authenticated
USING (
    public.is_therapist() AND
    center_id = (SELECT center_id FROM public.user_profiles WHERE id = auth.uid())
);

-- Same for Parents (user_profiles where role='parent' is implicitly public? No, strictly controlled)
-- Actually parents are 'user_profiles'.
-- We need to ensure Therapists can see Parent profiles linked to their kids?
-- Simplified: Allow Therapists to see profiles in their center.
-- The existing policy "p_user_profiles_isolation" covers center_id check.
-- We will refine it if needed, but default center isolation usually suffices for Read.

-- 7. Consultations (Leads) (Manager/Admin Only)
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_consultations_access" ON public.consultations;

CREATE POLICY "p_consultations_access" ON public.consultations
FOR ALL TO authenticated
USING (
    public.is_admin() OR public.is_super_admin() OR public.is_manager()
);

-- 8. Programs (Manager/Admin Full, Therapist Read)
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_programs_access_full" ON public.programs;
DROP POLICY IF EXISTS "p_programs_read_therapist" ON public.programs;

CREATE POLICY "p_programs_access_full" ON public.programs
FOR ALL TO authenticated
USING (public.is_admin() OR public.is_super_admin() OR public.is_manager());

CREATE POLICY "p_programs_read_therapist" ON public.programs
FOR SELECT TO authenticated
USING (
    public.is_therapist() AND
    center_id = (SELECT center_id FROM public.user_profiles WHERE id = auth.uid())
);
