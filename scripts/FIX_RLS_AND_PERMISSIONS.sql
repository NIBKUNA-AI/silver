-- 🛡️ [ZARADA SAAS] RLS 및 권한 복구 스크립트
-- 이 스크립트는 현재 사용자를 super_admin으로 설정하여 센터 생성 권한 문제를 해결합니다.
-- Supabase SQL Editor에서 실행하세요.

DO $$
DECLARE
  v_emails TEXT[] := ARRAY['zaradajoo@gmail.com', 'anukbin@gmail.com'];
  v_email TEXT;
  v_name TEXT;
  v_user_id UUID;
BEGIN
  FOREACH v_email IN ARRAY v_emails
  LOOP
    -- 1. 이메일로 사용자 ID 및 메타데이터에서 이름 가져오기
    SELECT id, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', '관리자') 
    INTO v_user_id, v_name
    FROM auth.users WHERE email = v_email;

    IF v_user_id IS NOT NULL THEN
      -- 2. profiles 테이블에 super_admin 권한 부여 (이름 필드 추가)
      INSERT INTO public.profiles (id, email, name, role, status)
      VALUES (v_user_id, v_email, v_name, 'super_admin', 'active')
      ON CONFLICT (id) DO UPDATE SET 
        role = 'super_admin', 
        status = 'active',
        name = EXCLUDED.name;

      -- 3. 유저 메타데이터에도 반영
      UPDATE auth.users 
      SET raw_user_meta_data = raw_user_meta_data || '{"role": "super_admin"}'::jsonb
      WHERE id = v_user_id;

      RAISE NOTICE '✅ 사용자 % (%) 에게 super_admin 권한을 부여했습니다.', v_name, v_email;
    ELSE
      RAISE NOTICE '❌ 이메일 % 에 해당하는 사용자를 찾을 수 없습니다.', v_email;
    END IF;
  END LOOP;
END $$;

-- 4. Centers 테이블 RLS 정책 재확인 (슈퍼 어드민은 모든 작업 허용)
DROP POLICY IF EXISTS "centers_super_admin_all" ON public.centers;
CREATE POLICY "centers_super_admin_all" ON public.centers FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
  )
);
