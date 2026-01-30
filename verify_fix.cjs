
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verifyFix() {
    console.log("Verifying Fix V3...");
    const centerId = '02117996-fa99-4859-a640-40fb32968b2e';

    // 1. Check RPC
    console.log("Calling RPC...");
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_settlement_targets', { p_center_id: centerId });

    if (rpcError) {
        console.error("RPC FAILED:", rpcError);
    } else {
        console.log(`RPC SUCCESS. Count: ${rpcData.length}`);
        if (rpcData.length === 0) console.log("WARNING: RPC returned 0 rows.");
    }

    // 2. Check Raw Select (to compare)
    const { data: rawData, error: rawError } = await supabase.from('therapists').select('id, name').eq('center_id', centerId);
    if (rawError) console.error("RAW SELECT FAILED:", rawError);
    else console.log(`RAW SELECT SUCCESS. Count: ${rawData.length}`);
}

verifyFix();
