-- ✨ [Verify RLS] Check if current user is super admin and can see all centers
-- Execute this in Supabase SQL Editor

-- 1. Check Function Logic
SELECT * FROM public.is_super_admin();

-- 2. Check Center Access (simulate RLS)
-- Note: This is a static check. True RLS verification requires switching roles, 
-- but this confirms the function returns true for the email.

SELECT 
    auth.uid() as current_uid,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_email,
    public.is_super_admin() as is_super_admin_result;
