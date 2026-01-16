-- ☢️ DANGER: THIS SCRIPT WIPES ALL USERS EXCEPT THE SUPER ADMIN ☢️
-- Target: Keep 'anukbin@gmail.com', Delete everyone else.
-- Version: V3 (Dynamic Discovery of Auth Tables)

DO $$
DECLARE
  super_admin_email TEXT := 'anukbin@gmail.com';
  target_schema TEXT;
  target_table TEXT;
  r RECORD;
BEGIN
  RAISE NOTICE 'Starting Global User Wipe (Except %)...', super_admin_email;

  -- 1. Unlink Shared Resources
  UPDATE public.children 
  SET parent_id = NULL 
  WHERE parent_id IN (SELECT id FROM auth.users WHERE email != super_admin_email);

  -- Payments/Schedules/Leads linking...
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
  DELETE FROM public.admin_notifications
  WHERE user_id IN (SELECT id FROM auth.users WHERE email != super_admin_email);

  -- Check if activity_logs exists and delete
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
    DELETE FROM public.activity_logs
    WHERE user_id IN (SELECT id FROM auth.users WHERE email != super_admin_email);
  END IF;

  DELETE FROM public.family_relationships 
  WHERE parent_id IN (SELECT id FROM auth.users WHERE email != super_admin_email);

  DELETE FROM public.therapists 
  WHERE email != super_admin_email;

  DELETE FROM public.user_profiles 
  WHERE email != super_admin_email;
  
  -- 3. Delete Storage Objects
  DELETE FROM storage.objects 
  WHERE owner IN (SELECT id FROM auth.users WHERE email != super_admin_email);

  -- 4. Dynamic Delete from Auth Tables (Resolving 'relation does not exist' or schema issues)
  
  -- Targeted list of potential blocker tables in Auth schema (or wherever they are)
  -- We loop through finding them in information_schema to be sure of their location.
  FOR r IN 
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_name IN ('user_claims', 'mfa_factors', 'mfa_challenges', 'mfa_amr_claims', 'sso_sessions', 'saml_relay_states', 'flow_state', 'identities', 'sessions')
  LOOP
    BEGIN
      -- We assume they have a 'user_id' column. If not, this might fail, but most do.
      -- Exception: 'saml_relay_states' might not. We wrap in block.
      EXECUTE 'DELETE FROM ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || ' WHERE user_id IN (SELECT id FROM auth.users WHERE email != $1)' USING super_admin_email;
      RAISE NOTICE 'Cleaned up table %.%', r.table_schema, r.table_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipping table %.% (No user_id or other error): %', r.table_schema, r.table_name, SQLERRM;
    END;
  END LOOP;

  -- 5. Delete Auth Users
  DELETE FROM auth.users 
  WHERE email != super_admin_email;

  RAISE NOTICE '✅ Wipe Complete. Only % remains.', super_admin_email;
END $$;
