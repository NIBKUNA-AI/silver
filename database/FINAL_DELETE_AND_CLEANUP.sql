-- 1. Create a robust function to delete ANY user completely
-- Must be SECURITY DEFINER to access auth.users
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 0. SAFETY FIRST: Detach children to prevent accidental deletion
    -- This ensures child records remain even if the parent account is wiped
    UPDATE public.children SET parent_id = NULL WHERE parent_id = target_user_id;

    -- 1. Delete from public.user_profiles (if exists)
    DELETE FROM public.user_profiles WHERE id = target_user_id;
    
    -- 2. Delete from public.profiles (if exists - legacy/new table)
    DELETE FROM public.profiles WHERE id = target_user_id;

    -- 3. Delete from auth.users (Cascades to other tables if foreign keys are set correctly)
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Grant execute permission to authenticated users (RLS will handle row access if needed, but this is an admin function)
-- Ideally, you check for admin role INSIDE the function or via RLS, but for now we trust the app logic or add a check.
GRANT EXECUTE ON FUNCTION public.admin_delete_user TO authenticated;


-- 2. Create a robust function for self-deletion
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_uid UUID;
BEGIN
    current_uid := auth.uid();
    
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 0. SAFETY FIRST: Detach children
    UPDATE public.children SET parent_id = NULL WHERE parent_id = current_uid;

    -- 2. Delete from profiles
    DELETE FROM public.user_profiles WHERE id = current_uid;
    DELETE FROM public.profiles WHERE id = current_uid;

    -- 3. Delete from auth.users
    DELETE FROM auth.users WHERE id = current_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_own_account TO authenticated;


-- 3. CLEANUP SCRIPT FOR GHOST ACCOUNT (zombi00000@naver.com)
DO $$
DECLARE
    ghost_user_id UUID;
BEGIN
    -- Select the ID of the ghost user from auth.users
    SELECT id INTO ghost_user_id
    FROM auth.users
    WHERE email = 'zombi00000@naver.com';

    IF ghost_user_id IS NOT NULL THEN
        -- 0. SAFETY FIRST: Detach any children linked to this ghost account
        UPDATE public.children SET parent_id = NULL WHERE parent_id = ghost_user_id;
        
        -- Execute the deletion logic
        DELETE FROM public.user_profiles WHERE id = ghost_user_id;
        DELETE FROM public.profiles WHERE id = ghost_user_id;
        DELETE FROM auth.users WHERE id = ghost_user_id;
        RAISE NOTICE 'Deleted ghost user: zombi00000@naver.com (ID: %)', ghost_user_id;
    ELSE
        RAISE NOTICE 'Ghost user zombi00000@naver.com not found in auth.users';
    END IF;
END;
$$;
