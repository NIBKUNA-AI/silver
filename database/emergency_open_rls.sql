-- [Emergency Access] Force Open RLS for Therapists (If Diagnostic says 0)
-- CAUTION: This allows ANY logged-in user to see ALL therapists. Use for debugging only.

ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON therapists;

-- Allow EVERYONE (authenticated) to see everything
CREATE POLICY "Enable read access for all users" 
ON therapists 
FOR SELECT 
TO authenticated 
USING (true);
