-- =======================================================
-- 👨‍👩‍👧 PARENT DATA SYNC TRIGGER
-- =======================================================
-- Ensure 'parents' table is populated when 'user_profiles' is created with role 'parent'.

CREATE OR REPLACE FUNCTION public.sync_profile_to_specific_table()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Sync to PARENTS table
    IF new.role = 'parent' THEN
        INSERT INTO public.parents (profile_id, center_id, name, email, phone)
        VALUES (
            new.id,
            new.center_id,
            new.name,
            new.email, -- Optional, but good for reporting
            COALESCE(new.phone, '010-0000-0000') -- Safe default for now
        )
        ON CONFLICT (profile_id) DO UPDATE
        SET 
            center_id = EXCLUDED.center_id,
            name = EXCLUDED.name,
            updated_at = NOW();
            
    -- 2. Sync to THERAPISTS table (if needed, but usually manual)
    ELSIF new.role IN ('therapist', 'admin', 'super_admin') THEN
        -- Check if maybe they need to be in therapists?
        -- Usually admin invites create therapist records first.
        -- So we just update status if exists.
        UPDATE public.therapists
        SET profile_id = new.id,
            system_status = 'active',
            is_active = true
        WHERE email = new.email;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply Trigger
DROP TRIGGER IF EXISTS on_user_profile_sync ON public.user_profiles;
CREATE TRIGGER on_user_profile_sync
    AFTER INSERT OR UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_specific_table();

-- ✨ RETROACTIVE SYNC (Fix your current issue immediately)
-- Automatically insert missing parents for existing profiles
INSERT INTO public.parents (profile_id, center_id, name, email, phone)
SELECT 
    p.id, 
    p.center_id, 
    p.name, 
    p.email, 
    COALESCE(p.phone, '010-0000-0000')
FROM public.user_profiles p
WHERE p.role = 'parent'
  AND NOT EXISTS (SELECT 1 FROM public.parents WHERE profile_id = p.id);
