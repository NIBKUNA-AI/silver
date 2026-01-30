-- [Emergency Fix] Override Visibility for Settlement
-- This function bypasses all filters and RLS to force-show staff in Payroll.
-- Execute this in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION get_settlement_targets(p_center_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    hire_type TEXT,
    system_role TEXT,
    base_salary INTEGER,
    required_sessions INTEGER,
    session_price_weekday INTEGER, -- Used as Base Hourly Rate
    evaluation_price INTEGER,      -- Auto-calculated or stored
    consult_price INTEGER,
    incentive_price INTEGER,
    system_status TEXT,
    remarks TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.email,
        t.hire_type,
        t.system_role,
        COALESCE(t.base_salary, 0),
        COALESCE(t.required_sessions, 0),
        COALESCE(t.session_price_weekday, 10030), -- Default to min wage if null
        COALESCE(t.evaluation_price, 0),
        COALESCE(t.consult_price, 0),
        COALESCE(t.incentive_price, 0),
        t.system_status,
        t.remarks
    FROM therapists t
    WHERE t.center_id = p_center_id;
END;
$$ LANGUAGE plpgsql;
