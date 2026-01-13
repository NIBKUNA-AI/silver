
-- 🚨 CRITICAL FIX: Resolve RLS Infinite Recursion (500 Error) 🚨

BEGIN;

-- 1. Create a Secure Function to get Role (Bypasses RLS)
-- This prevents the "Policy queries table -> Policy triggers -> Policy queries table" loop.
CREATE OR REPLACE FUNCTION public.get_my_role_safe()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER -- ✨ Runs with owner permissions (bypasses RLS)
SET search_path = public, auth
AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.user_profiles WHERE id = auth.uid();
    RETURN v_role;
END;
$$;

-- 2. Fix user_profiles RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Reset existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can do everything on user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can see own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.user_profiles;

-- Policy A: Users can read their own profile (Basic Access)
CREATE POLICY "Users can see own profile" 
ON public.user_profiles
FOR SELECT 
USING (id = auth.uid());

-- Policy B: Admins/SuperAdmins can do everything (Using Safe Function)
CREATE POLICY "Admins can manage all" 
ON public.user_profiles
FOR ALL 
USING (
    public.get_my_role_safe() IN ('super_admin', 'admin')
)
WITH CHECK (
    public.get_my_role_safe() IN ('super_admin', 'admin')
);

-- 3. Fix therapists RLS (Likely affected too if it joins profiles)
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage therapists" ON public.therapists;
DROP POLICY IF EXISTS "Therapists can view themselves" ON public.therapists;

CREATE POLICY "Admins can manage therapists" 
ON public.therapists
FOR ALL 
USING (
    public.get_my_role_safe() IN ('super_admin', 'admin')
);

CREATE POLICY "Therapists can view own record" 
ON public.therapists
FOR SELECT 
USING (
    -- Correctly link via profile_id based on AuthContext usage
    profile_id = auth.uid()
);

COMMIT;

-- Optional: Run a DO block if you want to see a message
DO $$
BEGIN
    RAISE NOTICE '✅ RLS Recursion Fixed using SECURITY DEFINER function.';
END $$;
