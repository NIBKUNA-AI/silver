
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkColumns() {
    console.log("Checking columns...");
    // Fetch 1 row and print keys
    const { data, error } = await supabase.from('therapists').select('*').limit(1);
    if (error) console.log(error);
    else if (data.length > 0) console.log("Columns:", Object.keys(data[0]));
    else console.log("No rows, cannot infer columns easily via select *");
}

checkColumns();
