-- Function: delete_own_account
-- Description: Allows a user to delete their own account completely (Hard Delete).
-- Security: SECURITY DEFINER (Runs with permissions of the creator, usually superuser/postgres).

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

  -- 3. Delete App Data (Cascading usually handles this, but explicit is safer)
  DELETE FROM public.family_relationships WHERE parent_id = target_user_id;
  DELETE FROM public.user_profiles WHERE id = target_user_id;
  DELETE FROM public.therapists WHERE id = target_user_id;
  DELETE FROM public.consultation_inquiries WHERE author_id = target_user_id;
  
  -- 4. Delete Storage Objects (Crucial: FK often blocks auth deletion)
  -- We attempt to delete any files owned by the user
  BEGIN
    DELETE FROM storage.objects WHERE owner = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore storage errors if storage schema doesn't exist or permission denied, 
    -- but log it. storage is standard in Supabase.
    RAISE WARNING 'Could not delete storage objects: %', SQLERRM;
  END;

  -- 5. Delete Auth User (The Core Action)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  -- Note: If this fails, the transaction rolls back, and the client will receive the error.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure authenticated users can call it
GRANT EXECUTE ON FUNCTION public.delete_own_account TO authenticated;
