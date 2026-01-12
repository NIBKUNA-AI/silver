-- ============================================================
-- 📝 [FIX_SCHEMA] 스키마 불일치 수정
-- 1. counseling_logs 테이블에 누락된 'content' 컬럼 추가
-- 2. Schedule 가시성 문제 해결을 위한 RLS 점검 로직 포함
-- ============================================================

-- 1. 상담 일지(counseling_logs)에 content 컬럼 추가
-- (기존에 activities, child_response 등만 있고 content가 없어서 500 에러 발생)

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'counseling_logs' AND column_name = 'content') THEN 
        ALTER TABLE public.counseling_logs ADD COLUMN content TEXT; 
        RAISE NOTICE 'Added content column to counseling_logs';
    END IF;
END $$;

-- 2. 상담 일지 RLS 재확인 (Nuclear Fix 이후 한 번 더 확실하게)
-- 특히 'content' 컬럼이 추가되었으므로 정책이 잘 적용되는지 확인

DROP POLICY IF EXISTS "p_logs_admin_all" ON public.counseling_logs;
DROP POLICY IF EXISTS "p_logs_therapist" ON public.counseling_logs;
DROP POLICY IF EXISTS "p_logs_parent_read" ON public.counseling_logs;

CREATE POLICY "p_logs_admin_all" ON public.counseling_logs FOR ALL USING (public.is_admin());

CREATE POLICY "p_logs_therapist" ON public.counseling_logs 
    FOR ALL USING (therapist_id = auth.uid());

CREATE POLICY "p_logs_parent_read" ON public.counseling_logs 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.children c
            LEFT JOIN public.family_relationships fr ON fr.child_id = c.id
            WHERE c.id = counseling_logs.child_id
            AND (c.parent_id = auth.uid() OR fr.parent_id = auth.uid())
        )
    );

SELECT '✅ 상담일지 스키마 수정(Content 컬럼 추가) 및 정책 재적용 완료' AS result;
