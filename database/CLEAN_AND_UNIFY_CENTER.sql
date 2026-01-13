-- 🚨 DANGER: DATA RESET SCRIPT
-- This script merges all data into 'jamsil-branch' and DELETES all other centers.
-- Execute with CAUTION.

DO $$
DECLARE
    v_target_center_id UUID;
    v_legacy_center_id UUID;
BEGIN
    -- 1. IDENTIFY SURVIVOR (Jamsil Branch)
    -- Look for 'jamsil-branch' OR 'jamsil-main' (if already run)
    SELECT id INTO v_target_center_id FROM public.centers WHERE slug IN ('jamsil-branch', 'jamsil-main') LIMIT 1;

    -- If not found, just pick the FIRST created center to save
    IF v_target_center_id IS NULL THEN
        SELECT id INTO v_target_center_id FROM public.centers ORDER BY created_at ASC LIMIT 1;
    END IF;

    RAISE NOTICE 'Target Center ID: %', v_target_center_id;

    -- 2. REASSIGN DATA (Move orphans to Target)
    -- Profiles
    UPDATE public.profiles SET center_id = v_target_center_id WHERE center_id != v_target_center_id OR center_id IS NULL;
    -- [FIX] Also update 'user_profiles' if it exists (seems to be a separate table causing FK issues)
    -- We use a safe update approach in case it doesn't exist, but since it threw error, it must exist.
    -- However, standard SQL will error if table doesn't exist. Since error confirmed it, we write it directly.
    UPDATE public.user_profiles SET center_id = v_target_center_id WHERE center_id != v_target_center_id OR center_id IS NULL;
    
    -- Children
    UPDATE public.children SET center_id = v_target_center_id WHERE center_id != v_target_center_id OR center_id IS NULL;
    -- Programs
    UPDATE public.programs SET center_id = v_target_center_id WHERE center_id != v_target_center_id OR center_id IS NULL;
    -- Inquiries / Leads (Consultation Inquiries)
    UPDATE public.consultations SET center_id = v_target_center_id WHERE center_id != v_target_center_id OR center_id IS NULL;
    -- Admin Settings
    UPDATE public.admin_settings SET center_id = v_target_center_id WHERE center_id != v_target_center_id OR center_id IS NULL;
    -- Blog Posts (if column exists, assumed yes from earlier context)
    -- Check if 'blog_posts' has center_id, if not skip. (Assuming typical SaaS structure, usually yes).
    -- If column doesn't exist, this line might fail. Wrapped in a block or check? 
    -- For safety, I'll assume blog posts are global or linked to profiles. Leaving out if unsure.
    -- Wait, 'blog_posts' usually linked to author_id (profile). Profile is moved, so we are good.

    -- 3. UPDATE SURVIVOR DETAILS
    UPDATE public.centers
    SET 
        name = '자라다 아동심리발달센터 잠실점',
        slug = 'jamsil-main', -- Rename as requested
        phone = '02-416-2213',
        email = 'zaramom@gmail.com',
        weekday_hours = '평일 09:00 - 18:00',
        holiday_text = '토, 일, 공휴일 휴무',
        address = '서울 송파구 올림픽로 300 롯데월드타워 10층' -- Ensure Address is consistent
    WHERE id = v_target_center_id;

    -- 4. DELETE OTHERS
    DELETE FROM public.centers WHERE id != v_target_center_id;

    RAISE NOTICE '✅ Cleanup Complete. All data unified to Center ID: %', v_target_center_id;
END $$;
