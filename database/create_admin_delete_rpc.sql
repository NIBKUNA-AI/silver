-- Function: admin_delete_user
-- Description: Allows Super Admin to delete ANY user account completely.
-- Security: SECURITY DEFINER (Runs with creator privileges). 
-- STRICTLY CHECKS CALLER EMAIL to Ensure only the Owner can use this.

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS void AS $$
DECLARE
  caller_email TEXT;
BEGIN
  -- 1. Security Check: Who is calling?
  SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();
  
  -- 🔒 Hardcoded Super Admin Check (Safest)
  IF caller_email IS NULL OR caller_email != 'anukbin@gmail.com' THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admin can perform this action.';
  END IF;

  -- 2. Break Links & Delete Data
  -- Unlink children
  UPDATE public.children SET parent_id = NULL WHERE parent_id = target_user_id;

  -- Delete from app tables
  DELETE FROM public.family_relationships WHERE parent_id = target_user_id;
  DELETE FROM public.user_profiles WHERE id = target_user_id;
  DELETE FROM public.therapists WHERE id = target_user_id; -- If they are a therapist
  DELETE FROM public.consultation_inquiries WHERE author_id = target_user_id;
  
  -- 3. Delete Storage Objects
  BEGIN
    DELETE FROM storage.objects WHERE owner = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Storage delete failed: %', SQLERRM;
  END;

  -- 4. Delete Logged-in Sessions (Optional but good)
  DELETE FROM auth.sessions WHERE user_id = target_user_id;

  -- 5. Delete Auth User
  DELETE FROM auth.users WHERE id = target_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users (The function itself checks email inside)
GRANT EXECUTE ON FUNCTION public.admin_delete_user TO authenticated;
