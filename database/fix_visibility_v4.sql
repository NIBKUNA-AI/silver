-- [FINAL OPTION] Create completely new function name to avoid caching/conflict
-- New Name: get_payroll_staff_v4
-- This bypasses any existing function caching or overloading issues.

CREATE OR REPLACE FUNCTION get_payroll_staff_v4(p_center_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    hire_type TEXT,
    system_role TEXT,
    base_salary INTEGER,
    required_sessions INTEGER,
    session_price_weekday INTEGER, 
    evaluation_price INTEGER,
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
        COALESCE(t.session_price_weekday, 10030),
        0,                                   -- evaluation_price phantom
        COALESCE(t.consultation_price, 0),   -- consultation_price
        COALESCE(t.incentive_price, 0),      
        t.system_status,
        ''                                   -- remarks phantom
    FROM therapists t
    WHERE t.center_id = p_center_id;
END;
$$ LANGUAGE plpgsql;
