-- Function: admin_delete_user
-- Description: Allows Super Admin to delete ANY user account.
-- Version: V6 (Fixes "Therapist Retention" - Does NOT delete therapist record automatically)
--          This allows "Resignation" flow where we delete Auth but keep Therapist Record.

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS void AS $$
DECLARE
  caller_email TEXT;
  target_email TEXT;
BEGIN
  -- 1. Security Check
  SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();
  
  -- Allow Super Admin or specific email
  IF caller_email IS NULL OR (
     caller_email != 'anukbin@gmail.com' AND 
     NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admin can perform this action.';
  END IF;

  -- 2. Get Target Email (For cleanup if needed, but not used for deletion anymore)
  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;

  -- 3. Break Links (Children)
  -- Note: children.parent_id typically references parents(id), not user_id. 
  -- But if it references user_id in some legacy schema, we clean it.
  -- The main cleanup is handled by ON DELETE SET NULL/CASCADE integrity constraints.
  UPDATE public.children SET parent_id = NULL WHERE parent_id = target_user_id;

  -- 4. Dynamic Cleanup (Set to NULL instead of delete where possible)
  -- Payments (Keep record, remove creator)
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

  -- 5. Delete App Data (USER SPECIFIC)
  DELETE FROM public.admin_notifications WHERE user_id = target_user_id;
  DELETE FROM public.family_relationships WHERE parent_id = target_user_id;
  
  -- ✨ [CRITICAL CHANGE] DO NOT DELETE THERAPISTS
  -- We want to keep the therapist record for history (logs, settlements).
  -- If "Hard Delete" is desired, the app must call DELETE FROM therapists explicitely.
  -- DELETE FROM public.therapists WHERE id = target_user_id; <-- REMOVED
  -- IF target_email IS NOT NULL THEN
  --   DELETE FROM public.therapists WHERE email = target_email; <-- REMOVED
  -- END IF;

  -- However, we SHOULD unlink the profile_id so it doesn't point to a non-existent user
  -- (Though ON DELETE SET NULL on the FK should handle this, we do it explicitly to be safe)
  UPDATE public.therapists SET profile_id = NULL WHERE profile_id = target_user_id;
  IF target_email IS NOT NULL THEN
     -- Also unlink if matched by email, just in case
     UPDATE public.therapists SET profile_id = NULL WHERE email = target_email AND profile_id IS NOT NULL;
  END IF;

  -- 6. Delete User Profile (Cascades to Parents table if exists)
  DELETE FROM public.user_profiles WHERE id = target_user_id;
  
  -- 7. Delete Storage (Optional, maybe keep?) -> Delete for now to save space
  BEGIN
    DELETE FROM storage.objects WHERE owner = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Storage delete failed: %', SQLERRM;
  END;

  -- 8. Delete Auth (The Nuclear Option)
  DELETE FROM auth.sessions WHERE user_id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_delete_user TO authenticated;
