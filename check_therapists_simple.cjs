
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log("Checking therapists...");

    // 1. Count all
    const { data: all, error: err1 } = await supabase.from('therapists').select('*');
    if (err1) console.log("Error 1:", err1);
    else console.log(`Total Therapists: ${all.length}`);
    if (all && all.length > 0) console.log("Samples:", all.map(t => ({ name: t.name, email: t.email, center_id: t.center_id })));

    // 2. Check for nibkuna
    const { data: nib, error: err2 } = await supabase.from('therapists').select('*').ilike('email', '%nibkuna%');
    if (err2) console.log("Error 2:", err2);
    else console.log("Nibkuna found in therapists:", nib.length > 0);
}

check();
