
-- Check if 'profiles' table exists and what it is
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'profiles' OR table_name = 'user_profiles';

-- Check row counts
SELECT 'profiles' as table_name, count(*) FROM profiles
UNION ALL
SELECT 'user_profiles' as table_name, count(*) FROM user_profiles;
