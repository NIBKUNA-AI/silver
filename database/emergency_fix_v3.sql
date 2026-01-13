-- ============================================================
-- 🚨 EMERGENCY FIX V3: Force FK & Schema Reload
-- ============================================================

-- 1. DROP Existing Constraint to be safe (prevent duplicates)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'children_parent_id_fkey'
    ) THEN
        ALTER TABLE public.children DROP CONSTRAINT children_parent_id_fkey;
    END IF;
END $$;

-- 2. ADD Constraint with EXACT NAME 'children_parent_id_fkey'
-- This ensures the relationship name 'children_parent_id_fkey' is registered in PostgREST
ALTER TABLE public.children
ADD CONSTRAINT children_parent_id_fkey
FOREIGN KEY (parent_id) REFERENCES public.parents(id) ON DELETE SET NULL;

-- 3. Force Schema Reload (Run this TWICE effectively by putting it here)
NOTIFY pgrst, 'reload schema';

-- 4. Re-Verify Super Admin Access
DROP POLICY IF EXISTS "Super Admin can do everything on children" ON public.children;
CREATE POLICY "Super Admin can do everything on children"
ON public.children
FOR ALL
USING (public.is_super_admin());

-- 5. Grant Permissions
GRANT ALL ON public.children TO authenticated;
GRANT ALL ON public.parents TO authenticated;

-- Final Reload
NOTIFY pgrst, 'reload schema';
