-- [Emergency Fix] Override Visibility for Settlement (Robust Version)
-- This version REMOVES references to missing columns to prevent crashes.
-- Execute this in Supabase SQL Editor immediately.

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
    evaluation_price INTEGER,      -- Fixed to 0 (Missing column)
    consult_price INTEGER,         -- Fixed to 0
    incentive_price INTEGER,       -- Fixed to 0
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
        COALESCE(t.session_price_weekday, 10030),
        0, -- t.evaluation_price removed due to missing column
        0, -- t.consult_price removed
        0, -- t.incentive_price removed
        t.system_status,
        t.remarks
    FROM therapists t
    WHERE t.center_id = p_center_id;
END;
$$ LANGUAGE plpgsql;
