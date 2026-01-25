
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function diagnose() {
    console.log('--- 🔍 User Profiles Diagnosis ---');

    // Test 1: Simple Select
    const { data, error, status } = await supabase.from('user_profiles').select('*').limit(1);
    if (error) {
        console.log('❌ Error selecting from user_profiles:', error.message);
    } else {
        console.log('✅ Select successful. Status:', status);
        console.log('Sample Data Key Count:', data.length > 0 ? Object.keys(data[0]).length : 0);
    }

    // Test 2: Table/View check via RPC if possible (hypothetical)
    // Since we can't run raw SQL via JS easily without an RPC, let's just use the error messages.

    console.log('\n--- 🧪 Action Recommendation ---');
    console.log('If "is not a table" error persists in SQL editor, try running:');
    console.log('SELECT relname, relkind FROM pg_class WHERE relname = \'user_profiles\';');
    console.log('relkind codes: r = table, v = view, m = materialized view, i = index');
}

diagnose();
