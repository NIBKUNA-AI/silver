-- ============================================================
-- Enable Logic for "Auto Blog Post" Feature
-- Created: 2026-01-11
-- Description: Sets up pg_cron to trigger the generate-blog-post Edge Function
-- based on the schedule defined in 'admin_settings'.
-- ============================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create the trigger function
CREATE OR REPLACE FUNCTION trigger_auto_blog_post()
RETURNS void AS $$
DECLARE
    v_posting_day text;
    v_posting_time text;
    v_topic text;
    v_current_day text;
    v_current_hour text;
    v_setting_hour text;
    v_post_count int;
    v_url text := 'https://brisqelgoxwsdqkltseo.supabase.co/functions/v1/generate-blog-post';
    v_apikey text := 'sb_publishable_L1wb2Ya95fZXlr5DIyFHjw_rzeLGh3U'; -- Anon Key
BEGIN
    -- A. Get Settings
    SELECT value INTO v_posting_day FROM admin_settings WHERE key = 'ai_posting_day';
    SELECT value INTO v_posting_time FROM admin_settings WHERE key = 'ai_posting_time';
    SELECT value INTO v_topic FROM admin_settings WHERE key = 'ai_next_topic';

    -- Default if not set
    IF v_posting_day IS NULL OR v_posting_time IS NULL THEN
        RAISE NOTICE 'Auto-blog settings are missing. Skipping.';
        RETURN;
    END IF;

    -- B. Get Current Time (KST: Asia/Seoul)
    -- Postgres 'Day' returns blank-padded string like 'Monday   ', so we initiate Trim
    v_current_day := trim(to_char(now() AT TIME ZONE 'Asia/Seoul', 'Day')); 
    v_current_hour := to_char(now() AT TIME ZONE 'Asia/Seoul', 'HH24');
    
    -- Extract hour from setting (Format HH:MM)
    v_setting_hour := split_part(v_posting_time, ':', 1);

    -- C. Check Schedule Match
    IF v_current_day != v_posting_day THEN
        RAISE NOTICE 'Today (%) is not the scheduled day (%). Skipping.', v_current_day, v_posting_day;
        RETURN;
    END IF;

    IF v_current_hour != v_setting_hour THEN
        RAISE NOTICE 'Current hour (%) is not the scheduled hour (%). Skipping.', v_current_hour, v_setting_hour;
        RETURN;
    END IF;

    -- D. Idempotency Check (Prevent duplicates if run multiple times)
    -- Check if a post was created in the last 12 hours
    SELECT count(*) INTO v_post_count 
    FROM blog_posts 
    WHERE created_at > (now() - interval '12 hours');

    IF v_post_count > 0 THEN
        RAISE NOTICE 'A blog post was already created recently. Skipping to prevent duplicates.';
        RETURN;
    END IF;

    -- E. Trigger Edge Function
    -- Uses pg_net to make an async HTTP request
    PERFORM net.http_post(
        url := v_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_apikey
        ),
        body := jsonb_build_object(
            'topic', COALESCE(v_topic, '아동 발달 센터 이야기')
        )
    );

    RAISE NOTICE '🚀 Auto-blog trigger sent successfully for topic: %', v_topic;

END;
$$ LANGUAGE plpgsql;

-- 3. Schedule the Cron Job (Runs every hour at minute 5)
-- format: min hour day month week
SELECT cron.schedule(
    'auto-blog-poster',   -- unique job name
    '5 * * * *',          -- every hour at minute 5 (e.g., 09:05, 10:05)
    $$ SELECT trigger_auto_blog_post(); $$
);

-- Verification Query
-- SELECT * FROM cron.job;
