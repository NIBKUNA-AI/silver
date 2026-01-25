-- 🚀 [ZARADA SAAS] FINAL DEPLOYMENT PREPARATION
-- 📅 Date: 2026-01-25
-- 📝 Description: Cleans up all test data (test-a, test-b) and resets Super Admin for production.

BEGIN;

-- 1. [Cleanup] Remove Isolation Test Data
-- Deleting children first to respect FK (though CASCADE might be on, explicit is safer)
DELETE FROM public.children WHERE name LIKE '지점%_아이' OR name LIKE '격리테스트%';
DELETE FROM public.counseling_logs WHERE child_id IN (SELECT id FROM public.children WHERE center_id IN (SELECT id FROM public.centers WHERE slug IN ('test-a', 'test-b')));
DELETE FROM public.schedules WHERE child_id IN (SELECT id FROM public.children WHERE center_id IN (SELECT id FROM public.centers WHERE slug IN ('test-a', 'test-b')));

-- Unlink profiles from test centers before deletion
UPDATE public.user_profiles 
SET center_id = NULL 
WHERE center_id IN (SELECT id FROM public.centers WHERE slug IN ('test-a', 'test-b'));

-- Delete the test centers
DELETE FROM public.centers WHERE slug IN ('test-a', 'test-b');

-- 2. [Super Admin Reset] Ensure 'anukbin@gmail.com' is Global Super Admin
UPDATE public.user_profiles
SET 
    role = 'super_admin',
    center_id = NULL, -- NULL means Global View (Access to All via Policy Bypass)
    status = 'active'
WHERE email = 'anukbin@gmail.com';

-- 3. [Verification]
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.centers WHERE slug IN ('test-a', 'test-b')) THEN
        RAISE EXCEPTION '❌ Test centers were not removed.';
    END IF;
END $$;

COMMIT;

SELECT '✅ System is Clean & Ready for Production Deployment. Super Admin (anukbin@gmail.com) restored to Global Mode.' AS status;
