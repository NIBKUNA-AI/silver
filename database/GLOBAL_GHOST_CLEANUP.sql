-- 🧹 GLOBAL GHOST CLEANUP SCRIPT (전체 유령 계정 청소)
-- -----------------------------------------------------------
-- 1. [Zombie Profiles] 인증 정보(Auth)는 없는데 프로필만 남은 경우 삭제
-- (탈퇴했으나 장부에 남은 데이터 제거)
DELETE FROM public.user_profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. [Zombie Therapists] 인증 정보(Auth)는 없는데 직원 명단에 ID가 있는 경우
-- (단, '초대 대기중(Invited)'인 사람은 Auth에 없는 게 정상이므로,
--  여기서는 'ID가 UUID 형식인데 Auth에 없는' 경우를 삭제하는 것이 안전하지만,
--  보통 직원 테이블은 email 매칭이 중요하므로, 
--  "이메일은 Auth에 존재하는데, ID가 다른 직원 레코드"를 삭제합니다.)

-- [Imposter Cleanup]
-- 설명: "실제 회원(Auth)이 이 이메일을 쓰고 있는데, 직원 명단에는 엉뚱한 ID로 적혀있는 경우"
-- 이것이 로그인/권한 에러의 주범입니다. 진짜 주인을 위해 가짜 자리를 비웁니다.
DELETE FROM public.therapists t
WHERE EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.email = t.email    -- 이메일이 같은 회원이 존재함
    AND au.id != t.id           -- 근데 그 회원의 ID와 직원 명단의 ID가 다름 (불일치)
);

-- 3. [Orphan Notifications] 주인 없는 알림 삭제
DELETE FROM public.admin_notifications
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 결과 확인
SELECT 'Cleanup Completed' as status;
