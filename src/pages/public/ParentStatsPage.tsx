// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-11
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 부모님 발달 리포트 - 인터랙티브 체크 및 저장 추이 기능
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Loader2, BarChart3, Users, ChevronDown, Printer } from 'lucide-react';
import { ParentDevelopmentChart } from '@/components/app/parent/ParentDevelopmentChart';
import { useCenter } from '@/contexts/CenterContext';

export function ParentStatsPage() {
    const navigate = useNavigate();
    const { center } = useCenter();
    const [loading, setLoading] = useState(true);
    const [devData, setDevData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [role, setRole] = useState<string>('parent');

    // 관리자용 상태
    const [children, setChildren] = useState<any[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [selectedChildName, setSelectedChildName] = useState<string>('');
    const [therapistId, setTherapistId] = useState<string | null>(null);

    useEffect(() => {
        initializePage();
    }, [center]);

    const initializePage = async () => {
        setLoading(true);
        try {
            const { data: authData } = await supabase.auth.getUser();
            const user = authData?.user;
            if (!user) return setError("로그인이 필요합니다.");

            // ✨ user_profiles 테이블에서 역할 확인 (parents 테이블과 별개)
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            setRole(profile?.role || 'parent');

            if (profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'manager') {
                if (!center?.id) { setLoading(false); return; }
                const { data: childList } = await supabase.from('children').select('id, name').eq('center_id', center.id);
                setChildren(childList || []);
                if (childList?.[0]) {
                    setSelectedChildId(childList[0].id);
                    setSelectedChildName(childList[0].name);
                    await loadChildStats(childList[0].id);
                }
            } else {
                // 부모 권한일 때 연결된 자녀 찾기
                let childId = null;
                const { data: parentRecord } = await supabase.from('parents').select('id').eq('profile_id', user.id).maybeSingle();
                if (parentRecord) {
                    const { data: directChild } = await supabase.from('children').select('id, name').eq('parent_id', (parentRecord as any).id).maybeSingle();
                    if (directChild) {
                        childId = (directChild as any).id;
                        setSelectedChildName((directChild as any).name);
                    }
                }
                if (!childId) {
                    const { data: rel } = await supabase.from('family_relationships').select('child_id, children(name)').eq('parent_id', user.id).maybeSingle();
                    if (rel) {
                        childId = (rel as any).child_id;
                        setSelectedChildName((rel as any).children?.name);
                    }
                }
                if (childId) {
                    setSelectedChildId(childId);
                    await loadChildStats(childId);
                } else {
                    setError("연결된 아이 정보가 없습니다.");
                }
            }
        } catch (e) {
            console.error(e);
            setError("초기화 중 오류 발생");
        } finally {
            setLoading(false);
        }
    };

    const loadChildStats = async (childId: string, shouldInitChecks = true) => {
        if (!childId) return;
        const { data } = await supabase
            .from('development_assessments')
            .select('*')
            .eq('child_id', childId)
            .order('created_at', { ascending: false })
            .limit(10); // 추이 확인을 위해 10개까지 로드

        setDevData(data || []);

        // ✨ 배정 치료사 정보를 child_therapist 테이블에서 가져오기
        const { data: ctInfo } = await supabase
            .from('child_therapist')
            .select('therapist_id')
            .eq('child_id', childId)
            .eq('is_primary', true)
            .maybeSingle();

        if (ctInfo) setTherapistId(ctInfo.therapist_id);

    };



    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
                <div className="bg-white p-8 rounded-[32px] shadow-sm border text-center space-y-4">
                    <p className="font-black text-rose-500">{error}</p>
                    <button onClick={() => navigate(-1)} className="px-6 py-2 bg-slate-100 rounded-xl font-bold">뒤로가기</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6">
            <div className="max-w-2xl mx-auto print-container pb-20">
                <div className="flex justify-between items-center mb-6 no-print">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-black text-slate-400">
                        <ArrowLeft className="w-4 h-4" /> 뒤로가기
                    </button>
                </div>

                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 rounded-2xl">
                            <BarChart3 className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">발달 리포트</h2>
                            <p className="text-xs text-slate-500 font-bold">{selectedChildName} 아동 • 인터랙티브 성장 추이</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                    <div className="space-y-6">
                        {/* 차트 영역 - 항상 표시됨 (부모 체크 기반) */}
                        <ParentDevelopmentChart
                            assessments={devData || []}
                            isInteractive={false}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
