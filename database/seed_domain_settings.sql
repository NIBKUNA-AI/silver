-- ============================================================
-- 🌍 SEED DOMAIN SETTINGS for Localhost Detection
-- ============================================================

-- This ensures that when accessing from 'localhost', the code maps it to the Jamsil branch (or first center).

DO $$
DECLARE
    v_center_id UUID;
BEGIN
    -- 1. Get the first center ID (usually Jamsil or Main)
    SELECT id INTO v_center_id FROM public.centers ORDER BY created_at ASC LIMIT 1;

    IF v_center_id IS NOT NULL THEN
        -- 2. Insert or Update 'domain_url' setting for this center
        -- Fixed: Removed 'type' and 'is_public' which don't exist in the table
        INSERT INTO public.admin_settings (center_id, key, value)
        VALUES (v_center_id, 'domain_url', 'localhost, 127.0.0.1')
        ON CONFLICT (center_id, key) 
        DO UPDATE SET value = 'localhost, 127.0.0.1';
        
        RAISE NOTICE '✅ Localhost domain mapped to Center ID: %', v_center_id;
    ELSE
        RAISE WARNING '⚠️ No centers found to map domain!';
    END IF;
END $$;

-- Force Schema Cache Reload to fix PGRST200 errors
NOTIFY pgrst, 'reload schema';
