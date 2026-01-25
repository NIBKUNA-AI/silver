import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Use SERVICE_ROLE key if available for checking policies, but here we likely only have ANON.
// IF RLS is on, ANON key might show empty results for some tables.
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTable(tableName) {
    console.log(`\n🔍 Checking Table: [${tableName}]`);
    const { data, error } = await supabase.from(tableName).select('id, center_id').limit(5);

    if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        return { status: 'ERROR', message: error.message };
    }

    if (!data || data.length === 0) {
        console.log(`   ⚠️  No data accessible (RLS active or table empty).`);
        return { status: 'EMPTY_OR_SECURE', count: 0 };
    }

    // Check for center_id
    const hasCenterId = data.every(row => row.center_id !== undefined);
    if (hasCenterId) {
        console.log(`   ✅ Data accessible. 'center_id' column verified.`);
        console.log(`   SAMPLE Center IDs: ${[...new Set(data.map(d => d.center_id))].join(', ')}`);
        return { status: 'OK', count: data.length };
    } else {
        console.log(`   ⚠️  Data accessible but 'center_id' missing in response?`);
        return { status: 'WARN', count: data.length };
    }
}

async function runHealthCheck() {
    console.log('🏥 starting SaaS Health Check...');

    // 1. Critical Tables
    const tables = ['centers', 'user_profiles', 'children', 'schedules', 'consultations'];

    for (const table of tables) {
        await checkTable(table);
    }

    // 2. Auth Check (Mock)
    console.log('\n🔐 Auth Configuration Check');
    console.log('   - SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'OK' : 'MISSING');
    console.log('   - ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'OK' : 'MISSING');
}

runHealthCheck();
