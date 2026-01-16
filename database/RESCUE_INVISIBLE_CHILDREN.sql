-- 🚑 RESCUE MISSION: Fix Invisible Children 🚑
-- Description: Updates children records that have missing center_ids (NULL) to the correct Jamsil Center ID.

UPDATE public.children
SET center_id = '59d09adf-4c98-4013-a198-d7b26018fd29'
WHERE center_id IS NULL;

-- Verify results
SELECT id, name, center_id FROM public.children WHERE center_id = '59d09adf-4c98-4013-a198-d7b26018fd29';
