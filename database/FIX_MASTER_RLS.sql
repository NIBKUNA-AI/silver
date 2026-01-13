
-- 🚨 FINAL MASTER FIX: RLS & Permissions 🚨
-- 1. Reset RLS on user_profiles
-- 2. Hardcode 'anukbin@gmail.com' for FULL ACCESS (Nuclear Bypass)
-- 3. Define standard policies for others

BEGIN;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Remove ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can do everything on user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can see own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all" ON public.user_profiles;
DROP POLICY IF EXISTS "Super Admin Full Access" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.user_profiles;

-- 📝 POLICY 1: MASTER ACCESS (Hardcoded Email)
-- This ensures 'anukbin@gmail.com' can ALWAYS SELECT/INSERT/UPDATE/DELETE
CREATE POLICY "Master Access for Anukbin"
ON public.user_profiles
FOR ALL
USING (
    (auth.jwt() ->> 'email') = 'anukbin@gmail.com'
)
WITH CHECK (
    (auth.jwt() ->> 'email') = 'anukbin@gmail.com'
);

-- 📝 POLICY 2: Super Admin / Admin Access (Role-based)
-- Uses the safe function to avoid recursion
CREATE POLICY "Admin Role Access"
ON public.user_profiles
FOR ALL
USING (
    public.get_my_role_safe() IN ('super_admin', 'admin')
)
WITH CHECK (
    public.get_my_role_safe() IN ('super_admin', 'admin')
);

-- 📝 POLICY 3: Self Access (Read Own Profile)
-- Vital for login logic
CREATE POLICY "Self Read Access"
ON public.user_profiles
FOR SELECT
USING (
    id = auth.uid() OR email = (auth.jwt() ->> 'email')
);

-- 📝 POLICY 4: Self Update (Limited)
-- Users might need to update their own basic info (name, etc), but usually restricted.
-- Allowing basic update for now to be safe, logic usually handles field restrictions.
CREATE POLICY "Self Update Access"
ON public.user_profiles
FOR UPDATE
USING (
    id = auth.uid()
)
WITH CHECK (
    id = auth.uid()
);


COMMIT;

DO $$
BEGIN
    RAISE NOTICE '✅ MASTER RLS POLICY APPLIED. Anukbin is God-mode.';
END $$;
