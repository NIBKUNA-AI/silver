
-- Deep Debug
-- 1. Check User Profile for Anukbin
SELECT id, email, role, center_id FROM public.user_profiles WHERE email = 'anukbin@gmail.com';

-- 2. Check Consultations Data (Crucial columns)
SELECT id, child_name, center_id, schedule_id, status, created_at 
FROM public.consultations 
ORDER BY created_at DESC LIMIT 5;

-- 3. Check Center IDs
SELECT id, name FROM public.centers;

-- 4. Check if the RLS policy is actually active
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'consultations';
