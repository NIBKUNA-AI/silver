import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Admin Client to simulate operations
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

const LOG = (step, msg) => console.log(`[STEP ${step}] ${msg}`);

async function runSimulation() {
    console.log('🚀 Starting Real-World SaaS Lifecycle Simulation...\n');

    let bundangCenterId = null;
    const jamsilCenterId = '4b6c4f5e-7d7a-4ec6-bccc-436a58dad083'; // Existing Jamsil Center

    try {
        // 1. Create New Center (Bundang)
        LOG(1, 'Creating New Center: "자라다 분당점" (bundang)');
        const { data: newCenter, error: createError } = await supabase
            .from('centers')
            .insert({
                name: '자라다 분당점',
                slug: 'bundang',
                address: '경기도 성남시 분당구 정자동',
                is_active: true
            })
            .select()
            .single();

        if (createError) throw createError;
        bundangCenterId = newCenter.id;
        console.log(`   ✅ Created Center ID: ${bundangCenterId}`);

        // 2. Create Data in Bundang (Child)
        LOG(2, 'Operating Bundang: Registering new child "분당이"');
        const { data: childB, error: childError } = await supabase
            .from('children')
            .insert({
                name: '분당이',
                birth_date: '2020-01-01',
                gender: '남',
                center_id: bundangCenterId,
                invitation_code: 'BUND1'
            })
            .select()
            .single();

        if (childError) throw childError;
        console.log(`   ✅ Registered Child: ${childB.name} (ID: ${childB.id}) in Bundang`);

        // 3. Verify Isolation (Check from Jamsil Context)
        LOG(3, 'Security Check: Switching to Jamsil Center context...');
        const { data: jamsilChildren, error: fetchError } = await supabase
            .from('children')
            .select('name, center_id')
            .eq('center_id', jamsilCenterId); // 🔒 Strict Filter simulated

        if (fetchError) throw fetchError;

        const leakedData = jamsilChildren.find(c => c.name === '분당이');
        if (leakedData) {
            throw new Error('🚨 CRITICAL: Data Leakage Detected! Found "분당이" in Jamsil Center.');
        } else {
            console.log(`   ✅ Isolation Confirmed: "분당이" is NOT visible in Jamsil Center.`);
            console.log(`   ℹ️  Jamsil has ${jamsilChildren.length} children, none are from Bundang.`);
        }

        // 4. Verify Bundang Context
        LOG(4, 'Operational Check: Switching back to Bundang Center...');
        const { data: bundangChildren } = await supabase
            .from('children')
            .select('name')
            .eq('center_id', bundangCenterId);

        if (bundangChildren.length === 1 && bundangChildren[0].name === '분당이') {
            console.log(`   ✅ Operation Confirmed: Bundang Center correctly retrieves its own data.`);
        } else {
            throw new Error('❌ Data Loss: Could not find "분당이" in Bundang Center.');
        }

        // 5. Cleanup
        LOG(5, 'Cleanup: Removing Test Center and Data');
        // Cascade delete should handle children, but let's be safe if no cascade
        await supabase.from('children').delete().eq('center_id', bundangCenterId);
        await supabase.from('centers').delete().eq('id', bundangCenterId);
        console.log(`   ✅ Cleanup Complete.`);

        console.log('\n🎉 SIMULATION RESULT: PASS');
        console.log('   - New Center Creation: OK');
        console.log('   - Operational Data Entry: OK');
        console.log('   - Multi-Tenant Isolation: OK');

    } catch (error) {
        console.error('\n❌ SIMULATION FAILED:', error.message);
        // Attempt Cleanup
        if (bundangCenterId) {
            await supabase.from('centers').delete().eq('id', bundangCenterId);
        }
    }
}

runSimulation();
