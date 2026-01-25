
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkGarbage() {
    console.log("🔍 Checking for leftover 'pangyo' test data...");

    // Check Center
    const { data: center, error: centerError } = await supabase
        .from('centers')
        .select('*')
        .eq('slug', 'pangyo');

    if (centerError) console.error("Center Check Error:", centerError.message);
    else if (center && center.length > 0) {
        console.log("⚠️ Found 'pangyo' center data:", center);
    } else {
        console.log("✅ No 'pangyo' center found.");
    }

    // Check User Profile
    const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', 'pangyo_admin@gmail.com');

    if (profileError) console.error("Profile Check Error:", profileError.message);
    else if (profile && profile.length > 0) {
        console.log("⚠️ Found 'pangyo_admin' profile data:", profile);
    } else {
        console.log("✅ No 'pangyo_admin' profile found.");
    }
}

checkGarbage();
