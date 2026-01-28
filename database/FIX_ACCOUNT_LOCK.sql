-- =================================================
-- 🔓 UNLOCK ACCOUNT SCRIPT
-- Run this to immediately delete the stuck account.
-- =================================================

-- 1. Grant permission so the App can call this if needed
GRANT EXECUTE ON FUNCTION public.force_cleanup_user_by_email(text) TO anon, authenticated, service_role;

-- 2. Execute the cleanup RIGHT NOW for the stuck email
SELECT public.force_cleanup_user_by_email('zombi00000@naver.com');

-- 3. Also direct delete just in case the function has issues (Redundant Safety)
DELETE FROM auth.users WHERE email = 'zombi00000@naver.com';

-- 4. Verify
DO $$
DECLARE
  found_count INT;
BEGIN
  SELECT count(*) INTO found_count FROM auth.users WHERE email = 'zombi00000@naver.com';
  IF found_count = 0 THEN
    RAISE NOTICE '✅ SUCCESS: Account zombi00000@naver.com has been completely removed. You can register now.';
  ELSE
    RAISE NOTICE '❌ WARNING: Account still exists. Please check permissions.';
  END IF;
END $$;
