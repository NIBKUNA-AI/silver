-- 🛠️ REPAIR SCRIPT for Missing User Profiles
-- -----------------------------------------------------------
-- 🖋️ Description: 
-- 회원가입 시 'profiles' 테이블에만 저장되고 'user_profiles'에는 
-- 누락된 사용자들을 찾아 복구합니다.
-- 이 스크립트를 실행하면 "Key (parent_id) is not present in table user_profiles" 에러가 해결됩니다.
-- -----------------------------------------------------------

-- 1. 🧹 [Ghost Buster] 강력한 유령 삭제 (이메일 충돌 시 기존 user_profiles 삭제)
DELETE FROM public.user_profiles up
USING public.profiles p
WHERE up.email = p.email AND up.id != p.id;

-- 2. 🏗️ [Repair] 누락된 프로필 복사 (이메일 중복 방지 + 충돌 무시)
INSERT INTO public.user_profiles (
    id, 
    email, 
    name, 
    role, 
    center_id, 
    status
)
SELECT DISTINCT ON (p.email) -- ✨ 중복 이메일이 있다면 하나만 선택
    p.id, 
    p.email, 
    p.name, 
    p.role, 
    p.center_id, 
    COALESCE(p.is_active, true) as status
FROM 
    public.profiles p
JOIN 
    auth.users au ON p.id = au.id -- ✨ [Zombie Filter] 실제 존재하는 유저만 복사 (FK 에러 방지)
WHERE 
    NOT EXISTS (
        SELECT 1 FROM public.user_profiles up WHERE up.id = p.id
    )
ON CONFLICT (email) DO NOTHING; -- ✨ 혹시 모를 잔여 충돌 방지

-- 만약 status 타입이 안 맞으면 아래 쿼리를 사용하세요 (텍스트 vs 불리언)
-- 대부분 status는 'active', 'inactive' 텍스트일 확률이 높음.
-- profiles.is_active가 boolean이라면:
-- CASE WHEN p.is_active THEN 'active' ELSE 'inactive' END

-- 확인용 출력
SELECT count(*) as repaired_profiles_count FROM public.user_profiles;
