-- =======================================================
-- 🚑 EMERGENCY REPAIR: FIX 500 ERROR & MISSING DATA
-- =======================================================

-- 1. FIX 500 ERROR (RLS RECURSION)
--    We aggressively DROP all complex policies and replace them with Simple, Non-Recursive ones.
--    This stops the "Infinite Loop" causing the 500 error.

-- user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON public.user_profiles;
DROP POLICY IF EXISTS "Emergency Access" ON public.user_profiles;

-- Simple, Clean Policy: You can see/edit YOURSELF.
CREATE POLICY "View Own Profile" ON public.user_profiles 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Update Own Profile" ON public.user_profiles 
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Insert Own Profile" ON public.user_profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow reading all profiles if you are authenticated (Temporary measure to ensure app loads references)
-- Use a separate policy to avoid confusion.
CREATE POLICY "Read All Profiles (Auth)" ON public.user_profiles
    FOR SELECT USING (auth.role() = 'authenticated');


-- 2. FIX 500 ERROR ON PARENTS TABLE
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents view own data" ON public.parents;
DROP POLICY IF EXISTS "Admins view all parents" ON public.parents;

-- Simple Policy for Parents
CREATE POLICY "View Own Parent Data" ON public.parents
    FOR ALL
    USING (
        -- You own the profile linked to this parent record
        profile_id = auth.uid()
    );

-- 3. FORCE DATA SYNC (Recover Missing Parent Data)
--    We manually insert the missing parent record for 'zombi00000@naver.com' (and others).

INSERT INTO public.parents (profile_id, center_id, name, email, phone)
SELECT 
    up.id, 
    up.center_id, 
    up.name, 
    up.email, 
    COALESCE(up.phone, '010-0000-0000')
FROM public.user_profiles up
WHERE up.role = 'parent'
AND NOT EXISTS (SELECT 1 FROM public.parents p WHERE p.profile_id = up.id);

-- 4. LOG SUCCESS
INSERT INTO public.debug_logs (message, details) VALUES ('Emergency Repair Executed', 'Policies Reset + Parent Data Synced');
