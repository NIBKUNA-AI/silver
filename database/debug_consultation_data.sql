
-- Check table definition for leads
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads';

-- Check data sample from leads
SELECT * FROM leads LIMIT 3;

-- Check data sample from consultations
SELECT * FROM consultations ORDER BY created_at DESC LIMIT 3;
