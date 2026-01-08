-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow public (anon) users to READ only published posts
CREATE POLICY "Public users can view published posts"
ON blog_posts
FOR SELECT
TO anon
USING (is_published = true);

-- Policy 2: Allow authenticated users (admin/staff/manager) to do EVERYTHING
-- Adjust logic based on exact role requirements if needed, but 'authenticated' covers logged-in users.
-- If strict role checks are needed: (auth.jwt() ->> 'role' IN ('admin', 'manager'))
CREATE POLICY "Admins can manage all posts"
ON blog_posts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
