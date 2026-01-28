// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-11
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 부모님 발달 리포트 - 인쇄하기 기능 추가
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Loader2, BarChart3, Users, ChevronDown, Printer } from 'lucide-react';
import { ParentDevelopmentChart } from '@/components/app/parent/ParentDevelopmentChart';
import { useCenter } from '@/contexts/CenterContext'; // ✨ Import

export function ParentStatsPage() {
    const navigate = useNavigate();
    const { center } = useCenter(); // ✨ Context
    const [loading, setLoading] = useState(true);
    const [devData, setDevData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [role, setRole] = useState<string>('parent');

    // 관리자용 상태
    const [children, setChildren] = useState<any[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [selectedChildName, setSelectedChildName] = useState<string>('');
    const [parentChecks, setParentChecks] = useState<Record<string, string[]>>({
        communication: [], social: [], cognitive: [], motor: [], adaptive: []
    });

    useEffect(() => {
        initializePage();
    }, [center]);

    const initializePage = async () => {
        setLoading(true);
        try {
            const { data: authData } = await supabase.auth.getUser();
            const user = authData?.user;
            if (!user) return setError("로그인이 필요합니다.");

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            setRole(profile?.role || 'parent');

            if (profile?.role === 'admin' || profile?.role === 'super_admin') {
                if (!center?.id) { setLoading(false); return; }
                const { data: childList } = await supabase.from('children').select('id, name').eq('center_id', center.id);
                setChildren(childList || []);
                if (childList?.[0]) {
                    setSelectedChildId(childList[0].id);
                    setSelectedChildName(childList[0].name);
                    await loadChildStats(childList[0].id);
                }
            } else {
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

    const loadChildStats = async (childId: string) => {
        if (!childId) return;
        const { data } = await supabase
            .from('development_assessments')
            .select('*')
            .eq('child_id', childId)
            .order('evaluation_date', { ascending: false })
            .limit(6);

        setDevData(data || []);

        // ✨ 최신 리포트의 체크 항목을 부모 체크 상태로 초기화 (로드 시점)
        if (data && data[0]) {
            const latestDetails = data[0].assessment_details || {};
            setParentChecks(latestDetails);
        }
    };

    const handleToggleCheck = (domain: string, itemId: string) => {
        setParentChecks(prev => {
            const current = prev[domain] || [];
            const next = current.includes(itemId)
                ? current.filter(id => id !== itemId)
                : [...current, itemId];
            return { ...prev, [domain]: next };
        });
    };

    // ✨ [Calculated] 부모님이 체크한 내용을 기반으로 실시간 가상 발달 지표 생성
    const activeAssessment = {
        evaluation_date: '실시간 자가진단',
        score_communication: (parentChecks.communication?.length || 0),
        score_social: (parentChecks.social?.length || 0),
        score_cognitive: (parentChecks.cognitive?.length || 0),
        score_motor: (parentChecks.motor?.length || 0),
        score_adaptive: (parentChecks.adaptive?.length || 0),
        assessment_details: parentChecks
    };

    // 차트에 전달할 데이터 조합 (최신은 부모 체크, 나머지는 히스토리)
    const combinedData = [activeAssessment, ...(devData || [])];

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6">
            <div className="max-w-2xl mx-auto print-container pb-20">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6 font-black text-slate-400 no-print">
                    <ArrowLeft className="w-4 h-4" /> 뒤로가기
                </button>

                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <BarChart3 className="w-6 h-6 text-primary" />
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
                            assessments={combinedData}
                            isInteractive={role === 'parent'}
                            onToggleCheck={handleToggleCheck}
                            parentChecks={parentChecks}
                        />

                        {/* 상담 준비 가이드 */}
                        {role === 'parent' && (
                            <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-200">
                                <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                                    💡 상담 준비 팁
                                </h3>
                                <p className="text-sm opacity-90 font-medium leading-relaxed">
                                    상단의 '상세 평가 근거' 탭에서 아이가 현재 할 수 있는 항목들을 체크해 보세요.
                                    체크할 때마다 그래프가 실시간으로 업데이트됩니다. 궁금한 점이 있다면 체크된 리스트를 보며
                                    치료사 선생님과 상담 시 질문해 보세요.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
