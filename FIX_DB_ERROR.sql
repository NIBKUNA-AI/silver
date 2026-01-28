-- 🚨 [긴급] Supabase 대시보드 SQL Editor에서 실행해주세요 🚨

BEGIN;

-- 1. 상담 일지(counseling_logs)의 잘못된 연결 고리 끊기
-- 기존에 잘못 연결된 제약조건(user_profiles 참조)을 삭제합니다.
ALTER TABLE public.counseling_logs DROP CONSTRAINT IF EXISTS counseling_logs_therapist_id_fkey;
ALTER TABLE public.counseling_logs DROP CONSTRAINT IF EXISTS counseling_logs_therapist_id_profile_id_fkey;

-- 2. 올바른 연결 고리 만들기
-- therapists 테이블을 바라보도록 수정합니다.
ALTER TABLE public.counseling_logs 
ADD CONSTRAINT counseling_logs_therapist_id_fkey 
FOREIGN KEY (therapist_id) 
REFERENCES public.therapists(id) 
ON DELETE SET NULL;

-- 3. 방문자 통계 에러 해결 (page_url 컬럼 추가)
ALTER TABLE public.site_visits ADD COLUMN IF NOT EXISTS page_url TEXT;

COMMIT;

-- ✅ 실행 완료 후 앱을 새로고침하면 정상 작동합니다.
