-- ============================================================
-- 🧨 FORCE JAMSIL DATA ON ALL CENTERS (Brute Force Fix)
-- ============================================================

-- 1. Update ALL centers to use Jamsil Address/Phone
-- This ensures that whichever center is loaded as "First", it has the correct info.
UPDATE public.centers
SET 
    address = '서울 송파구 올림픽로 300 롯데월드타워 10층',
    phone = '02-1234-5678',
    -- Force Logo to NULL to triger the 'Z' text fallback in Header/Footer
    logo_url = NULL
WHERE true;

-- 2. Force Admin Settings as well
DELETE FROM public.admin_settings WHERE key IN ('center_address', 'center_phone', 'center_logo');

-- 3. Reload Schema
NOTIFY pgrst, 'reload schema';
