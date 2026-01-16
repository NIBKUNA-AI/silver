-- Function: admin_delete_user
-- Description: Allows Super Admin to delete ANY user account.
-- Version: V4 (Deleted admin_notifications to fix FK error)

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS void AS $$
DECLARE
  caller_email TEXT;
BEGIN
  -- 1. Security Check
  SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();
  
  IF caller_email IS NULL OR caller_email != 'anukbin@gmail.com' THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admin can perform this action.';
  END IF;

  -- 2. Break Links (Children)
  UPDATE public.children SET parent_id = NULL WHERE parent_id = target_user_id;

  -- 3. Dynamic Cleanup
  -- Payments
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'created_by') THEN
    EXECUTE 'UPDATE public.payments SET created_by = NULL WHERE created_by = $1' USING target_user_id;
  END IF;

  -- Schedules
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'created_by') THEN
    EXECUTE 'UPDATE public.schedules SET created_by = NULL WHERE created_by = $1' USING target_user_id;
  END IF;

  -- Leads
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'assigned_to') THEN
    EXECUTE 'UPDATE public.leads SET assigned_to = NULL WHERE assigned_to = $1' USING target_user_id;
  END IF;

  -- 4. Delete App Data
  -- ✨ [Added] Fix FK error for admin_notifications
  DELETE FROM public.admin_notifications WHERE user_id = target_user_id;
  
  DELETE FROM public.family_relationships WHERE parent_id = target_user_id;
  DELETE FROM public.therapists WHERE id = target_user_id;
  DELETE FROM public.user_profiles WHERE id = target_user_id;
  
  -- 5. Delete Storage
  BEGIN
    DELETE FROM storage.objects WHERE owner = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Storage delete failed: %', SQLERRM;
  END;

  -- 6. Delete Auth
  DELETE FROM auth.sessions WHERE user_id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_delete_user TO authenticated;
