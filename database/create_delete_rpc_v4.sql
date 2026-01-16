-- Function: delete_own_account
-- Description: Allows a user to delete their own account completely.
-- Version: V4 (Dynamic SQL for schema compatibility)

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- 1. Get current user ID
  target_user_id := auth.uid();
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Break Links (Children)
  UPDATE public.children 
  SET parent_id = NULL 
  WHERE parent_id = target_user_id;
  
  -- 3. Dynamic Cleanup: Safe update only if columns exist
  -- Check and update 'payments.created_by'
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'created_by') THEN
    EXECUTE 'UPDATE public.payments SET created_by = NULL WHERE created_by = $1' USING target_user_id;
  END IF;

  -- Check and update 'schedules.created_by'
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'created_by') THEN
    EXECUTE 'UPDATE public.schedules SET created_by = NULL WHERE created_by = $1' USING target_user_id;
  END IF;

  -- Check and update 'leads.assigned_to'
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'assigned_to') THEN
    EXECUTE 'UPDATE public.leads SET assigned_to = NULL WHERE assigned_to = $1' USING target_user_id;
  END IF;
  
  -- 4. Delete App Data (Standard Tables)
  DELETE FROM public.family_relationships WHERE parent_id = target_user_id;
  DELETE FROM public.therapists WHERE id = target_user_id;
  DELETE FROM public.user_profiles WHERE id = target_user_id;

  -- 5. Delete Storage Objects
  BEGIN
    DELETE FROM storage.objects WHERE owner = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Storage delete failed: %', SQLERRM;
  END;

  -- 6. Delete Auth User
  DELETE FROM auth.users WHERE id = target_user_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.delete_own_account TO authenticated;
