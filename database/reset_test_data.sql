
-- ============================================================
-- 🗑️ RESET TEST DATA (PRESERVE SUPER ADMIN)
-- ============================================================

-- 1. Disable triggers temporarily to speed up deletion and avoid side effects
SET session_replication_role = 'replica';

DO $$
DECLARE 
    target_email TEXT := 'anukbin@gmail.com';
BEGIN
    RAISE NOTICE '🧹 Starting Data Cleanup... (Preserving %)', target_email;

    -- 2. Clear Business Data Tables (Order matters for FK, but 'replica' mode helps)
    --    We explicitly DELETE ALL except those linked to the Super Admin (if any, though rare for child data)
    
    -- Low level connections first
    DELETE FROM public.counseling_logs;
    DELETE FROM public.daily_notes;
    DELETE FROM public.parent_observations;
    
    -- Payments
    DELETE FROM public.payment_items;
    DELETE FROM public.payments;
    DELETE FROM public.vouchers;
    
    -- Schedules & Joins
    DELETE FROM public.schedules;
    DELETE FROM public.child_therapist;
    
    -- Main Domain Entities
    DELETE FROM public.consultations; -- Inquiries
    DELETE FROM public.invitation_codes;
    DELETE FROM public.leads;
    DELETE FROM public.children;
    
    -- Legacy Tables (Wipe completely)
    DELETE FROM public.parents;
    DELETE FROM public.therapists;

    -- 3. Clear Users (preserving Super Admin)
    -- Note: This deletes from 'public.user_profiles'. 
    -- 'auth.users' cannot be easily deleted from SQL Editor due to permissions, 
    -- but usually deleting the profile effectively 'hides' them in the app.
    DELETE FROM public.user_profiles 
    WHERE email IS DISTINCT FROM target_email;

    RAISE NOTICE '✅ Business Data Cleared.';

    -- 4. Reset Sequences (Optional, for clean IDs if using serial, but we use UUIDs mostly)
    
END $$;

-- 5. Re-enable triggers
SET session_replication_role = 'origin';

-- 6. Force Valid State for Super Admin (Just in case)
UPDATE public.user_profiles
SET 
    role = 'super_admin',
    center_id = (SELECT id FROM public.centers WHERE name = '잠실 본점' LIMIT 1) 
WHERE email = 'anukbin@gmail.com';

NOTIFY pgrst, 'reload schema';
