-- ============================================================
-- 🛠️ FIX CHILD LOADING & RELOAD SCHEMA
-- ============================================================

-- 1. Force Schema Cache Reload (Critical for PGRST200)
NOTIFY pgrst, 'reload schema';

-- 2. Verify and Re-Apply Foreign Key Constraint (Safety Measure)
DO $$
BEGIN
    -- Check if constraint exists, if not strictly necessary but good to ensure
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'children_parent_id_fkey'
    ) THEN
        ALTER TABLE public.children 
        ADD CONSTRAINT children_parent_id_fkey 
        FOREIGN KEY (parent_id) REFERENCES public.parents(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Ensure RLS Policies allow Super Admin Access to Children & Parents

-- Drop existing restrictive policies if they might be conflicting (cleanup)
DROP POLICY IF EXISTS "Super Admin can do everything on children" ON public.children;
DROP POLICY IF EXISTS "Super Admin can do everything on parents" ON public.parents;

-- Re-apply Super Admin Bypass (using the immutable function we created)
CREATE POLICY "Super Admin can do everything on children"
ON public.children
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Super Admin can do everything on parents"
ON public.parents
FOR ALL
USING (public.is_super_admin());

-- 4. Ensure basic read access for staff/admins is also correct
-- (This might duplicate existing policies, but ensuring it's comprehensive)
-- Existing policies usually use get_my_center_id()

-- 5. Grant explicit permissions just in case (sometimes needed for new tables)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.children TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parents TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
