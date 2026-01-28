-- =======================================================
-- 👑 RESTORE SUPER ADMIN (EMERGENCY)
-- =======================================================

-- 1. Identify the Auth ID for 'anukbin@gmail.com'
--    We can't select from auth.users directly in all environments effectively without extensions.
--    However, if we are Superuser/ServiceRole, we can.
--    We will assume there is an auth user. If there isn't, we can't create one from SQL easily without knowing the password hash.
--    BUT, if the user says it "disappeared", likely the profile is gone or hidden.

DO $$
DECLARE
    v_uid UUID;
BEGIN
    -- Try to find the user in auth.users by email
    SELECT id INTO v_uid FROM auth.users WHERE email = 'anukbin@gmail.com';
    
    IF v_uid IS NOT NULL THEN
        RAISE NOTICE 'Found Auth User: %', v_uid;
        
        -- Force UPSERT into user_profiles
        INSERT INTO public.user_profiles (id, email, name, role, center_id, status)
        VALUES (
            v_uid,
            'anukbin@gmail.com',
            'Sovereign Admin',
            'super_admin',
            NULL, -- Super admins have no specific center
            'active'
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            role = 'super_admin',
            status = 'active',
            center_id = NULL; -- Ensure unbound
            
        RAISE NOTICE '✅ Super Admin Profile Restored.';
    ELSE
        RAISE NOTICE '❌ Auth User for anukbin@gmail.com NOT FOUND. Cannot restore profile.';
    END IF;
END $$;
