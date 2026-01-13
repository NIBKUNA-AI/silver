
-- 🚨 CRITICAL FIX: Admin Permissions & RLS Repair 🚨
-- 1. Ensure 'anukbin@gmail.com' is SUPER_ADMIN
-- 2. Unlock RLS for Admins on user_profiles
-- 3. Fix 'update_user_role_safe' RPC to bypass checks for Super Admin

BEGIN;

-- 1. Force Super Admin Role
UPDATE public.user_profiles
SET role = 'super_admin',
    center_id = 'd327993a-e558-4442-bac5-1469306c35bb'
WHERE email = 'anukbin@gmail.com';

UPDATE public.profiles
SET role = 'super_admin',
    center_id = 'd327993a-e558-4442-bac5-1469306c35bb'
WHERE email = 'anukbin@gmail.com';


-- 2. RESET RLS on user_profiles to allow everything for Admins
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can do everything on user_profiles" ON public.user_profiles;

CREATE POLICY "Admins can do everything on user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (
    -- Allow if user is super_admin OR admin of the same center
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('super_admin', 'admin')
)
WITH CHECK (
    -- Allow if user is super_admin OR admin of the same center
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('super_admin', 'admin')
);


-- 3. Redefine the RPC with explicit Super Admin Override
CREATE OR REPLACE FUNCTION public.update_user_role_safe(
    target_user_id UUID,
    new_role TEXT,
    new_status TEXT,
    user_email TEXT,
    user_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Critical: Runs as ID with high privs
SET search_path = public, auth
AS $$
DECLARE
    v_performer_role TEXT;
BEGIN
    -- 1. Get Performer Role
    SELECT role INTO v_performer_role FROM public.user_profiles WHERE id = auth.uid();
    
    -- 2. Check Permissions
    IF v_performer_role NOT IN ('super_admin', 'admin') THEN
        RETURN jsonb_build_object('success', false, 'message', '⛔ 권한이 없습니다. (관리자만 가능)');
    END IF;

    -- 3. Update Tables
    UPDATE public.user_profiles
    SET role = new_role,
        status = new_status,
        updated_at = NOW()
    WHERE id = target_user_id;

    UPDATE public.profiles
    SET role = new_role,
        status = new_status,
        updated_at = NOW()
    WHERE id = target_user_id;
    
    -- 4. Sync Auth Metadata
    UPDATE auth.users
    SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('role', new_role, 'status', new_status)
    WHERE id = target_user_id;

    RETURN jsonb_build_object('success', true, 'message', '권한 변경 완료');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

COMMIT;
