-- =======================================================
-- 🐛 DEBUG & FIX: Diagnose why 500 error occurs on SignUp
-- =======================================================

-- 1. Create a debug log table (Temporary)
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id SERIAL PRIMARY KEY,
    message TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Update Trigger to Catch All Exceptions and Log them
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_center_id UUID;
    v_role user_role;
    v_name VARCHAR;
    v_center_input TEXT;
BEGIN
    BEGIN
        -- Safe Parsing
        BEGIN
            v_center_input := new.raw_user_meta_data->>'center_id';
            IF v_center_input IS NULL OR trim(v_center_input) = '' THEN
                v_center_id := NULL;
            ELSE -- Try to cast, if fail catch below
                v_center_id := v_center_input::UUID;
            END IF;
        EXCEPTION WHEN OTHERS THEN
             v_center_id := NULL; -- Invalid UUID format -> NULL
        END;

        v_role := (COALESCE(new.raw_user_meta_data->>'role', 'parent'))::user_role;
        v_name := COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'New User');

        -- Attempt Insert
        INSERT INTO public.user_profiles (id, email, name, role, center_id, status)
        VALUES (
            new.id,
            new.email,
            v_name,
            v_role,
            v_center_id,
            'active'
        );
        
        RETURN new;
        
    EXCEPTION WHEN OTHERS THEN
        -- 🔥 LOG THE ERROR
        INSERT INTO public.debug_logs (message, details)
        VALUES ('handle_new_user_failed', SQLERRM || ' | State: ' || SQLSTATE);
        
        -- And RE-RAISE so we see 500 (but now we have a log)
        -- Or... suppression? 
        -- If we suppress, user is created in Auth but not in Profile -> Ghost Account.
        -- We must NOT suppress. We need to see why it fails.
        RAISE EXCEPTION 'Trigger Failed: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Check for specific constraint violation possibilities
-- Is there a trigger on user_profiles that fails?
-- Let's check triggers on user_profiles.
DO $$
DECLARE 
  trig record;
BEGIN
  FOR trig IN SELECT * FROM information_schema.triggers WHERE event_object_table = 'user_profiles' LOOP
     RAISE NOTICE 'Trigger on profiles: %', trig.trigger_name;
  END LOOP;
END $$;
