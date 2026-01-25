import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log('--- 🔍 DB Connection & Data Verification ---');
    console.log('URL:', process.env.VITE_SUPABASE_URL);

    // 1. Fetch all centers to see what's there
    const { data: centers, error } = await supabase.from('centers').select('*');
    if (error) {
        console.error('❌ Error fetching centers:', error.message);
        return;
    }

    console.log(`✅ Successfully fetched ${centers.length} centers.`);
    centers.forEach(c => {
        console.log(`\n🏢 Center Name: ${c.name}`);
        console.log(`   - ID: ${c.id}`);
        console.log(`   - Slug: ${c.slug}`);
        console.log(`   - Address: ${c.address}`);
        console.log(`   - Phone: ${c.phone}`);
        console.log(`   - Email: ${c.email}`);
        console.log(`   - Business Number: ${c.business_number}`);
    });

    console.log('\n--- 💡 Verification Result ---');
    if (centers.length > 0) {
        console.log('데이터가 DB와 정상적으로 연동되어 있습니다. (Not a placeholder)');
    } else {
        console.log('⚠️ DB에 데이터가 없습니다.');
    }
}

check();
