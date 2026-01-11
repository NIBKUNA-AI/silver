-- ============================================
-- 🔧 Development Assessments Enhancement Migration
-- Date: 2026-01-11
-- Purpose: Add therapist_notes column for private therapist notes
-- ============================================

-- Add therapist_notes column to development_assessments table
ALTER TABLE development_assessments 
ADD COLUMN IF NOT EXISTS therapist_notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN development_assessments.therapist_notes IS 'Private notes visible only to therapists and admins, hidden from parents';
