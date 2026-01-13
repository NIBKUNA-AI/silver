-- ✨ [Session Refresh] Force Schema Reload
-- This helps in clearing any cached RLS policies on the server side.
NOTIFY pgrst, 'reload schema';

-- For RLS to work instantly, sometimes previous prepared statements need clearance.
DISCARD PLANS;
