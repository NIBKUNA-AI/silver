-- Function: admin_delete_user
-- Description: Allows Super Admin to delete ANY user account completely.
-- Security: SECURITY DEFINER

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

  -- 3. Clear References (FK constraints)
  UPDATE public.payments SET created_by = NULL WHERE created_by = target_user_id;
  UPDATE public.schedules SET created_by = NULL WHERE created_by = target_user_id;
  UPDATE public.leads SET assigned_to = NULL WHERE assigned_to = target_user_id;

  -- 4. Delete App Data
  DELETE FROM public.family_relationships WHERE parent_id = target_user_id;
  DELETE FROM public.therapists WHERE id = target_user_id;
  DELETE FROM public.user_profiles WHERE id = target_user_id;
  
  -- 5. Delete Storage Objects
  BEGIN
    DELETE FROM storage.objects WHERE owner = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Storage delete failed: %', SQLERRM;
  END;

  -- 6. Delete Auth Sessions & User
  DELETE FROM auth.sessions WHERE user_id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_delete_user TO authenticated;
