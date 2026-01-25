-- 🏗️ [ZARADA SAAS] FINAL SECURITY & AUTO-PROVISIONING SYSTEM
-- Description: 1. Storage RLS (Folder-based multi-tenancy)
--              2. Auto-Profile Trigger (Prevents OAuth Ghost Profiles)
--              3. Data Integrity Constraints

-- 1. [STORAGE RLS] Multi-tenant Folder Isolation
-- This ensures center A cannot read/write to center B's folder.
-- Folder structure: [bucket]/[center_id]/file.webp

-- Cleanup existing policies to avoid "already exists" errors
DROP POLICY IF EXISTS "center_storage_isolation_select" ON storage.objects;
DROP POLICY IF EXISTS "center_storage_isolation_insert" ON storage.objects;
DROP POLICY IF EXISTS "center_storage_isolation_update" ON storage.objects;
DROP POLICY IF EXISTS "center_storage_isolation_delete" ON storage.objects;

-- Create policies on storage.objects
CREATE POLICY "center_storage_isolation_select" ON storage.objects FOR SELECT TO authenticated
USING (
    (storage.foldername(name))[1] = (SELECT center_id::text FROM public.user_profiles WHERE id = auth.uid())
    OR public.is_super_admin()
);

CREATE POLICY "center_storage_isolation_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    (storage.foldername(name))[1] = (SELECT center_id::text FROM public.user_profiles WHERE id = auth.uid())
    OR public.is_super_admin()
);

CREATE POLICY "center_storage_isolation_update" ON storage.objects FOR UPDATE TO authenticated
USING (
    (storage.foldername(name))[1] = (SELECT center_id::text FROM public.user_profiles WHERE id = auth.uid())
    OR public.is_super_admin()
);

CREATE POLICY "center_storage_isolation_delete" ON storage.objects FOR DELETE TO authenticated
USING (
    (storage.foldername(name))[1] = (SELECT center_id::text FROM public.user_profiles WHERE id = auth.uid())
    OR public.is_super_admin()
);


-- 2. [AUTO-PROFILE] Automatically create profile for any new Auth user
-- This solves the "Ghost User" problem for OAuth (Google/Kakao) logins.
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger AS $$
BEGIN
  -- We only create a profile if it doesn't exist yet
  INSERT INTO public.user_profiles (id, email, name, role, status)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New Member'),
    'parent', -- Default to parent for safety
    'pending' -- Require admin approval or onboarding completion
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();


-- 3. [DATA INTEGRITY] Ensure no record is orphaned without center_id
-- We add check constraints only if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'children' AND constraint_name = 'children_center_id_check') THEN
        ALTER TABLE public.children ADD CONSTRAINT children_center_id_check CHECK (center_id IS NOT NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'therapists' AND constraint_name = 'therapists_center_id_check') THEN
        ALTER TABLE public.therapists ADD CONSTRAINT therapists_center_id_check CHECK (center_id IS NOT NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'schedules' AND constraint_name = 'schedules_center_id_check') THEN
        ALTER TABLE public.schedules ADD CONSTRAINT schedules_center_id_check CHECK (center_id IS NOT NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'consultations' AND constraint_name = 'consultations_center_id_check') THEN
        ALTER TABLE public.consultations ADD CONSTRAINT consultations_center_id_check CHECK (center_id IS NOT NULL);
    END IF;
END $$;


-- ✅ 시스템 최적화 및 보안 강화 완료
DO $$ BEGIN RAISE NOTICE '🏆 Zarada SaaS Ultimate Security & Auto-Provisioning Deployed.'; END $$;
