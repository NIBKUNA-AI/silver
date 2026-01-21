
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const JAMSIL_CENTER_ID = "59d09adf-4c98-4013-a198-d7b26018fd29";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixData() {
    console.log('--- Fixing Consultation Center IDs ---');

    const { data, error } = await supabase
        .from('consultations')
        .update({ center_id: JAMSIL_CENTER_ID })
        .is('center_id', null);

    if (error) {
        console.error('Update Error:', error.message);
    } else {
        console.log('✅ Successfully updated consultation records.');
    }
}

fixData();
