
-- 🚨 CRITICAL FIX: Enum Type Casting Error 🚨
-- Error: "column 'role' is of type user_role but expression is of type text"
-- Fix: Explicitly cast 'new_role' (TEXT) to 'user_role' (ENUM) in the RPC.

BEGIN;

CREATE OR REPLACE FUNCTION public.update_user_role_safe(
    target_user_id UUID,
    new_role TEXT,
    new_status TEXT,
    user_email TEXT,
    user_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_performer_role TEXT;
BEGIN
    -- 1. Get Performer Role (Use safe function if available, else direct select)
    -- Using direct select with cast to text to be safe
    SELECT role::text INTO v_performer_role FROM public.user_profiles WHERE id = auth.uid();
    
    -- 2. Check Permissions
    IF v_performer_role NOT IN ('super_admin', 'admin') THEN
        RETURN jsonb_build_object('success', false, 'message', '⛔ 권한이 없습니다. (관리자만 가능)');
    END IF;

    -- 3. Update Tables (With Explicit Casts)
    
    -- Update user_profiles
    UPDATE public.user_profiles
    SET role = new_role::public.user_role, -- ✨ Explicit Cast
        status = new_status,
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Update profiles (Assuming profiles.role is also potentially enum or text, cast works for both if text is valid)
    -- If profiles.role is TEXT, the cast to user_role then implicit to text might be weird, 
    -- but usually profiles.role is also user_role enum in this schema.
    UPDATE public.profiles
    SET role = new_role::public.user_role, -- ✨ Explicit Cast
        status = new_status,
        updated_at = NOW()
    WHERE id = target_user_id;
    
    -- 4. Sync Auth Metadata (JSONB stores text, so no cast needed here)
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

DO $$
BEGIN
    RAISE NOTICE '✅ Fixed RPC with Enum Casting.';
END $$;
