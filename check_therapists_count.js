
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTherapists() {
    const { data: therapists, error } = await supabase.from('therapists').select('*');
    if (error) {
        console.error("Error fetching therapists:", error);
        return;
    }
    console.log(`Therapist Count: ${therapists.length}`);
    console.table(therapists);
}

checkTherapists();
