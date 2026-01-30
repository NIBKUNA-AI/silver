-- Create Storage Buckets for Silver Care
-- Run this in Supabase SQL Editor

-- 1. 'images': General public assets (banners, logos, event photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 'signatures': Confidential signatures for documents (Authenticated only)
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', false)
ON CONFLICT (id) DO NOTHING;

-- 3. 'avatars': User/Recipient profile pictures (Public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 4. 'documents': PDF exports or uploaded scans (Authenticated only)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;


-- Set up RLS Policies (Security)

-- [images]
DROP POLICY IF EXISTS "Public Read Images" ON storage.objects;
CREATE POLICY "Public Read Images" ON storage.objects FOR SELECT
USING ( bucket_id = 'images' );

DROP POLICY IF EXISTS "Auth Upload Images" ON storage.objects;
CREATE POLICY "Auth Upload Images" ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'images' AND auth.role() = 'authenticated' );

-- [signatures]
DROP POLICY IF EXISTS "Auth Read Signatures" ON storage.objects;
CREATE POLICY "Auth Read Signatures" ON storage.objects FOR SELECT
USING ( bucket_id = 'signatures' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Auth Upload Signatures" ON storage.objects;
CREATE POLICY "Auth Upload Signatures" ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'signatures' AND auth.role() = 'authenticated' );

-- [avatars]
DROP POLICY IF EXISTS "Public Read Avatars" ON storage.objects;
CREATE POLICY "Public Read Avatars" ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Auth Upload Avatars" ON storage.objects;
CREATE POLICY "Auth Upload Avatars" ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- [documents]
DROP POLICY IF EXISTS "Auth Read Documents" ON storage.objects;
CREATE POLICY "Auth Read Documents" ON storage.objects FOR SELECT
USING ( bucket_id = 'documents' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Auth Upload Documents" ON storage.objects;
CREATE POLICY "Auth Upload Documents" ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'documents' AND auth.role() = 'authenticated' );
