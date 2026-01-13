
-- Check constraints on children table
SELECT conname, confrelid::regclass, a.attname as child_col, af.attname as parent_col
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.conrelid = 'public.children'::regclass;

-- Check parent user existance
SELECT * FROM auth.users WHERE email = 'shinje1633@gmail.com';
SELECT * FROM public.user_profiles WHERE email = 'shinje1633@gmail.com';
