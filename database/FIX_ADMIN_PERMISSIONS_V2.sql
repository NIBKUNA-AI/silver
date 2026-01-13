
-- 🚨 CRITICAL CHECK: Admin Permissions V2 🚨
-- Ensure 'anukbin@gmail.com' is SUPER_ADMIN and policies allow management.

BEGIN;

-- 1. Unconditionally set Super Admin
UPDATE public.user_profiles
SET role = 'super_admin'
WHERE email = 'anukbin@gmail.com';

UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'anukbin@gmail.com';

-- 2. Open RLS on user_profiles for Admins (Broad Policy)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all" ON public.user_profiles;

-- Allow Admins/SuperAdmins to SELECT, INSERT, UPDATE, DELETE everything
CREATE POLICY "Admins can manage all"
ON public.user_profiles
FOR ALL
USING (
    public.get_my_role_safe() IN ('super_admin', 'admin')
)
WITH CHECK (
    public.get_my_role_safe() IN ('super_admin', 'admin')
);

-- 3. Ensure profiles table is also open (Legacy sync)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;

CREATE POLICY "Admins can manage profiles"
ON public.profiles
FOR ALL
USING (
    public.get_my_role_safe() IN ('super_admin', 'admin')
);


COMMIT;

DO $$
BEGIN
    RAISE NOTICE '✅ Permissions Fixed. Admin should be able to update roles now.';
END $$;
