-- 🛡️ CREATE SUPER ADMIN (Sovereign Template)
-- Description: 안욱빈 원장님 계정을 최상위 관리자(super_admin)로 설정합니다.
-- Usage: Supabase SQL Editor에서 실행하세요.

-- 1. UUID 및 비밀번호 해싱 설정 (pgcrypto 필요)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  user_email TEXT := 'anukbin@gmail.com';
  raw_password TEXT := 'anukbin123!';
BEGIN
  -- 2. auth.users 테이블에 슈퍼 어드민 계정 생성 (이미 있으면 건너뜀)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      confirmation_token,
      email_change,
      email_change_sent_at,
      is_super_admin,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_sent_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at,
      is_sso_user,
      deleted_at,
      is_anonymous
    )
    VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      user_email,
      crypt(raw_password, gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "안욱빈", "role": "super_admin"}',
      now(),
      now(),
      'authenticated',
      '',
      '',
      NULL,
      FALSE,
      NULL,
      NULL,
      '',
      NULL,
      '',
      0,
      NULL,
      '',
      NULL,
      FALSE,
      NULL,
      FALSE
    );

    -- 3. auth.identities 테이블 연결
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      new_user_id,
      new_user_id,
      format('{"sub":"%s","email":"%s"}', new_user_id::text, user_email)::jsonb,
      'email',
      user_email,
      now(),
      now(),
      now()
    );

    -- 4. public.user_profiles 테이블에 관리자 권한 부여
    INSERT INTO public.user_profiles (
      id,
      email,
      name,
      role,
      status,
      center_id,
      created_at,
      updated_at
    )
    VALUES (
      new_user_id,
      user_email,
      '안욱빈',
      'super_admin',
      'active',
      NULL,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET role = 'super_admin', status = 'active', center_id = NULL;

    RAISE NOTICE 'Super Admin user created successfully.';
  ELSE
    -- 기존 유저가 있다면 권한만 업데이트
    SELECT id INTO new_user_id FROM auth.users WHERE email = user_email;
    
    UPDATE auth.users 
    SET encrypted_password = crypt(raw_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now())
    WHERE id = new_user_id;

    INSERT INTO public.user_profiles (
      id, email, name, role, status, center_id
    ) VALUES (
      new_user_id, user_email, '안욱빈', 'super_admin', 'active', NULL
    )
    ON CONFLICT (id) DO UPDATE SET role = 'super_admin', status = 'active', center_id = NULL;

    RAISE NOTICE 'Existing user updated to Super Admin.';
  END IF;
END $$;
