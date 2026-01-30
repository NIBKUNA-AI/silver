-- Add missing columns for Silver Care payroll calculation
-- These columns are used in Settlement.tsx but were missing in the schema
-- consult_price -> reused for Holiday Bonus Rate (or can be treated as generic bonus)
-- incentive_price -> reused for Overtime Rate

DO $$ 
BEGIN
    -- Add consult_price if it doesn't exist (Used for Holiday/Extra Bonus)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapists' AND column_name = 'consult_price') THEN
        ALTER TABLE therapists ADD COLUMN consult_price INTEGER DEFAULT 0;
    END IF;

    -- Add incentive_price if it doesn't exist (Used for Overtime Incentive)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapists' AND column_name = 'incentive_price') THEN
        ALTER TABLE therapists ADD COLUMN incentive_price INTEGER DEFAULT 0;
    END IF;

    -- Add evaluation_price if it doesn't exist (Used for Night Bonus)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapists' AND column_name = 'evaluation_price') THEN
        ALTER TABLE therapists ADD COLUMN evaluation_price INTEGER DEFAULT 0;
    END IF;
END $$;
