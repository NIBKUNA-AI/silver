-- =======================================================
-- 🕵️ DIAGNOSTIC & FIX: REMOVE CASE-INSENSITIVE CONFLICTS
-- =======================================================

BEGIN;

-- 1. Log what we are about to delete (for debug)
INSERT INTO public.debug_logs (message, details)
SELECT 'Deleting Conflicting Profile', id || ' : ' || email 
FROM public.user_profiles 
WHERE LOWER(email) = LOWER('zombi00000@naver.com');

-- 2. Delete Conflicting Profiles (Case Insensitive)
DELETE FROM public.user_profiles WHERE LOWER(email) = LOWER('zombi00000@naver.com');
DELETE FROM public.parents WHERE LOWER(email) = LOWER('zombi00000@naver.com');

-- 3. Delete Auth User (Case Insensitive - via email match if possible)
--    Note: Auth table might not be accessible via LOWER match easily, but we try standard email.
DELETE FROM auth.users WHERE email = 'zombi00000@naver.com';

-- 4. Verify Constraints
--    Dropping the email unique constraint on user_profiles if it exists, to rely on ID.
--    Or, we ensure it matches 1:1 with Auth. 
--    Strictly speaking, if Auth has unique email, profiles should too. 
--    But for now, to ensure signup proceeds, we clean up.

COMMIT;
