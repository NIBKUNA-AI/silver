-- =======================================================
-- 🕵️ DEEP DIAGNOSIS & REPAIR (FIXED)
-- =======================================================

-- 1. Create Debug Log Table (If not exists, force recreate to be sure)
DROP TABLE IF EXISTS public.debug_logs;
CREATE TABLE public.debug_logs (
    id SERIAL PRIMARY KEY,
    message TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Grant access just in case
GRANT ALL ON public.debug_logs TO anon, authenticated, service_role;

-- 2. Check for "Hidden" Triggers on auth.users
-- Since we can't see them easily, we will DROP common ones to be safe.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_v2 ON auth.users;

-- 3. The SAFE trigger (V5) - Minimalist & FIXED
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_center_id UUID;
    v_role_str TEXT;
    v_center_input TEXT; -- ✨ FIXED: Added missing variable declaration
BEGIN
    -- Log start
    INSERT INTO public.debug_logs (message, details) VALUES ('Trigger Started', new.id::text);

    BEGIN
        v_role_str := new.raw_user_meta_data->>'role';
        
        -- Try to parse center_id, default to NULL if fails
        BEGIN
            v_center_input := new.raw_user_meta_data->>'center_id';
            IF CHAR_LENGTH(v_center_input) > 0 THEN
               v_center_id := v_center_input::UUID;
            ELSE
               v_center_id := NULL;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_center_id := NULL;
        END;

        INSERT INTO public.user_profiles (id, email, name, role, center_id, status)
        VALUES (
            new.id,
            new.email,
            COALESCE(new.raw_user_meta_data->>'name', 'User'),
            'parent', -- Force simple role first to avoid enum issues
            v_center_id,
            'active'
        );
        
        -- If we got here, update role if needed
        IF v_role_str IS NOT NULL THEN
            UPDATE public.user_profiles 
            SET role = v_role_str::user_role 
            WHERE id = new.id;
        END IF;

        INSERT INTO public.debug_logs (message, details) VALUES ('Trigger Success', new.email);

    EXCEPTION WHEN OTHERS THEN
        INSERT INTO public.debug_logs (message, details) VALUES ('Trigger Failed', SQLERRM);
        -- DO NOT RAISE EXCEPTION.
    END;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
