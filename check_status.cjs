
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkStatus() {
    console.log("Checking therapists status...");

    // Check status of nibkuna
    const { data, error } = await supabase
        .from('therapists')
        .select('name, email, system_status, status, hire_type') // Check status columns
        .ilike('email', '%nibkuna%');

    if (error) console.log("Error:", error);
    else console.table(data);
}

checkStatus();
