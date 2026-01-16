-- Function: delete_own_account
-- Description: Allows a user to delete their own account completely (Hard Delete).
-- Security: SECURITY DEFINER (Runs with permissions of the creator).

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

  -- 2. Break Links (Children) - Keep child data, unlink parent
  UPDATE public.children 
  SET parent_id = NULL 
  WHERE parent_id = target_user_id;
  
  -- 3. Clear References in other tables (handling FK constraints)
  -- Set created_by/assigned_to fields to NULL instead of deleting records
  UPDATE public.payments SET created_by = NULL WHERE created_by = target_user_id;
  UPDATE public.schedules SET created_by = NULL WHERE created_by = target_user_id;
  UPDATE public.leads SET assigned_to = NULL WHERE assigned_to = target_user_id;
  
  -- 4. Delete App Data
  DELETE FROM public.family_relationships WHERE parent_id = target_user_id;
  DELETE FROM public.therapists WHERE id = target_user_id;
  
  -- Note: We removed 'consultation_inquiries' deletion as the table does not exist.
  -- Consultations are linked to children usually, or handled by other constraints.
  
  -- Delete Profile (This is the main record)
  DELETE FROM public.user_profiles WHERE id = target_user_id;

  -- 5. Delete Storage Objects
  BEGIN
    DELETE FROM storage.objects WHERE owner = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Could not delete storage objects: %', SQLERRM;
  END;

  -- 6. Delete Auth User (The Core Action)
  DELETE FROM auth.users WHERE id = target_user_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure authenticated users can call it
GRANT EXECUTE ON FUNCTION public.delete_own_account TO authenticated;
