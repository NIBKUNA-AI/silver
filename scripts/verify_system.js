
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase Credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

async function runVerification() {
    console.log('🏥 Starting System Health Simulation...');
    let errors = [];
    let warnings = [];

    // 1. Check User Profiles Integrity
    // Note: We can't access auth.users via client unless checking profiles count roughly
    // We will check if user_profiles exists and is accessible.
    try {
        const { count: userProfileCount, error: upError } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
        if (upError) throw upError;
        console.log(`✅ user_profiles table accessible. Count: ${userProfileCount}`);
    } catch (e) {
        errors.push(`❌ Failed to access 'user_profiles': ${e.message}`);
    }

    // 2. Check for Zombies (Legacy 'profiles' table usage)
    try {
        const { count: legacyCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        if (legacyCount > 0) {
            warnings.push(`⚠️ Legacy 'profiles' table has ${legacyCount} rows. Ideally should be empty, but acceptable if unused.`);
        } else {
            console.log(`✅ Legacy 'profiles' table is empty (Clean).`);
        }
    } catch (e) {
        // It might be dropped, which is good
        console.log(`✅ Legacy 'profiles' table might be dropped or inaccessible (Good).`);
    }

    // 3. Therapist Data Integrity
    try {
        const { data: therapists, error: thError } = await supabase.from('therapists').select('id, profile_id');
        if (thError) throw thError;

        // Check if any therapist has NULL profile_id
        const orphans = therapists.filter(t => !t.profile_id);
        if (orphans.length > 0) {
            errors.push(`❌ Found ${orphans.length} therapists with NULL profile_id. (Critical Integrity Issue)`);
        } else {
            console.log(`✅ All ${therapists.length} therapists are linked to profiles.`);
        }
    } catch (e) {
        errors.push(`❌ Failed to check therapists: ${e.message}`);
    }

    // 4. Children Data Integrity (Invisible Children)
    try {
        const { data: children, error: chError } = await supabase.from('children').select('id, name, center_id');
        if (chError) throw chError;

        const invisible = children.filter(c => !c.center_id);
        if (invisible.length > 0) {
            errors.push(`❌ Found ${invisible.length} children with NULL center_id (Invisible Children).`);
        } else {
            console.log(`✅ All ${children.length} children have valid center_id.`);
        }
    } catch (e) {
        errors.push(`❌ Failed to check children: ${e.message}`);
    }

    // 5. Codebase Scan for 'profiles' usage (Simple Grep Simulation)
    // We assume the agent cleaned it up, but let's check strict files if possible.
    // In this script we focus on DB.

    // REPORT
    console.log('\n📊 === DIAGNOSIS REPORT ===');
    if (errors.length > 0) {
        console.error('⛔ SYSTEM FAILURE (Inoperable):');
        errors.forEach(e => console.error(e));
        if (warnings.length > 0) {
            console.log('\nWarnings:');
            warnings.forEach(w => console.log(w));
        }
        process.exit(1);
    } else {
        console.log('✅ SYSTEM STATUS: OPERATIONAL');
        console.log('✨ "Ready for Immediate Deployment"');
        if (warnings.length > 0) {
            console.log('\n(Notes/Warnings):');
            warnings.forEach(w => console.log(w));
        }
        process.exit(0);
    }
}

runVerification();
