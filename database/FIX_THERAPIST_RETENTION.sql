-- ============================================
-- 🛠️ 고용 상태 및 아동 기록 보존을 위한 스키마 보완
-- 목적: 치료사가 퇴사/계정 삭제되어도 아동 상담/치료 기록은 보존되도록 FK 수정
-- ============================================

-- 1. therapists 테이블의 profile_id 제약 조건을 SET NULL로 변경
-- 기존 CASCADE는 계정 삭제 시 치료사 정보까지 날려버려 역사적 기록(일지 등)이 손실됨
ALTER TABLE public.therapists 
DROP CONSTRAINT IF EXISTS therapists_profile_id_fkey,
ADD CONSTRAINT therapists_profile_id_fkey 
FOREIGN KEY (profile_id) 
REFERENCES public.user_profiles(id) 
ON DELETE SET NULL;

-- 2. 상담일지/일정 등의 작성자(therapist_id)는 이미 SET NULL이 권장되나 확인
-- (schema.sql에서 이미 SET NULL로 되어 있을 확률이 높음)

COMMENT ON COLUMN public.therapists.system_status IS 'active(근무), retired(퇴사), pending(대기)';
