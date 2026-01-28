-- =======================================================
-- 👻 CLEANUP GHOST USERS
-- =======================================================
-- Deletes any auth.users that do not have a matching record in public.user_profiles.
-- This effectively removes "stuck" accounts that failed during registration.
-- =======================================================

DO $$
DECLARE
    deleted_count INT;
BEGIN
    -- 1. Count ghosts before
    SELECT COUNT(*) INTO deleted_count
    FROM auth.users
    WHERE id NOT IN (SELECT id FROM public.user_profiles);

    RAISE NOTICE 'Found % ghost users. Deleting now...', deleted_count;

    -- 2. Delete ghosts
    DELETE FROM auth.users
    WHERE id NOT IN (SELECT id FROM public.user_profiles);

    RAISE NOTICE '✅ Cleanup complete. All ghost accounts removed.';
END $$;
