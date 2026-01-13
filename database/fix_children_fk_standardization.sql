
-- ============================================================
-- 🛠️ FIXED: CHILDREN FOREIGN KEY CONSTRAINT (Standardization)
-- ============================================================

DO $$
BEGIN
    -- 1. Drop the legacy foreign key pointing to 'parents' table
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'children_parent_id_fkey'
        AND table_name = 'children'
    ) THEN
        ALTER TABLE public.children DROP CONSTRAINT children_parent_id_fkey;
    END IF;

    -- 2. Re-create the foreign key to point to 'user_profiles' (The Source of Truth)
    -- This allows any registered user (role='parent') to be linked, regardless of 'parents' table sync status.
    ALTER TABLE public.children
    ADD CONSTRAINT children_parent_id_fkey
    FOREIGN KEY (parent_id) REFERENCES public.user_profiles(id)
    ON DELETE SET NULL;

    RAISE NOTICE '✅ Successfully updated children.parent_id FK to reference user_profiles.';
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION '❌ Failed: Some parent_ids in "children" do not exist in "user_profiles". Please check data integrity.';
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Error: %', SQLERRM;
END $$;

-- 3. Grant Permissions verifying everything is accessible
GRANT SELECT, INSERT, UPDATE, DELETE ON public.children TO authenticated, service_role;
GRANT SELECT, REFERENCES ON public.user_profiles TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
