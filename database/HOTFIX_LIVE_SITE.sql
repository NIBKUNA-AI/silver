-- ============================================================
-- 🔥 [HOTFIX_LIVE_SITE] 라이브 사이트 즉시 정상화 패치
-- 프론트엔드 배포 없이도 400 에러를 막기 위해 DB 제약조건을 완화합니다.
-- ============================================================

-- 1. session_date에 기본값(오늘) 부여
-- 현재 라이브된 프론트엔드가 session_date를 안 보내서 에러가 나므로, DB가 알아서 채우도록 설정
ALTER TABLE public.counseling_logs 
    ALTER COLUMN session_date SET DEFAULT CURRENT_DATE;

-- 혹시 몰라 NULL 허용으로 변경 (더 강력한 방어)
ALTER TABLE public.counseling_logs 
    ALTER COLUMN session_date DROP NOT NULL;

-- 2. content 컬럼이 확실히 있는지 재확인 (없으면 추가)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'counseling_logs' AND column_name = 'content') THEN 
        ALTER TABLE public.counseling_logs ADD COLUMN content TEXT; 
    END IF;
END $$;

-- 3. RLS 정책 재확인 (치료사가 일지/평가 볼 수 있도록)
DROP POLICY IF EXISTS "p_logs_therapist_insert" ON public.counseling_logs;
CREATE POLICY "p_logs_therapist_insert" ON public.counseling_logs 
    FOR INSERT WITH CHECK (auth.uid() = therapist_id OR public.is_admin());

SELECT '✅ 라이브 핫픽스 완료. 이제 배포 없이도 상담일지 생성이 가능합니다.' AS result;
