-- Seed Data for New Center Deployment
-- Use this script to set up the INITIAL center and admin settings.

-- 1. Insert Center Info
-- REPLACE these values with the actual center details before running!
WITH new_center AS (
    INSERT INTO public.centers (name, address, phone, email)
    VALUES (
        'New Child Development Center', -- [Config] Center Name
        'Seoul, Korea',                 -- [Config] Center Address
        '02-1234-5678',                 -- [Config] Center Phone
        'admin@example.com'             -- [Config] Center Email
    )
    RETURNING id
)
-- 2. Insert Default Admin Settings
INSERT INTO public.admin_settings (key, value)
VALUES 
    -- Branding
    ('center_name', 'New Child Development Center'),
    ('center_phone', '02-1234-5678'),
    ('center_address', 'Seoul, Korea'),
    ('center_map_url', ''), 
    ('center_logo', ''),

    -- Home Page Texts
    ('home_title', 'Growing Together'),
    ('home_subtitle', 'Professional Child Development Center'),
    ('main_banner_url', ''),
    
    -- About Page
    ('about_intro_text', 'We help children grow with love and expertise.'),
    ('about_desc_title', 'Why Choose Us?'),
    ('about_desc_body', 'We provide personalized therapy for every child.'),
    
    -- Contact & Social
    ('kakao_url', 'https://pf.kakao.com/...'),
    ('notice_text', 'Welcome to our new homepage!'),
    
    -- Programs
    ('programs_intro_text', 'Our specialized programs regarding Speech, Play, and Art therapy.'),
    ('programs_list', '[
        {"id":"1", "title":"Language Therapy", "eng":"Language", "desc":"Improving communication skills.", "targets":["Delayed Speech"], "icon_name":"MessageCircle"},
        {"id":"2", "title":"Play Therapy", "eng":"Play", "desc":"Emotional healing through play.", "targets":["Emotional Issues"], "icon_name":"Heart"}
    ]');
