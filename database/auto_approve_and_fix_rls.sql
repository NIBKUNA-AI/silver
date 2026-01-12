-- ============================================================
-- Zarada ERP: 권한 및 정책 완전 초기화 (Robust Fix)
-- 🚨 "Policy already exists" 에러 방지 버전
-- 작성자: 안욱빈
-- ============================================================

-- 1. user_profiles 정책 초기화
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (이름이 다를 수 있으므로 가능한 모든 이름 삭제)
DROP POLICY IF EXISTS "profiles_zero_dep_self" ON user_profiles;
DROP POLICY IF EXISTS "profiles_zero_dep_super_admin" ON user_profiles;
DROP POLICY IF EXISTS "profiles_self" ON user_profiles;
DROP POLICY IF EXISTS "profiles_jwt_super_admin" ON user_profiles;
DROP POLICY IF EXISTS "Allow full access" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_read_all" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_self" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_super_admin_all" ON user_profiles;

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 새 정책 생성
CREATE POLICY "user_profiles_read_all" ON user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_profiles_update_self" ON user_profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "user_profiles_super_admin_all" ON user_profiles FOR ALL TO authenticated USING ((auth.jwt() ->> 'email') = 'anukbin@gmail.com') WITH CHECK ((auth.jwt() ->> 'email') = 'anukbin@gmail.com');


-- 2. Therapists 정책 초기화
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to therapists" ON therapists;
CREATE POLICY "Allow full access to therapists" ON therapists FOR ALL USING (true) WITH CHECK (true);


-- 3. Admin Notifications 정책 초기화
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to admin_notifications" ON admin_notifications;
CREATE POLICY "Allow full access to admin_notifications" ON admin_notifications FOR ALL USING (true) WITH CHECK (true);


-- 4. Blog Posts 정책 초기화 (블로그 오류 해결)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to blog_posts" ON blog_posts;
DROP POLICY IF EXISTS "Enable read access for all users" ON blog_posts;
CREATE POLICY "Allow full access to blog_posts" ON blog_posts FOR ALL USING (true) WITH CHECK (true);


-- 5. Trigger 업데이트 (회원가입 시 자동 치료사 승인)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role, status)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', '사용자'), 
    CASE WHEN new.email = 'anukbin@gmail.com' THEN 'super_admin' ELSE 'therapist' END,
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    role = CASE WHEN EXCLUDED.email = 'anukbin@gmail.com' THEN 'super_admin' ELSE COALESCE(user_profiles.role, 'therapist') END,
    status = 'active';

  INSERT INTO public.therapists (id, name, email, color)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', '사용자'), new.email, '#3b82f6')
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. 기존 Pending 상태 일괄 승인
UPDATE user_profiles SET role = 'therapist', status = 'active' WHERE status = 'pending' OR status IS NULL;
UPDATE user_profiles SET role = 'super_admin', status = 'active' WHERE email = 'anukbin@gmail.com';


SELECT '✅ 정책 재설정 완료' AS result;
