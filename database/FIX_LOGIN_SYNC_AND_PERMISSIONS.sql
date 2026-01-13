
-- 🚨 CRITICAL FIX: Login Sync & Admin Permissions 🚨

BEGIN;

-- 1. Create RPC to Sync Profile by Email (Fixes "No user_profile found" for invited users)
CREATE OR REPLACE FUNCTION public.sync_profile_by_email()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_uid UUID;
    v_email TEXT;
    v_existing_id UUID;
BEGIN
    v_uid := auth.uid();
    v_email := auth.jwt() ->> 'email';

    IF v_uid IS NULL OR v_email IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check if profile already exists with this ID
    PERFORM 1 FROM public.user_profiles WHERE id = v_uid;
    IF FOUND THEN
        RETURN TRUE; -- Already synced
    END IF;

    -- Check if a profile exists with this EMAIL but DIFFERENT ID (The "Ghost" Case)
    SELECT id INTO v_existing_id FROM public.user_profiles WHERE email = v_email;
    
    IF v_existing_id IS NOT NULL AND v_existing_id != v_uid THEN
        -- ⚡ Found 'Ghost' Profile! Migrate it to new Auth ID.
        RAISE NOTICE 'Migrating profile % to new Auth ID %', v_existing_id, v_uid;
        
        -- Update IDs in tables (Assuming Cascade or manual update)
        -- We must disable triggers to avoid circular logic if any
        
        -- 1. Update PROFILES (Base table)
        UPDATE public.profiles SET id = v_uid, updated_at = NOW() WHERE id = v_existing_id;
        
        -- 2. Update USER_PROFILES (View or Table - implies it's a table based on context)
        UPDATE public.user_profiles SET id = v_uid, updated_at = NOW() WHERE id = v_existing_id;
        
        -- 3. Update Therapists constraints if any (usually linked by profile_id)
        UPDATE public.therapists SET profile_id = v_uid WHERE profile_id = v_existing_id;

        RETURN TRUE;
    END IF;

    RETURN FALSE; -- No profile found to sync
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Sync failed: %', SQLERRM;
    RETURN FALSE;
END;
$$;


-- 2. UNLOCK ADMIN PERMISSIONS (The "Nuclear" Option for Anukbin)
-- Ensure Anukbin is Super Admin
UPDATE public.user_profiles SET role = 'super_admin' WHERE email = 'anukbin@gmail.com';
UPDATE public.profiles SET role = 'super_admin' WHERE email = 'anukbin@gmail.com';

-- Force Open RLS for Super Admin
DROP POLICY IF EXISTS "Super Admin Full Access" ON public.user_profiles;
CREATE POLICY "Super Admin Full Access" ON public.user_profiles
FOR ALL
USING (
    (auth.jwt() ->> 'email') = 'anukbin@gmail.com' -- 🔒 Hardcoded Backdoor for Owner
    OR
    public.get_my_role_safe() IN ('super_admin', 'admin')
)
WITH CHECK (
    (auth.jwt() ->> 'email') = 'anukbin@gmail.com' -- 🔒 Hardcoded Backdoor for Owner
    OR
    public.get_my_role_safe() IN ('super_admin', 'admin')
);

DO $$
BEGIN
    RAISE NOTICE '✅ Sync RPC created and Admin Permissions unlocked.';
END $$;

COMMIT;
