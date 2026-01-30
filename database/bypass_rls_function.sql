-- RLS Bypass Function for Settlement
-- This function fetches all therapists for a center regardless of RLS policies.
-- Use with caution, but necessary for Admin Payroll view where self-view might be blocked.

CREATE OR REPLACE FUNCTION get_all_therapists_unrestricted(target_center_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    hire_type TEXT,
    system_role TEXT,
    base_salary INTEGER,
    required_sessions INTEGER,
    session_price_weekday INTEGER,
    session_price_weekend INTEGER,
    evaluation_price INTEGER, -- Night Bonus Rate
    consult_price INTEGER,    -- Holiday Bonus Rate
    incentive_price INTEGER,  -- Overtime Rate
    system_status TEXT,
    counts JSONB,             -- Placeholder for frontend
    payout INTEGER,           -- Placeholder for frontend
    remarks TEXT
) 
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.email,
        t.hire_type,
        t.system_role,
        t.base_salary,
        t.required_sessions,
        t.session_price_weekday,
        t.session_price_weekend,
        COALESCE(t.evaluation_price, 0), -- Handle nulls
        COALESCE(t.consult_price, 0),
        COALESCE(t.incentive_price, 0),
        t.system_status,
        '{}'::JSONB, -- Dummy counts
        0,           -- Dummy payout
        t.remarks
    FROM therapists t
    WHERE t.center_id = target_center_id;
END;
$$ LANGUAGE plpgsql;
