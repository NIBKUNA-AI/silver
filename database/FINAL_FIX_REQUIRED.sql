-- =======================================================
-- 🚨 FINAL FIX: REQUIRED DATABASE UPDATE
-- =======================================================
-- Please Copy & Paste this into your Supabase SQL Editor and Run it.
-- This fixes the "500 Internal Server Error" and "Missing Parent Info".
-- =======================================================

BEGIN;

-- 1. FIX 500 ERROR (Infinite Recursion in Permissions)
--    The "Admins can do everything" policy was checking credentials recursively.
--    We replace it with simple policies.
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON public.user_profiles;
DROP POLICY IF EXISTS "Emergency Access" ON public.user_profiles;

-- ✅ Safe Policies
CREATE POLICY "View Own Profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Update Own Profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Insert Own Profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- Allow authenticated users to view profiles (needed for references)
CREATE POLICY "Read All Profiles (Auth)" ON public.user_profiles FOR SELECT USING (auth.role() = 'authenticated');


-- 2. FIX PARENT DATA SYNC
--    Ensure 'phone' column exists and re-create the automation trigger.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='phone') THEN
        ALTER TABLE public.user_profiles ADD COLUMN phone VARCHAR(20);
    END IF;
END $$;

-- 3. AUTOMATION TRIGGER (Creates Parent Record on Signup)
CREATE OR REPLACE FUNCTION public.sync_profile_to_specific_table()
RETURNS TRIGGER AS $$
BEGIN
    IF new.role = 'parent' THEN
        INSERT INTO public.parents (profile_id, center_id, name, email, phone)
        VALUES (
            new.id,
            new.center_id,
            new.name,
            new.email,
            COALESCE(new.phone, '010-0000-0000')
        )
        ON CONFLICT (profile_id) DO UPDATE
        SET center_id = EXCLUDED.center_id, name = EXCLUDED.name, updated_at = NOW();
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_profile_sync ON public.user_profiles;
CREATE TRIGGER on_user_profile_sync
    AFTER INSERT OR UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_specific_table();

COMMIT;

-- =======================================================
-- ✅ HOW TO VERIFY:
-- 1. Run this script.
-- 2. Refresh your app.
-- 3. 500 Errors should disappear.
-- 4. New signups will correctly have Parent data.
-- =======================================================
