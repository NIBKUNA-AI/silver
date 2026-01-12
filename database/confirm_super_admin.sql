-- 1. Ensure user_profiles has the correct role for 'anukbin@gmail.com'
--    This script forces the role to 'super_admin' and status to 'active'.

-- Get the ID from auth.users (if possible, otherwise assumes linked by email in profiles if manual sync exists)
-- Ideally we update based on the ID joined from auth.users

UPDATE public.user_profiles
SET 
  role = 'super_admin',
  status = 'active'
FROM auth.users
WHERE public.user_profiles.id = auth.users.id
  AND auth.users.email = 'anukbin@gmail.com';

-- Just in case the profile doesn't exist but the user does, insert it:
INSERT INTO public.user_profiles (id, email, name, role, status)
SELECT 
  id, 
  email, 
  'An Uk-bin', 
  'super_admin', 
  'active'
FROM auth.users 
WHERE email = 'anukbin@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'super_admin', status = 'active';

-- Output result
SELECT * FROM public.user_profiles 
WHERE email = 'anukbin@gmail.com';
