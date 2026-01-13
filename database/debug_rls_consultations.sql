
-- Check RLS Policies on consultations
select * from pg_policies wheretablename = 'consultations';

-- Check data in consultations
SELECT id, center_id, child_name, created_at FROM consultations ORDER BY created_at DESC;

-- Check all centers to see IDs
SELECT id, name, created_at FROM centers;

-- Check current user's (super admin) center_id connection (simulated)
-- We cannot see auth.uid() easily here without a function, but we can check profiles
SELECT id, email, center_id, role FROM user_profiles WHERE email = 'anukbin@gmail.com';
