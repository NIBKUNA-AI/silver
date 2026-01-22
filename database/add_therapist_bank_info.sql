-- 🏦 [SCHEMA UPDATE] Add Bank Info Columns to Therapists Table
-- Description: 치료사/직원 정산용 계좌 정보를 저장할 컬럼을 추가합니다.

BEGIN;

-- 1. Add 'bank_name'
ALTER TABLE public.therapists 
ADD COLUMN IF NOT EXISTS bank_name text;

-- 2. Add 'account_number'
ALTER TABLE public.therapists 
ADD COLUMN IF NOT EXISTS account_number text;

-- 3. Add 'account_holder'
ALTER TABLE public.therapists 
ADD COLUMN IF NOT EXISTS account_holder text;

-- Add comments for clarity
COMMENT ON COLUMN public.therapists.bank_name IS '정산 은행명';
COMMENT ON COLUMN public.therapists.account_number IS '정산 계좌번호';
COMMENT ON COLUMN public.therapists.account_holder IS '예금주 (본인 아닐 수 있음)';

COMMIT;

DO $$ BEGIN RAISE NOTICE '✅ Therapists Table Updated with Bank Columns.'; END $$;
