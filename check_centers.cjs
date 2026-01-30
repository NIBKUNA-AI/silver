
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listCenters() {
    const { data: centers } = await supabase.from('centers').select('id, name');
    console.table(centers);

    // Also check therapists again with center name join if possible (mock join)
    const { data: therapists } = await supabase.from('therapists').select('name, center_id');
    console.log("Therapists map:");
    console.table(therapists);
}

listCenters();
