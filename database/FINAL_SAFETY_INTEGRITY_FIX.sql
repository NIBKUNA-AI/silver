-- =========================================================
-- 🛡️ FINAL SAFETY & INTEGRITY FIX (Updated)
-- 1. admin_delete_user V6 (Fix Resignation Logic)
-- 2. admin_delete_center (New Feature)
-- 3. FK Constraint Safety (Logs, Payments, Schedules)
-- =========================================================

-- 1. Update admin_delete_user (V6)
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS void AS $$
DECLARE
  caller_email TEXT;
  target_email TEXT;
BEGIN
  -- Security
  SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();
  IF caller_email IS NULL OR (
     caller_email != 'anukbin@gmail.com' AND 
     NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admin can perform this action.';
  END IF;

  -- Get Email
  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;

  -- Break Links (Children)
  UPDATE public.children SET parent_id = NULL WHERE parent_id = target_user_id;

  -- Safe Cleanup (Set NULL for creator fields)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'created_by') THEN
    EXECUTE 'UPDATE public.payments SET created_by = NULL WHERE created_by = $1' USING target_user_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'created_by') THEN
    EXECUTE 'UPDATE public.schedules SET created_by = NULL WHERE created_by = $1' USING target_user_id;
  END IF;

  -- Delete User Specific Data
  DELETE FROM public.admin_notifications WHERE user_id = target_user_id;
  DELETE FROM public.family_relationships WHERE parent_id = target_user_id;
  
  -- ✨ [IMPORTANT] Unlink Therapist Profile, but DO NOT DELETE record
  UPDATE public.therapists SET profile_id = NULL WHERE profile_id = target_user_id;
  IF target_email IS NOT NULL THEN
     UPDATE public.therapists SET profile_id = NULL WHERE email = target_email AND profile_id IS NOT NULL;
  END IF;

  -- Cleanup Auth & Profile
  DELETE FROM public.user_profiles WHERE id = target_user_id;
  DELETE FROM auth.sessions WHERE user_id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Create admin_delete_center
CREATE OR REPLACE FUNCTION public.admin_delete_center(target_center_id UUID)
RETURNS void AS $$
DECLARE
  caller_email TEXT;
BEGIN
  -- Security
  SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();
  IF caller_email IS NULL OR (
     caller_email != 'anukbin@gmail.com' AND 
     NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admin can perform this action.';
  END IF;

  -- 1. Delete Dependency Tables (Leaf Nodes)
  DELETE FROM public.counseling_logs WHERE child_id IN (SELECT id FROM public.children WHERE center_id = target_center_id);
  
  -- Delete Payments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_items') THEN
    DELETE FROM public.payment_items WHERE payment_id IN (SELECT id FROM public.payments WHERE center_id = target_center_id);
  END IF;
  DELETE FROM public.payments WHERE center_id = target_center_id;

  -- Delete Schedules
  DELETE FROM public.schedules WHERE center_id = target_center_id;

  -- Delete Children 
  DELETE FROM public.children WHERE center_id = target_center_id;

  -- Delete Programs
  DELETE FROM public.programs WHERE center_id = target_center_id;

  -- Delete Therapists 
  DELETE FROM public.therapists WHERE center_id = target_center_id;

  -- 2. Delete Users (Auth + Profiles)
  DELETE FROM auth.users 
  WHERE id IN (
      SELECT id FROM public.user_profiles 
      WHERE center_id = target_center_id 
      AND role != 'super_admin'
  );

  -- 3. Delete Center
  DELETE FROM public.centers WHERE id = target_center_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. FK Constraint Safety
DO $$
BEGIN
    -- [Logs] Therapist Delete -> Keep Logs (SET NULL)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'counseling_logs_therapist_id_fkey') THEN
        ALTER TABLE public.counseling_logs DROP CONSTRAINT counseling_logs_therapist_id_fkey;
    END IF;
    ALTER TABLE public.counseling_logs
    ADD CONSTRAINT counseling_logs_therapist_id_fkey
    FOREIGN KEY (therapist_id) REFERENCES public.therapists(id)
    ON DELETE SET NULL;

    -- [Logs] Child Delete -> Delete Logs (CASCADE)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'counseling_logs_child_id_fkey') THEN
        ALTER TABLE public.counseling_logs DROP CONSTRAINT counseling_logs_child_id_fkey;
    END IF;
    ALTER TABLE public.counseling_logs
    ADD CONSTRAINT counseling_logs_child_id_fkey
    FOREIGN KEY (child_id) REFERENCES public.children(id)
    ON DELETE CASCADE;

    -- [Payments] Child Delete -> Delete Payments (CASCADE)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payments_child_id_fkey') THEN
        ALTER TABLE public.payments DROP CONSTRAINT payments_child_id_fkey;
    END IF;
    ALTER TABLE public.payments
    ADD CONSTRAINT payments_child_id_fkey
    FOREIGN KEY (child_id) REFERENCES public.children(id)
    ON DELETE CASCADE;

    -- [Payment Items] Schedule Delete -> Keep Item but unlink (SET NULL)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payment_items_schedule_id_fkey') THEN
        ALTER TABLE public.payment_items DROP CONSTRAINT payment_items_schedule_id_fkey;
    END IF;
    ALTER TABLE public.payment_items
    ADD CONSTRAINT payment_items_schedule_id_fkey
    FOREIGN KEY (schedule_id) REFERENCES public.schedules(id)
    ON DELETE SET NULL;

END $$;
