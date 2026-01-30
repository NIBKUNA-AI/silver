-- [FINAL FIX] Override Visibility for Settlement (Verified Columns)
-- Verified Columns: consultation_price (not consult_price), Missing: evaluation_price, remarks
-- This script maps existing columns to the expected interface to prevent ALL crashes.
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
    session_price_weekday INTEGER, 
    evaluation_price INTEGER,      -- Returned as 0 (Missing in DB)
    consult_price INTEGER,         -- Mapped from consultation_price
    incentive_price INTEGER,       
    system_status TEXT,
    remarks TEXT                   -- Returned as Empty (Missing in DB)
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
        0,                                   -- evaluation_price (Missing)
        COALESCE(t.consultation_price, 0),   -- consult_price (Mapped from consultation_price)
        COALESCE(t.incentive_price, 0),      -- incentive_price (Exists)
        t.system_status,
        ''                                   -- remarks (Missing)
    FROM therapists t
    WHERE t.center_id = p_center_id;
END;
$$ LANGUAGE plpgsql;
