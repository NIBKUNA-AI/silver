-- ============================================================
-- 🔍 [DIAGNOSTIC] Silver Care System Integrity Check
-- This script looks for missing tables, columns, and broken relations.
-- ============================================================

WITH required_columns AS (
    SELECT 'centers' as t, 'id' as c UNION ALL
    SELECT 'centers', 'name' UNION ALL
    SELECT 'centers', 'slug' UNION ALL
    SELECT 'user_profiles', 'id' UNION ALL
    SELECT 'user_profiles', 'center_id' UNION ALL
    SELECT 'user_profiles', 'role' UNION ALL
    SELECT 'user_profiles', 'name' UNION ALL
    SELECT 'therapists', 'id' UNION ALL
    SELECT 'therapists', 'profile_id' UNION ALL
    SELECT 'therapists', 'center_id' UNION ALL
    SELECT 'therapists', 'name' UNION ALL
    SELECT 'children', 'id' UNION ALL
    SELECT 'children', 'center_id' UNION ALL
    SELECT 'children', 'name' UNION ALL
    SELECT 'children', 'birth_date' UNION ALL
    SELECT 'children', 'invitation_code' UNION ALL
    SELECT 'schedules', 'id' UNION ALL
    SELECT 'schedules', 'center_id' UNION ALL
    SELECT 'schedules', 'child_id' UNION ALL
    SELECT 'schedules', 'therapist_id' UNION ALL
    SELECT 'schedules', 'start_time' UNION ALL
    SELECT 'schedules', 'status' UNION ALL
    SELECT 'schedules', 'date' UNION ALL
    SELECT 'payments', 'id' UNION ALL
    SELECT 'payments', 'center_id' UNION ALL
    SELECT 'payments', 'child_id' UNION ALL
    SELECT 'payments', 'amount' UNION ALL
    SELECT 'payments', 'payment_month' UNION ALL
    SELECT 'payment_items', 'id' UNION ALL
    SELECT 'payment_items', 'payment_id' UNION ALL
    SELECT 'development_assessments', 'child_id' UNION ALL
    SELECT 'development_assessments', 'summary' UNION ALL
    SELECT 'site_visits', 'center_id' UNION ALL
    SELECT 'site_visits', 'source_category' UNION ALL
    SELECT 'counseling_logs', 'content' UNION ALL
    SELECT 'programs', 'center_id' UNION ALL
    SELECT 'programs', 'price'
),
check_results AS (
    SELECT 
        rc.t as table_name,
        rc.c as column_name,
        EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = rc.t 
            AND column_name = rc.c
        ) as exists
    FROM required_columns rc
)
SELECT * FROM check_results WHERE exists = false;

-- Table checks
SELECT 'Missing Tables' as category, table_name
FROM (
    SELECT unnest(ARRAY[
        'centers', 'user_profiles', 'therapists', 'parents', 'children', 
        'schedules', 'payments', 'payment_items', 'consultations', 'programs', 
        'rooms', 'admin_settings', 'family_relationships', 'development_assessments', 
        'site_visits', 'counseling_logs', 'vouchers'
    ]) as table_name
) t
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = t.table_name
);
