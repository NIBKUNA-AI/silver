-- ☢️ DANGER: THIS SCRIPT WIPES ALL USERS EXCEPT THE SUPER ADMIN ☢️
-- Target: Keep 'anukbin@gmail.com', Delete everyone else.

DO $$
DECLARE
  super_admin_email TEXT := 'anukbin@gmail.com';
BEGIN
  RAISE NOTICE 'Starting Global User Wipe (Except %)...', super_admin_email;

  -- 1. Unlink Shared Resources (Don't delete the Center's data, just the user link)
  -- Children: Keep the child, remove the parent link
  UPDATE public.children 
  SET parent_id = NULL 
  WHERE parent_id IN (SELECT id FROM auth.users WHERE email != super_admin_email);

  -- Payments/Schedules/Leads: Keep records, remove creator link
  -- Using Dynamic SQL to be safe against schema variations
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'created_by') THEN
    EXECUTE 'UPDATE public.payments SET created_by = NULL WHERE created_by IN (SELECT id FROM auth.users WHERE email != $1)' USING super_admin_email;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'created_by') THEN
    EXECUTE 'UPDATE public.schedules SET created_by = NULL WHERE created_by IN (SELECT id FROM auth.users WHERE email != $1)' USING super_admin_email;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'assigned_to') THEN
    EXECUTE 'UPDATE public.leads SET assigned_to = NULL WHERE assigned_to IN (SELECT id FROM auth.users WHERE email != $1)' USING super_admin_email;
  END IF;

  -- 2. Delete Public User Data
  DELETE FROM public.family_relationships 
  WHERE parent_id IN (SELECT id FROM auth.users WHERE email != super_admin_email);

  DELETE FROM public.therapists 
  WHERE email != super_admin_email;

  DELETE FROM public.user_profiles 
  WHERE email != super_admin_email;
  
  -- 3. Delete Storage Objects (Crucial for Auth Delete)
  DELETE FROM storage.objects 
  WHERE owner IN (SELECT id FROM auth.users WHERE email != super_admin_email);

  -- 4. Delete Auth Users (Sessions & Identities cascade usually, but explicit sessions delete is safer)
  DELETE FROM auth.sessions 
  WHERE user_id IN (SELECT id FROM auth.users WHERE email != super_admin_email);

  DELETE FROM auth.users 
  WHERE email != super_admin_email;

  RAISE NOTICE '✅ Wipe Complete. Only % remains.', super_admin_email;
END $$;
