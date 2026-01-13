
-- ============================================================
-- MIGRATION: Leads -> Consultations
-- Purpose: Move existing inquiries from 'leads' (wrong table) to 'consultations' (correct table)
-- User Requirement: "상담 신청이 하나도 유실되지 않게 해."
-- ============================================================

INSERT INTO public.consultations (
    child_name,
    child_gender,
    guardian_name,
    guardian_phone,
    primary_concerns,
    preferred_consult_schedule, -- Mapping 'preferred_service' array to this text field
    status,
    created_at,
    center_id -- We need to assign a center_id. We'll try to find one or use the default 'Jamsil' one.
)
SELECT 
    l.child_name,
    l.child_gender,
    l.parent_name, -- guardian_name
    l.phone, -- guardian_phone
    l.concern, -- primary_concerns
    array_to_string(l.preferred_service, ', '), -- preferred_consult_schedule
    'pending', -- default status
    l.created_at,
    (SELECT id FROM public.centers ORDER BY created_at ASC LIMIT 1) -- Assign to first center (Default/Main)
FROM 
    public.leads l
WHERE 
    NOT EXISTS (
        SELECT 1 FROM public.consultations c 
        WHERE c.guardian_phone = l.phone AND c.created_at = l.created_at
    );

-- Log the number of moved rows
DO $$
DECLARE
    moved_count INT;
BEGIN
    GET DIAGNOSTICS moved_count = ROW_COUNT;
    RAISE NOTICE '✅ Successfully moved % rows from leads to consultations.', moved_count;
END $$;
