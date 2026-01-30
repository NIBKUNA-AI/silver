// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useCenter } from '@/contexts/CenterContext';
import { X, Save, Loader2, MessageCircle } from 'lucide-react';
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


    useEffect(() => {
        if (isOpen && assessmentId) {
            loadExistingData();
        } else {
            setSummary('');
            setTherapistNotes('');
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
                score_communication: 0,
                score_social: 0,
                score_cognitive: 0,
                score_motor: 0,
                score_adaptive: 0,
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
                        content: summary || '방문 요양 서비스 제공',
                        activities: '신체활동지원, 정서지원',
                        child_response: '서비스 제공 완료'
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
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">급여제공기록지 작성</h2>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">{childName} 어르신 • 상태/특이사항 기록</p>
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
                            급여제공기록 (보호자 공개)
                        </label>
                        <p className="text-xs text-slate-400 font-bold ml-7 -mt-2">
                            오늘 제공한 급여 내용(식사, 목욕, 이동도움 등)과 어르신의 상태 변화를 기록해주세요. 보호자 앱에 노출됩니다.
                        </p>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="예: [식사] 점심 식사 전량 섭취하셨습니다. [위생] 목욕 서비스 제공하였으며 특이사항 없습니다. [상태] 기분이 좋아 보이십니다."
                            className="w-full h-80 p-8 rounded-[32px] border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:border-indigo-300 focus:bg-white outline-none resize-none transition-all placeholder:text-slate-300"
                        />
                    </div>


                    {/* ✨ [요양보호사 전용] 비공개 메모 - 보호자에게 안보임 */}
                    <div className="space-y-4 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-2 ml-1">
                            <label className="text-sm font-black text-rose-600 dark:text-rose-400">요양보호사/센터 전용 메모 (비공개)</label>
                            <span className="text-[10px] bg-rose-100 dark:bg-rose-900/50 text-rose-500 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold">보호자 앱 미노출</span>
                        </div>
                        <textarea
                            value={therapistNotes}
                            onChange={(e) => setTherapistNotes(e.target.value)}
                            placeholder="어르신의 특이 행동, 주의사항 등 센터 직원끼리 공유할 내용을 기록하세요. 보호자에게는 공개되지 않습니다."
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
