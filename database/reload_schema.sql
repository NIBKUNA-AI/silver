-- ✨ [Server Sync] Reload PostgREST Schema Cache
-- This command forces Supabase API to refresh its understanding of the database structure.
-- Execute this in the Supabase SQL Editor.

NOTIFY pgrst, 'reload schema';
