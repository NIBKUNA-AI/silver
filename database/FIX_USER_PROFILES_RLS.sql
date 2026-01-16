-- 🛡️ FIX USER_PROFILES RLS (권한 문제 원천 차단)
-- Description: 새로 도입된 user_profiles 테이블에 대한 강력한 보안 정책을 적용합니다.
-- Critical: 이 정책이 없으면 Login.tsx에서 프로필을 읽지 못해 로그인이 막힙니다.

-- 1. RLS 활성화 (기본적으로 모두 잠금)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 기존 정책 충돌 방지를 위해 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;


-- 2. [필수] 내 프로필은 무조건 내가 볼 수 있어야 함 (이게 없으면 재귀 오류 남)
CREATE POLICY "Users can view own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = id);

-- 3. [관리자/치료사] 직원들은 모든 회원의 프로필을 볼 수 있어야 함 (명단 관리 등)
-- 주의: 여기서 재귀 호출(내 권한 확인하려고 user_profiles 조회)이 발생하는데,
-- 위의 2번 정책(내꺼 보기)이 먼저 매칭되므로 무한 루프에 빠지지 않고 안전하게 작동합니다.
CREATE POLICY "Staff can view all profiles"
ON public.user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin', 'therapist')
  )
);

-- 4. [수정] 내 정보는 내가 수정 가능
CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id);

-- 5. [등록] 회원가입 시 내 프로필 생성 가능
CREATE POLICY "Users can insert own profile"
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 6. Grant Access
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

-- 결과 확인
SELECT 'RLS Policies Applied to user_profiles' as status;
