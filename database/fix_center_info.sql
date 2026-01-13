-- ============================================================
-- 📝 POPULATE CENTER INFO (Address, Phone, etc.)
-- ============================================================

-- Update the main center (Jamsil Branch) with real-looking data
UPDATE public.centers
SET 
    address = '서울 송파구 올림픽로 300 롯데월드타워 10층',
    phone = '02-1234-5678',
    email = 'help@zarada.co.kr',
    -- Set Hours
    weekday_hours = '09:00 - 20:00',
    saturday_hours = '09:00 - 17:00'
WHERE name = '자라다 아동발달센터 잠실점' OR name = 'Jamsil Branch';

-- Also ensure branding logic uses this
INSERT INTO public.admin_settings (center_id, key, value)
SELECT id, 'address', '서울 송파구 올림픽로 300 롯데월드타워 10층'
FROM public.centers WHERE name = '자라다 아동발달센터 잠실점'
ON CONFLICT (center_id, key) DO UPDATE SET value = '서울 송파구 올림픽로 300 롯데월드타워 10층';

INSERT INTO public.admin_settings (center_id, key, value)
SELECT id, 'phone', '02-1234-5678'
FROM public.centers WHERE name = '자라다 아동발달센터 잠실점'
ON CONFLICT (center_id, key) DO UPDATE SET value = '02-1234-5678';

NOTIFY pgrst, 'reload schema';
