-- =======================================================
-- ☢️ NUCLEAR CLEANUP FOR ZOMBI00000
-- =======================================================
-- The 409 Conflict suggests an "Orphaned Record" exists in user_profiles
-- that is NOT linked to the current Auth User but shares the same Email.
-- This script deletes ANY record in profiles/parents matching the email,
-- regardless of ID match.
-- =======================================================

BEGIN;

-- 1. Delete Parents by Email
DELETE FROM public.parents WHERE email = 'zombi00000@naver.com';

-- 2. Delete User Profiles by Email
DELETE FROM public.user_profiles WHERE email = 'zombi00000@naver.com';

-- 3. Delete Auth User by Email
DELETE FROM auth.users WHERE email = 'zombi00000@naver.com';

-- 4. Delete ANY Orphaned Profiles (Garbage Collection)
--    (Profiles that have no matching Auth User)
DELETE FROM public.user_profiles
WHERE id NOT IN (SELECT id FROM auth.users);

COMMIT;

-- =======================================================
-- 🔍 DIAGNOSTIC: Check Constraints
-- List unique constraints on user_profiles to confirm if email is unique.
SELECT conname, pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'user_profiles' AND c.contype = 'u';
