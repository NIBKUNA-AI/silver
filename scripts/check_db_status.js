
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
    try {
        console.log('--- DB Data Check ---');

        // 1. Leads Table Count
        const { count: leadsCount, error: leadsError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        if (leadsError) console.error('Leads Error:', leadsError.message);
        else console.log(`Leads Table Count: ${leadsCount}`);

        // 2. Consultations Table Count
        const { count: consultsCount, error: consultsError } = await supabase
            .from('consultations')
            .select('*', { count: 'exact', head: true });

        if (consultsError) console.error('Consultations Error:', consultsError.message);
        else console.log(`Consultations Table Count: ${consultsCount}`);

        // 3. Sample from Leads
        const { data: leadsSample } = await supabase
            .from('leads')
            .select('id, parent_name, phone, created_at')
            .limit(3)
            .order('created_at', { ascending: false });

        console.log('\n--- Recent Leads Samples ---');
        console.table(leadsSample);

        // 4. Sample from Consultations
        const { data: consultsSample } = await supabase
            .from('consultations')
            .select('id, guardian_name, guardian_phone, center_id, schedule_id, created_at')
            .limit(3)
            .order('created_at', { ascending: false });

        console.log('\n--- Recent Consultations Samples ---');
        console.table(consultsSample);

        console.log('\n--- Done ---');

    } catch (err) {
        console.error('Check Error:', err);
    }
}

checkData();
