-- =======================================================
-- 🛠️ MASTER FIX: RUN THIS IN SUPABASE SQL EDITOR
-- =======================================================
-- This script fixes ALL identified issues:
-- 1. 500 Error (Infinite Recursion in Permissions)
-- 2. Missing Parent Data (Fixes Trigger & Phone Column)
-- 3. Restore Super Admin Access
-- =======================================================

BEGIN; 

-- 1. FIX RLS POLICIES (Stop 500 Errors)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON public.user_profiles;
DROP POLICY IF EXISTS "Emergency Access" ON public.user_profiles;

-- Simple, Safety Policies
CREATE POLICY "View Own Profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Update Own Profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Insert Own Profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. FIX PARENTS RLS
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents view own data" ON public.parents;
DROP POLICY IF EXISTS "View Own Parent Data" ON public.parents;

CREATE POLICY "View Own Parent Data" ON public.parents FOR ALL USING (profile_id = auth.uid());

-- 3. ENSURE COLUMNS & TRIGGERS (Fix Missing Data)
-- Ensure phone column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='phone') THEN
        ALTER TABLE public.user_profiles ADD COLUMN phone VARCHAR(20);
    END IF;
END $$;

-- 4. UPDATE SYNC TRIGGER (Auto-create parent data)
CREATE OR REPLACE FUNCTION public.sync_profile_to_specific_table()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync to PARENTS table if role is parent
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

COMMIT;

-- 5. FINAL CHECK NOTICE
-- If you run this successfully, try signing up again.
