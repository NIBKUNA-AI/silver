// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useCenter } from '@/contexts/CenterContext';
import { X, Save, Loader2, MessageCircle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssessmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    childId: string;
    childName: string;
    logId?: string | null;
    scheduleId?: string | null;
    sessionDate?: string | null;
    therapistId?: string | null;
    assessmentId?: string | null;
    onSuccess: () => void;
}

/**
 * ✨ [Simplified Assessment Form]
 * User Request: Remove the scientific checklist from the therapist's view.
 * Strategy: Therapists focus on writing detailed session notes (summary).
 * Parents handle the developmental self-assessment/checklist in their own app.
 */
export function AssessmentFormModal({
    isOpen, onClose, childId, childName, logId,
    scheduleId, sessionDate, therapistId, assessmentId, onSuccess
}: AssessmentFormModalProps) {
    const { center } = useCenter();
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const [summary, setSummary] = useState('');
    const [therapistNotes, setTherapistNotes] = useState('');
    const [currentLogId, setCurrentLogId] = useState<string | null>(null);
    const [originalTherapistId, setOriginalTherapistId] = useState<string | null>(null);

    // ✨ [User Request] 성장 일지(발달 지표) 통합
    const [scores, setScores] = useState({
        communication: 0,
        social: 0,
        cognitive: 0,
        motor: 0,
        adaptive: 0
    });

    useEffect(() => {
        if (isOpen && assessmentId) {
            loadExistingData();
        } else {
            setSummary('');
            setTherapistNotes('');
            setScores({ communication: 0, social: 0, cognitive: 0, motor: 0, adaptive: 0 });
            setCurrentLogId(logId || null);
            setOriginalTherapistId(null);
            setIsEditMode(false);
        }
    }, [isOpen, assessmentId, logId]);

    const loadExistingData = async () => {
        try {
            const { data, error } = await supabase
                .from('development_assessments')
                .select('*')
                .eq('id', assessmentId)
                .maybeSingle();

            if (error) throw error;
            if (data) {
                setSummary(data.summary || '');
                setTherapistNotes(data.therapist_notes || '');
                setScores({
                    communication: data.score_communication || 0,
                    social: data.score_social || 0,
                    cognitive: data.score_cognitive || 0,
                    motor: data.score_motor || 0,
                    adaptive: data.score_adaptive || 0
                });
                setCurrentLogId(data.log_id || null);
                setOriginalTherapistId(data.therapist_id || null);
                setIsEditMode(true);
            }
        } catch (e) {
            console.error('기존 데이터 로드 오류:', e);
        }
    };

    if (!isOpen || !childId) return null;

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('로그인이 필요합니다.');

            let effectiveTherapistId = (isEditMode && originalTherapistId) ? originalTherapistId : therapistId;

            if (!effectiveTherapistId) {
                const { data: myTherapist } = await supabase
                    .from('therapists')
                    .select('id')
                    .eq('profile_id', user.id)
                    .maybeSingle();
                effectiveTherapistId = myTherapist?.id || null;
            }

            if (!effectiveTherapistId) {
                throw new Error('작성자(치료사) 정보를 확인할 수 없습니다.');
            }

            const payload: any = {
                center_id: center?.id,
                child_id: childId,
                therapist_id: effectiveTherapistId,
                log_id: currentLogId,
                evaluation_date: sessionDate || new Date().toISOString().split('T')[0],
                summary: summary,
                therapist_notes: therapistNotes,
                score_communication: scores.communication,
                score_social: scores.social,
                score_cognitive: scores.cognitive,
                score_motor: scores.motor,
                score_adaptive: scores.adaptive,
                assessment_details: {}
            };

            let activeLogId = currentLogId;

            if (!isEditMode && !activeLogId) {
                if (!center?.id) throw new Error('센터 정보가 없어 상담 일지를 생성할 수 없습니다.');
                const finalDate = sessionDate || new Date().toISOString().split('T')[0];
                const { data: newLog, error: logError } = await supabase
                    .from('counseling_logs')
                    .insert({
                        center_id: center.id,
                        therapist_id: effectiveTherapistId,
                        child_id: childId,
                        schedule_id: scheduleId,
                        session_date: finalDate,
                        content: summary || '상담 진행',
                        activities: '상담/수업 진행',
                        child_response: '상담/수업 진행'
                    })
                    .select()
                    .single();

                if (logError) throw new Error('상담 일지 자동 생성 실패: ' + logError.message);
                activeLogId = newLog.id;
                payload.log_id = activeLogId;
            } else if (activeLogId) {
                await supabase
                    .from('counseling_logs')
                    .update({ content: summary })
                    .eq('id', activeLogId);
            }

            let error;
            if (isEditMode && assessmentId) {
                const res = await supabase.from('development_assessments').update(payload).eq('id', assessmentId);
                error = res.error;
            } else {
                const res = await supabase.from('development_assessments').insert(payload);
                error = res.error;
            }

            if (error) throw error;

            alert(isEditMode ? '일지가 수정되었습니다.' : '일지가 저장되었습니다.');
            onSuccess();
            onClose();
        } catch (e: any) {
            console.error(e);
            alert('저장 실패: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">상담 및 회기 일지 작성</h2>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">{childName} 아동 • 전문 의견 중심 작성</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                    {/* Summary (Main Session Note) */}
                    <div className="space-y-4">
                        <label className="text-sm font-black text-slate-700 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-indigo-500" />
                            상담 및 회기 일지 (부모님 공개)
                        </label>
                        <p className="text-xs text-slate-400 font-bold ml-7 -mt-2">
                            아이의 오늘 활동 내용과 변화를 자유롭게 서술해 주세요. 부모님 앱의 발달 리포트 하단에 노출됩니다.
                        </p>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="오늘 진행된 상담/평가 내용과 회기 기록을 상세히 입력해주세요. 발달 체크리스트는 이제 부모님이 직접 앱에서 체크하시게 됩니다."
                            className="w-full h-80 p-8 rounded-[32px] border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:border-indigo-300 focus:bg-white outline-none resize-none transition-all placeholder:text-slate-300"
                        />
                    </div>

                    {/* ✨ [User Request] 2. 발달 영역별 점수 (Therapist Input) */}
                    <div className="space-y-6 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-black text-slate-700 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-500" />
                                발달 영역별 평가 (0~5점)
                            </label>
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">성장 그래프 반영</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-slate-50 p-6 rounded-[32px] border border-slate-200">
                            {[
                                { key: 'communication', label: '언어/의사소통' },
                                { key: 'social', label: '사회/정서' },
                                { key: 'cognitive', label: '인지/학습' },
                                { key: 'motor', label: '대근육/소근육' },
                                { key: 'adaptive', label: '자조/적응' }
                            ].map((domain) => (
                                <div key={domain.key} className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-xs font-bold text-slate-500">{domain.label}</span>
                                        <span className={cn(
                                            "text-sm font-black w-6 h-6 flex items-center justify-center rounded-full transition-all",
                                            scores[domain.key] > 0 ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-400"
                                        )}>
                                            {scores[domain.key]}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="5"
                                        step="1"
                                        value={scores[domain.key]}
                                        onChange={(e) => setScores(prev => ({ ...prev, [domain.key]: parseInt(e.target.value) }))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                    <div className="flex justify-between px-1 text-[10px] font-medium text-slate-300">
                                        <span>0</span>
                                        <span>1</span>
                                        <span>2</span>
                                        <span>3</span>
                                        <span>4</span>
                                        <span>5</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ✨ [치료사 전용] 비공개 메모 - 부모에게 안보임 */}
                    <div className="space-y-4 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-2 ml-1">
                            <label className="text-sm font-black text-rose-600 dark:text-rose-400">치료사 전용 내부 메모 (비공개)</label>
                            <span className="text-[10px] bg-rose-100 dark:bg-rose-900/50 text-rose-500 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold">부모 앱 미노출</span>
                        </div>
                        <textarea
                            value={therapistNotes}
                            onChange={(e) => setTherapistNotes(e.target.value)}
                            placeholder="우리 아이의 특이 행동, 주의사항 등 치료진끼리 공유할 내용을 기록하세요. 부모님께는 공개되지 않습니다."
                            className="w-full h-32 p-5 rounded-[24px] border-2 border-rose-100 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-900/10 font-medium text-sm focus:outline-none focus:ring-4 focus:ring-rose-50 dark:focus:ring-rose-500/10 focus:border-rose-200 resize-none text-rose-900 dark:text-rose-100 placeholder:text-rose-300"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-3 rounded-2xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        일지 저장하기
                    </button>
                </div>
            </div>
        </div>
    );
}
