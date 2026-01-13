
-- ============================================================
-- RLS FIX: Consultations Table
-- Purpose: Ensure Super Admins see ALL inquiries, and Admins see their center's inquiries.
-- ============================================================

-- 1. Enable RLS
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts (clean slate)
-- 2. Drop existing policies to avoid conflicts (clean slate)
DROP POLICY IF EXISTS "Admins can view their center's consultations" ON public.consultations;
DROP POLICY IF EXISTS "Super Admins can view all consultations" ON public.consultations;
DROP POLICY IF EXISTS "Admins can update their center's consultations" ON public.consultations;
DROP POLICY IF EXISTS "Admins can delete their center's consultations" ON public.consultations;
DROP POLICY IF EXISTS "Public can insert consultations" ON public.consultations; -- Corrected name
DROP POLICY IF EXISTS "Users can insert consultations" ON public.consultations; -- Legacy name cleanup

-- 3. Policy: Public/Users can INSERT (for the form)
CREATE POLICY "Public can insert consultations" ON public.consultations
FOR INSERT WITH CHECK (true);

-- 4. Policy: Normal Admins can VIEW their center's data
CREATE POLICY "Admins can view their center's consultations" ON public.consultations
FOR SELECT USING (
    -- Strict Center Match for normal admins
    center_id IN (
        SELECT center_id FROM public.user_profiles WHERE id = auth.uid()
    )
);

-- 5. Policy: Super Admins can VIEW ALL data (Bypass)
-- We explicitly check the EMAIL from the JWT to avoid table join issues if profile is missing
CREATE POLICY "Super Admins can view all consultations" ON public.consultations
FOR SELECT USING (
    -- 1. Trust the JWT email claim (Fastest)
    auth.jwt() ->> 'email' = 'anukbin@gmail.com'
    -- 2. Fallback: Trust the profile role
    OR EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- 6. Policy: Admins can UPDATE (notes, status)
CREATE POLICY "Admins can update their center's consultations" ON public.consultations
FOR UPDATE USING (
    auth.jwt() ->> 'email' = 'anukbin@gmail.com'
    OR center_id IN (
        SELECT center_id FROM public.user_profiles WHERE id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- 7. Policy: Admins can DELETE
CREATE POLICY "Admins can delete their center's consultations" ON public.consultations
FOR DELETE USING (
    auth.jwt() ->> 'email' = 'anukbin@gmail.com'
    OR center_id IN (
        SELECT center_id FROM public.user_profiles WHERE id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);
