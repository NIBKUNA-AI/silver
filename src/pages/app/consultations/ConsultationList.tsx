// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Silver Care - 급여제공기록지 관리
 * 방문 요양 서비스 제공 기록 및 관리
 * -----------------------------------------------------------
 * ✨ [Silver Care Conversion] 
 * - 발달 평가 → 급여 제공 기록
 * - 아동 → 수급자(어르신)
 * - 상담일지 → 급여제공기록지
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCenter } from '@/contexts/CenterContext';
import {
    Clock, CheckCircle2, X,
    Pencil, Trash2, FileText, ClipboardList
} from 'lucide-react';
import { AssessmentFormModal } from '@/pages/app/children/AssessmentFormModal';
import { isSuperAdmin as checkSuperAdmin } from '@/config/superAdmin';

export function ConsultationList() {
    const { user } = useAuth();
    const { center } = useCenter();
    const centerId = center?.id;
    const [userRole, setUserRole] = useState('therapist');
    const [todoRecipients, setTodoRecipients] = useState([]);
    const [recentRecords, setRecentRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    // 기록지 작성 모달 상태
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [editingRecordId, setEditingRecordId] = useState(null);

    useEffect(() => {
        if (user && centerId) {
            fetchData();
        }
    }, [user, centerId]);

    const fetchData = async () => {
        if (!centerId || typeof centerId !== 'string' || centerId.length < 32) return;
        setLoading(true);
        try {
            const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).maybeSingle();
            const role = profile?.role || 'therapist';
            setUserRole(role);

            const isSuperAdmin = role === 'super_admin' || checkSuperAdmin(user?.email);
            const isAdmin = role === 'admin' || isSuperAdmin;

            // 현재 로그인한 요양보호사 조회
            let currentCareWorkerId = null;
            if (!isAdmin) {
                const { data: therapist } = await supabase
                    .from('therapists')
                    .select('id')
                    .eq('profile_id', user.id)
                    .maybeSingle();

                currentCareWorkerId = therapist?.id;

                if (!currentCareWorkerId && user.email) {
                    const { data: legacyTherapist } = await supabase
                        .from('therapists')
                        .select('id')
                        .eq('email', user.email)
                        .maybeSingle();
                    currentCareWorkerId = legacyTherapist?.id;
                }

                if (!currentCareWorkerId) {
                    setTodoRecipients([]);
                    setRecentRecords([]);
                    setLoading(false);
                    return;
                }
            }

            // 이미 기록지가 작성된 스케줄 ID 수집
            const { data: writtenLogs } = await supabase
                .from('counseling_logs')
                .select('schedule_id')
                .eq('center_id', centerId)
                .not('schedule_id', 'is', null);

            const writtenScheduleIds = new Set(writtenLogs?.map(l => l.schedule_id));

            const today = new Date().toISOString().split('T')[0];
            const limitDate = new Date();
            limitDate.setDate(limitDate.getDate() - 60);
            const minDate = limitDate.toISOString().split('T')[0];

            let sessionQuery = supabase
                .from('schedules')
                .select(`id, child_id, status, therapist_id, start_time, end_time, service_type, children!inner (id, name, center_id)`)
                .eq('children.center_id', centerId)
                .gte('start_time', minDate)
                .or(`status.eq.completed,start_time.lt.${today}T23:59:59`);

            if (!isAdmin && currentCareWorkerId) {
                sessionQuery = sessionQuery.eq('therapist_id', currentCareWorkerId);
            }
            const { data: sessions } = await sessionQuery.order('start_time', { ascending: false });

            // 기록지가 없는 스케줄만 필터링
            const pending = sessions?.filter(s => s.children && !writtenScheduleIds.has(s.id)) || [];
            setTodoRecipients(pending);

            // 최근 작성된 기록지
            let recordQuery = supabase
                .from('development_assessments')
                .select('*, children!inner(id, name, center_id)')
                .eq('children.center_id', centerId)
                .not('summary', 'eq', '부모님 자가진단 기록')
                .order('created_at', { ascending: false })
                .limit(20);

            if (!isAdmin && currentCareWorkerId) {
                recordQuery = recordQuery.eq('therapist_id', currentCareWorkerId);
            }
            const { data: records } = await recordQuery;
            setRecentRecords(records || []);

        } catch (e) {
            console.error("데이터 로드 오류:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenRecord = async (session) => {
        try {
            const { data: log } = await supabase
                .from('counseling_logs')
                .select('id')
                .eq('schedule_id', session.id)
                .maybeSingle();

            setSelectedSession({
                ...session,
                realLogId: log?.id || null
            });
            setIsRecordModalOpen(true);
        } catch (error) {
            console.error("세션 확인 중 오류:", error);
        }
    };

    const handleRecordSuccess = () => {
        setIsRecordModalOpen(false);
        setSelectedSession(null);
        setEditingRecordId(null);
        fetchData();
    };

    const handleEdit = (record) => {
        setEditingRecordId(record.id);
        setSelectedSession({
            children: record.children || { id: record.child_id, name: '수급자' },
            realLogId: record.log_id,
            therapist_id: record.therapist_id
        });
        setIsRecordModalOpen(true);
    };

    const handleDelete = async (record) => {
        if (!confirm("정말 이 급여제공기록을 삭제하시겠습니까?\n보호자 앱에서도 즉시 사라집니다.")) return;

        try {
            const { error: recordError } = await supabase.from('development_assessments').delete().eq('id', record.id);
            if (recordError) throw recordError;

            if (record.log_id) {
                const { data: log } = await supabase.from('counseling_logs').select('content').eq('id', record.log_id).maybeSingle();
                if (log?.content?.includes('발달 평가 작성을 위해 자동 생성')) {
                    await supabase.from('counseling_logs').delete().eq('id', record.log_id);
                }
            }

            alert("삭제되었습니다.");
            fetchData();
        } catch (e) {
            console.error(e);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    // 서비스 시간 계산
    const calcDuration = (record) => {
        if (record.start_time && record.end_time) {
            const start = new Date(record.start_time);
            const end = new Date(record.end_time);
            const minutes = Math.round((end - start) / (1000 * 60));
            return `${minutes}분`;
        }
        return '-';
    };

    if (loading) return <div className="p-20 text-center font-black text-slate-300 dark:text-slate-500 animate-pulse">데이터 동기화 중...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 selection:bg-primary/10">
            <header className="flex justify-between items-end bg-white dark:bg-slate-800 p-10 rounded-[48px] border border-slate-100 dark:border-slate-700 shadow-sm">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">급여제공기록지</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mt-3 text-sm">
                        {userRole === 'admin' || userRole === 'super_admin'
                            ? '방문 요양 서비스 제공 기록을 관리합니다.'
                            : '방문 완료 후 급여 제공 내역을 기록해 주세요.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-300 px-6 py-3 rounded-3xl text-xs font-black uppercase">
                        {(userRole === 'super_admin' || checkSuperAdmin(user?.email)) ? 'SUPER ADMIN' : userRole === 'admin' ? 'ADMIN MODE' : '요양보호사'}
                    </div>
                </div>
            </header>

            {/* 작성 대기 목록 */}
            <section>
                <div className="flex items-center justify-between mb-8 px-4">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-2xl"><Clock className="w-6 h-6 text-rose-500" /></div>
                        기록 대기 목록
                        <span className="ml-2 text-rose-500 bg-rose-50 dark:bg-rose-900/30 px-3 py-1 rounded-xl text-lg">{todoRecipients.length}</span>
                    </h2>
                </div>

                {todoRecipients.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {todoRecipients.map((session) => (
                            <div key={session.id} className="bg-white dark:bg-slate-800 p-10 rounded-[48px] border-2 border-slate-50 dark:border-slate-700 shadow-sm hover:border-primary/20 dark:hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8">
                                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest">{session.start_time.split('T')[0]}</span>
                                </div>
                                <div className="mb-8">
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-[28px] flex items-center justify-center text-3xl font-black text-indigo-400 group-hover:from-indigo-500 group-hover:to-purple-500 group-hover:text-white transition-all shadow-inner mb-6">
                                        {session.children?.name[0]}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{session.children?.name} 어르신</h3>
                                    <p className="text-primary dark:text-indigo-400 text-xs font-black mt-2">{session.service_type || '방문 요양'}</p>
                                </div>
                                <button
                                    onClick={() => handleOpenRecord(session)}
                                    className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[24px] font-black text-sm hover:from-indigo-700 hover:to-purple-700 transition-all active:scale-95 shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                                >
                                    <ClipboardList className="w-5 h-5" />
                                    급여제공기록 작성하기
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="col-span-full bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[56px] p-24 text-center">
                        <CheckCircle2 className="w-12 h-12 text-slate-200 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 dark:text-slate-500 font-black text-lg">모든 급여제공기록 작성을 완료했습니다!</p>
                    </div>
                )}
            </section>

            {/* 최근 작성 내역 */}
            <section>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3 px-4">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>
                    최근 제공기록 내역
                </h2>
                <div className="bg-white dark:bg-slate-800 rounded-[48px] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="p-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">방문일</th>
                                <th className="p-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">수급자</th>
                                <th className="p-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">서비스 유형</th>
                                <th className="p-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                            {recentRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-400 dark:text-slate-500 font-bold">아직 작성된 급여제공기록이 없습니다.</td>
                                </tr>
                            ) : (
                                recentRecords.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-8 text-sm font-bold text-slate-500 dark:text-slate-400">{record.evaluation_date || record.created_at?.split('T')[0]}</td>
                                        <td className="p-8 text-base font-black text-slate-900 dark:text-white">{record.children?.name || '수급자'} 어르신</td>
                                        <td className="p-8 text-center">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl font-black text-indigo-700 text-xs">
                                                <FileText className="w-3 h-3" />
                                                {record.service_type || '방문 요양'}
                                            </div>
                                        </td>
                                        <td className="p-8 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(record)}
                                                    className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-2xl transition-all"
                                                    title="수정"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(record)}
                                                    className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-2xl transition-all"
                                                    title="삭제"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 기록 작성 모달 */}
            {isRecordModalOpen && selectedSession?.children && (
                <AssessmentFormModal
                    isOpen={isRecordModalOpen}
                    onClose={() => { setIsRecordModalOpen(false); setSelectedSession(null); setEditingRecordId(null); }}
                    childId={selectedSession.children.id}
                    childName={selectedSession.children.name}
                    logId={selectedSession.realLogId || null}
                    scheduleId={selectedSession.id || null}
                    sessionDate={selectedSession.start_time?.split('T')[0] || null}
                    therapistId={selectedSession.therapist_id || null}
                    assessmentId={editingRecordId}
                    onSuccess={handleRecordSuccess}
                />
            )}
        </div>
    );
}