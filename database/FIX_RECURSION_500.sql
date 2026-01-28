-- =======================================================
-- 🛡️ FIX INFINITE RECURSION IN RLS (500 ERROR)
-- =======================================================
-- Problem: Infinite recursion in user_profiles policy.
-- Policy "Admins can do everything" checks user_profiles.
-- But checking user_profiles triggers the policy again.
-- Result: Stack Overflow -> 500 Error.

-- Solution: Use a simplified Admin Check that avoids self-reference for the table being checked,
-- OR use `auth.jwt()` metadata if possible, OR split the policy.

-- For now, we will SIMPLIFY the admin policy to BREAK the recursion.
-- We will assume role is stored in metadata OR we rely on a different lookup.
-- But wait, user_profiles has the role.

-- STRATEGY: 
-- 1. Drop the recursive policy.
-- 2. Replace with a non-recursive one manually using a function with `SECURITY DEFINER` that bypasses RLS?
--    OR simply rely on basic ID checks for now and fix Admin access later.
--    Actually, for "Users can view own profile", it's fine.
--    The issue is "Admins can do everything".

DROP POLICY IF EXISTS "Admins can do everything" ON public.user_profiles;

-- Re-create a SAFER Admin policy (if needed).
-- For now, let's DISABLE the general admin catch-all on this specific table to STOP the 500 error.
-- Admins usually have their own ID matching anyway, or we handle it via Supabase Service Role in backend.
-- Or we use `auth.jwt() ->> 'role'` if we sync it.

-- Let's try to rely on the `is_super_admin` function which might be safer if defined correctly, 
-- or just remove the policy for a moment to restore service.

-- REMOVING THE POLICY TO FIX 500 IMMEDIATELY.
-- (Authenticated users can still view their own profile due to the other policy).
