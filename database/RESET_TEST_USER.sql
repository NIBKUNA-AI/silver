-- =======================================================
-- 🧹 RESET TEST DATA (USER REQUEST)
-- =======================================================
-- Removes the 'zombi00000@naver.com' user completely so the user can re-test the registration flow from scratch.
-- Confirms if the automated trigger works as expected without manual interference.

DO $$
DECLARE
    v_uid UUID;
BEGIN
    -- 1. Find the user ID
    SELECT id INTO v_uid FROM auth.users WHERE email = 'zombi00000@naver.com';

    IF v_uid IS NOT NULL THEN
        -- 2. Delete from dependent tables first (Cascade should handle this, but explicit clean is safer for logging)
        DELETE FROM public.parents WHERE profile_id = v_uid;
        DELETE FROM public.user_profiles WHERE id = v_uid;
        
        -- 3. Delete from Auth (This is the root)
        DELETE FROM auth.users WHERE id = v_uid;
        
        RAISE NOTICE '✅ User zombi00000@naver.com deleted for re-testing.';
    ELSE
        RAISE NOTICE '⚠️ User not found, nothing to delete.';
    END IF;
END $$;
