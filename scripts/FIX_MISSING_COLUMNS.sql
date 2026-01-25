-- 🚨 [CRITICAL FIX] Add missing center_id columns for SaaS isolation
-- Description: children, therapists 테이블에 center_id가 없어 발생하는 400 에러를 해결합니다.

-- 1. children 테이블 보정
ALTER TABLE public.children 
ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id);

-- 2. therapists 테이블 보정
ALTER TABLE public.therapists 
ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id);

-- 3. 기존 데이터가 있다면 현재 사용자의 센터 ID로 채우기 (데이터 복구)
-- (실행 전 get_my_center_id() 함수가 존재하는지 확인 필요)
DO $$
DECLARE
  default_center_id uuid;
BEGIN
  SELECT id INTO default_center_id FROM public.centers LIMIT 1;
  
  UPDATE public.children SET center_id = default_center_id WHERE center_id IS NULL;
  UPDATE public.therapists SET center_id = default_center_id WHERE center_id IS NULL;
END $$;
