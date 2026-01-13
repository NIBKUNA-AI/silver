
-- Verify Trigger for New User
select tgname, tgrelid::regclass, tgfoid::regproc, tgenabled 
from pg_trigger 
where tgname = 'on_auth_user_created';

-- Check Function Definition
select prosrc from pg_proc where proname = 'handle_new_user';

-- Check if role default is correct
SELECT column_name, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'role';
