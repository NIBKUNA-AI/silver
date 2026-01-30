
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkRpc() {
    console.log("Checking RPC function...");
    const centerId = '02117996-fa99-4859-a640-40fb32968b2e';

    // Try calling the RPC
    const { data, error } = await supabase.rpc('get_settlement_targets', { p_center_id: centerId });

    if (error) {
        console.error("RPC Call Failed:", error);
    } else {
        console.log(`RPC Success! Items found: ${data.length}`);
        if (data.length > 0) console.log(data[0]);
    }
}

checkRpc();
