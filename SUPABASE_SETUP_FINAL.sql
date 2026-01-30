-- ============================================
-- 📊 SILVER CARE SaaS: 통합 데이터베이스 설정 (Supabase)
-- 🛠️ 생성: Antigravity AI
-- 📅 날짜: 2026-01-28
-- ⚠️ 사용법: 이 스크립트 전체를 Supabase SQL Editor에서 실행하세요.
-- ============================================

-- 1. 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM 타입 정의
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'therapist', 'parent', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE schedule_status AS ENUM ('scheduled', 'completed', 'cancelled', 'makeup', 'carried_over');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. 핵심 테이블 생성 (centers)
CREATE TABLE IF NOT EXISTS public.centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    business_number VARCHAR(20),
    representative VARCHAR(50),
    logo_url TEXT,
    branding_color VARCHAR(20) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 사용자 프로필 테이블 (user_profiles)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    center_id UUID REFERENCES public.centers(id),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'parent',
    status VARCHAR(20) DEFAULT 'active',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 치료사 상세 정보
CREATE TABLE IF NOT EXISTS public.therapists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    center_id UUID REFERENCES public.centers(id),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    specialization VARCHAR(100)[],
    license_number VARCHAR(50),
    color VARCHAR(7) DEFAULT '#3B82F6',
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    system_role VARCHAR(20) DEFAULT 'therapist',
    system_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 노인/수급자 정보 (children 테이블 재활용 또는 이름 변경)
-- 기존 센터 앱의 구조를 유지하기 위해 children 테이블 이름을 사용하되, 필드 의미는 수급자 정보로 사용합니다.
CREATE TABLE IF NOT EXISTS public.children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    center_id UUID REFERENCES public.centers(id),
    name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    gender gender_type,
    registration_number VARCHAR(50), -- 장기요양인정번호 등
    diagnosis TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 일정 관리
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    center_id UUID REFERENCES public.centers(id),
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES public.therapists(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status schedule_status DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 👑 Super Admin 자동 설정 로직
-- 'anukbin@gmail.com' 이 가입하면 자동으로 super_admin 권한 부여

CREATE OR REPLACE FUNCTION public.handle_super_admin_assignment()
RETURNS trigger AS $$
BEGIN
    IF LOWER(NEW.email) = 'anukbin@gmail.com' THEN
        NEW.role := 'super_admin';
        NEW.status := 'active';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_assign_super_admin ON public.user_profiles;
CREATE TRIGGER tr_assign_super_admin
    BEFORE INSERT OR UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_super_admin_assignment();

-- 9. 보안 정책 (RLS) 설정
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 공통 정책: Super Admin은 모든 것을 볼 수 있음
CREATE POLICY "Super Admin Full Access" ON public.user_profiles
    FOR ALL TO authenticated USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
    );

CREATE POLICY "Users can view own center profiles" ON public.user_profiles
    FOR SELECT TO authenticated USING (
        center_id = (SELECT center_id FROM public.user_profiles WHERE id = auth.uid())
        OR id = auth.uid()
    );

-- 10. 초기 데이터 (센터 생성)
-- .env 파일에 정의된 VITE_CENTER_ID를 기준으로 초기 센터를 생성합니다.
INSERT INTO public.centers (id, name, slug, address, is_active)
VALUES (
    '02117996-fa99-4859-a640-40fb32968b2e', 
    '우리 재가요양센터', 
    'woori-care', 
    '서울특별시 서초구...', 
    TRUE
)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active;

-- 11. 가입 시 프로필 자동 생성 트리거 (Supabase Auth 전용)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
DECLARE
    default_center_id UUID := '02117996-fa99-4859-a640-40fb32968b2e';
BEGIN
    INSERT INTO public.user_profiles (id, email, name, role, center_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', '사용자'),
        CASE 
            WHEN NEW.email = 'anukbin@gmail.com' THEN 'super_admin'::user_role 
            ELSE 'parent'::user_role 
        END,
        default_center_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 완료
SELECT '🚀 Supabase Setup Complete for Silver Care SaaS' as result;
