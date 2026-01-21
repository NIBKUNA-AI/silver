
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkRLSHealth() {
    console.log('--- 🛡️ RLS 보안 정책 최종 점검 (회로망 진단) ---');

    const testCases = [
        { name: '아동 정보 (children)', table: 'children' },
        { name: '일정 (schedules)', table: 'schedules' },
        { name: '상담 일지 (counseling_logs)', table: 'counseling_logs' },
        { name: '발달 평가 (development_assessments)', table: 'development_assessments' },
        { name: '치료사 프로필 (therapists)', table: 'therapists' },
        { name: '부모-자녀 연결 (family_relationships)', table: 'family_relationships' },
        { name: '유저 프로필 (user_profiles)', table: 'user_profiles' }
    ];

    console.log('\n[1단계] 테이블 가용성 및 기본 접근 테스트');
    for (const test of testCases) {
        const { error } = await supabase.from(test.table).select('count', { count: 'exact', head: true });
        if (error) {
            // Permission denied is actually GOOD for anon key on sensitive tables
            // but 'relation does not exist' is BAD.
            if (error.code === '42P01') {
                console.error(`❌ ${test.name}: 테이블 자체가 존재하지 않습니다! (42P01)`);
            } else if (error.code === '42501') {
                console.log(`✅ ${test.name}: 보안 작동 중 (Anon 접근 차단됨 - 정상)`);
            } else {
                console.log(`⚠️ ${test.name}: 알려지지 않은 오류 (${error.code}: ${error.message})`);
            }
        } else {
            console.log(`✅ ${test.name}: 접근 가능 (RLS 오픈 또는 데이터 노출됨)`);
        }
    }

    console.log('\n[2단계] 논리적 취약점 점검');

    // Check if therapist table has email or profile_id
    const { data: therapistCols, error: tError } = await supabase.from('therapists').select('*').limit(1);
    if (!tError && therapistCols.length > 0) {
        const sample = therapistCols[0];
        if (sample.profile_id) console.log('✅ therapists: profile_id 컬럼 확인됨 (ID 매칭 가능)');
        else console.warn('⚠️ therapists: profile_id 컬럼이 없습니다. (이메일 매칭 필요)');
    }

    // Check if development_assessments has log_id
    const { data: assessCols, error: aError } = await supabase.from('development_assessments').select('*').limit(1);
    if (!aError && assessCols.length > 0) {
        const sample = assessCols[0];
        if (sample.log_id) console.log('✅ development_assessments: log_id 연동 확인됨 (일지 기반 필터 가능)');
        else console.warn('⚠️ development_assessments: log_id 컬럼이 없습니다.');
    }

    console.log('\n--- 진단 종료 ---');
}

checkRLSHealth();
