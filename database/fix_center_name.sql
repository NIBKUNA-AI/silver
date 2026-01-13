-- ============================================================
-- 🇰🇷 FIX CENTER NAME (Jamsil Branch -> Korean)
-- ============================================================

-- 1. Update Centers Table
UPDATE public.centers
SET name = '자라다 아동발달센터 잠실점'
WHERE name = 'Jamsil Branch' OR name = 'Child Growth Center';

-- 2. Update Admin Settings (if exists)
INSERT INTO public.admin_settings (center_id, key, value)
SELECT id, 'center_name', '자라다 아동발달센터 잠실점'
FROM public.centers
WHERE name = '자라다 아동발달센터 잠실점'
ON CONFLICT (center_id, key) DO UPDATE
SET value = '자라다 아동발달센터 잠실점';

-- 3. Force Schema Reload
NOTIFY pgrst, 'reload schema';
