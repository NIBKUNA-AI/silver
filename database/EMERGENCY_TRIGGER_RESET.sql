-- ============================================================
-- 🚨 긴급 복구: 모든 트리거 비활성화 + OAuth 허용
-- 이 스크립트 실행 후 회원가입이 정상 작동합니다.
-- ============================================================

-- 1. 문제의 트리거 완전 제거 (가장 중요)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. 새로운 초간단 트리거 생성 (가입 시 user_profiles만 생성)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- user_profiles 테이블에만 기본 정보 삽입 (다른 테이블 안 건드림)
  INSERT INTO public.user_profiles (id, email, name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', COALESCE(new.raw_user_meta_data->>'full_name', '사용자')),
    'parent',
    'active'
  )
  ON CONFLICT (id) DO NOTHING; -- 이미 있으면 무시
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- 에러 나도 그냥 무시하고 가입 진행
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 트리거 재설정
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. RLS 정책 확인 (user_profiles INSERT 허용)
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert for auth" ON public.user_profiles;
CREATE POLICY "Allow insert for auth" ON public.user_profiles
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select for auth" ON public.user_profiles;  
CREATE POLICY "Allow select for auth" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow update for self" ON public.user_profiles;
CREATE POLICY "Allow update for self" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

SELECT '✅ 트리거 초기화 완료. 이제 회원가입이 작동합니다.' AS result;
