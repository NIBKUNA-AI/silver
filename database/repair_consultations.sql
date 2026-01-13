
-- ============================================================
-- REPAIR SCRIPT: Fix Empty Consultation Data
-- Purpose: Populate missing names/info for consultations that have a child_id but no text data.
-- ============================================================

-- 1. Update from Children table (if child_id exists)
UPDATE public.consultations c
SET 
    child_name = COALESCE(c.child_name, ch.name),
    child_gender = COALESCE(c.child_gender, ch.gender),
    child_birth_year = COALESCE(c.child_birth_year, EXTRACT(YEAR FROM ch.birth_date)::int)
FROM public.children ch
WHERE c.child_id = ch.id 
  AND (c.child_name IS NULL OR c.child_name = '');

-- 2. Update from User Profiles (Lead/Guardian info) if possible
-- We don't have a direct link to user_id in consultations usually, 
-- but if we had parent_id or similar we could. 
-- For now, we rely on the children update.

-- 3. Log results
DO $$
DECLARE
    fixed_count INT;
BEGIN
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE '✅ Successfully repaired % consultation rows using linked child data.', fixed_count;
END $$;
