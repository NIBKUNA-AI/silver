-- =======================================================
-- 🏁 FINAL CONSISTENCY CHECK & APPLY (SYNTAX FIXED)
-- =======================================================

-- 1. [Structure] Ensure `phone` column exists in user_profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='phone') THEN
        ALTER TABLE public.user_profiles ADD COLUMN phone VARCHAR(20);
        RAISE NOTICE '✅ Added missing column: phone';
    ELSE
        RAISE NOTICE '✅ Column phone already exists';
    END IF;
END $$;

-- 2. [Trigger] Parent Data Sync (Re-apply to be absolutely sure)
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
        SET 
            center_id = EXCLUDED.center_id,
            name = EXCLUDED.name,
            updated_at = NOW();
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_profile_sync ON public.user_profiles;
CREATE TRIGGER on_user_profile_sync
    AFTER INSERT OR UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_specific_table();

-- Wrapped NOTICE in DO block to avoid syntax error
DO $$ BEGIN RAISE NOTICE '✅ Parent Sync Trigger applied'; END $$;

-- 3. [Permissions] Fix 500 Error (Recursion)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can do everything" ON public.user_profiles; 
DROP POLICY IF EXISTS "View Own Profile" ON public.user_profiles;
CREATE POLICY "View Own Profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);

DO $$ BEGIN RAISE NOTICE '✅ RLS Policies fixed (Recursion removed)'; END $$;
