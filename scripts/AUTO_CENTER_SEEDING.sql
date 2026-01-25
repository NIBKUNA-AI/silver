-- 🏗️ [ZARADA SAAS] AUTO-CONFIG & ANTI-EMPTY-SHELL SYSTEM
-- Description: 1. 새 지점 생성 시 자동 기본 설정(Seed) 트리거
--              2. SEO 및 브랜딩 기본값 강제 할당 (잠실점 데이터 오염 방지)

-- 1. [Seed Function] 지점 생성 시 호출될 함수
CREATE OR REPLACE FUNCTION public.seed_center_defaults()
RETURNS trigger AS $$
BEGIN
  -- 1.1 기본 관리자 설정 (admin_settings) 자동 생성
  -- 기본 문구 및 UI 설정을 지점 이름에 맞춰 동적으로 생성합니다.
  INSERT INTO public.admin_settings (center_id, key, value) VALUES
    (NEW.id, 'center_name', NEW.name),
    (NEW.id, 'home_title', NEW.name || '에 오신 것을 환영합니다'),
    (NEW.id, 'home_subtitle', '아이들의 무한한 가능성을 함께 발견합니다.'),
    (NEW.id, 'about_intro_text', NEW.name || '은 아이들의 건강한 성장을 돕는 전문 기관입니다.'),
    (NEW.id, 'brand_color', '#4f46e5'), -- Default Indigo
    (NEW.id, 'center_phone', '02-000-0000'),
    (NEW.id, 'center_address', '지점 주소를 등록해주세요.'),
    (NEW.id, 'weekday_hours', '10:00 - 19:00'),
    (NEW.id, 'saturday_hours', '09:00 - 16:00'),
    (NEW.id, 'holiday_text', '일요일/공휴일 휴무');

  -- 1.2 기본 카테고리/프로그램 (선택 사항 - 여기서는 생략하나 필요시 추가 가능)
  
  -- 1.3 초기 마케팅 트래픽 통계 0점 조정 (선택사항)

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. [Trigger] Centers 테이블에 인서트 후 실행
DROP TRIGGER IF EXISTS tr_seed_center_defaults ON public.centers;
CREATE TRIGGER tr_seed_center_defaults
  AFTER INSERT ON public.centers
  FOR EACH ROW EXECUTE FUNCTION public.seed_center_defaults();


-- 3. [Data Integrity] 기존에 존재하는 '깡통' 지점들에 대해서는 수동으로 기본값 인서트 (중복 무시)
INSERT INTO public.admin_settings (center_id, key, value)
SELECT id, 'center_name', name FROM public.centers
ON CONFLICT (center_id, key) DO NOTHING;

INSERT INTO public.admin_settings (center_id, key, value)
SELECT id, 'home_title', name || '에 오신 것을 환영합니다' FROM public.centers
ON CONFLICT (center_id, key) DO NOTHING;


-- ✅ 지점 자동 초기화 시스템 배포 완료
DO $$ BEGIN RAISE NOTICE '🏆 Zarada SaaS Auto-Seeding System Deployed. New centers will no longer be empty shells.'; END $$;
