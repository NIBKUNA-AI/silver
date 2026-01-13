-- ============================================================
-- 🎟️ ADMIN INVITATION CODE SYSTEM
-- Created for: Super Admin to invite Center Admins
-- ============================================================

CREATE TABLE IF NOT EXISTS public.invitation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'admin', -- 'admin', 'therapist', 'staff'
    code VARCHAR(50) NOT NULL UNIQUE,          -- Custom format: ZARADA-JAMSIL-ADMIN-XXXX
    status VARCHAR(20) DEFAULT 'active',       -- 'active', 'used', 'expired'
    created_by UUID REFERENCES auth.users(id), -- Usually Super Admin
    used_by UUID REFERENCES auth.users(id),    -- The user who signed up with this
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

-- RLS Policies
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

-- 1. Super Admin: All Permissions
CREATE POLICY "Super Admin Full Access" ON public.invitation_codes
FOR ALL USING (
    public.is_super_admin()
);

-- 2. Public (Registration): Check validity only (SELECT)
-- Needed for the registration page to verify code validity without login
CREATE POLICY "Public Check Code" ON public.invitation_codes
FOR SELECT USING (
    status = 'active'
);
