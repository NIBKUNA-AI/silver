
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verifyV4() {
    console.log("Verifying V4 Config...");
    const centerId = '02117996-fa99-4859-a640-40fb32968b2e';

    // 1. Call V4
    console.log("Calling get_payroll_staff_v4...");
    const { data, error } = await supabase.rpc('get_payroll_staff_v4', { p_center_id: centerId });

    if (error) {
        console.error("V4 RPC FAILED:", error);
    } else {
        console.log(`V4 RPC SUCCESS. Rows: ${data.length}`);
        if (data.length > 0) console.log(data[0]);
    }

    // 2. Check Column Types
    console.log("Checking base_salary type...");
    const { data: typeData, error: typeError } = await supabase.from('therapists').select('base_salary').limit(1);
    if (typeData && typeData.length > 0) console.log("base_salary sample:", typeData[0].base_salary, typeof typeData[0].base_salary);
}

verifyV4();
