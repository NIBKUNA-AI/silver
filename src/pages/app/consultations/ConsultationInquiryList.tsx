// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    MessageCircle, Phone, Clock, FileText, UserPlus,
    ShieldCheck, RefreshCcw, AlertCircle, Trash2,
    Calendar, CheckCircle2, XCircle, Hourglass, Save, StickyNote
} from 'lucide-react';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default function ConsultationInquiryList() {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [memoValues, setMemoValues] = useState({}); // 각 문의별 메모 임시 상태

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('consultations')
                .select('*')
                .is('schedule_id', null)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInquiries(data || []);

            // 초기 메모 값 설정
            const initialMemos = {};
            data?.forEach(inq => {
                initialMemos[inq.id] = inq.notes || ''; // DB의 notes 컬럼 사용
            });
            setMemoValues(initialMemos);
        } catch (e) {
            console.error("Data Load Error:", e);
        } finally {
            setLoading(false);
        }
    };

    // 메모 저장 함수
    const saveMemo = async (id) => {
        const { error } = await supabase
            .from('consultations')
            .update({ notes: memoValues[id] }) // notes 컬럼에 저장
            .eq('id', id);

        if (!error) {
            alert("메모가 저장되었습니다.");
            fetchData();
        } else {
            alert("저장 실패: " + error.message);
        }
    };

    const updateStatus = async (id, nextStatus) => {
        const { error } = await supabase
            .from('consultations')
            .update({ status: nextStatus })
            .eq('id', id);

        if (!error) {
            setInquiries(prev => prev.map(item =>
                item.id === id ? { ...item, status: nextStatus } : item
            ));
        }
    };

    const deleteInquiry = async (id) => {
        if (!confirm("이 상담 문의를 영구적으로 삭제하시겠습니까?")) return;
        const { error } = await supabase.from('consultations').delete().eq('id', id);
        if (!error) {
            setInquiries(prev => prev.filter(item => item.id !== id));
        }
    };

    if (loading) return <div className="p-20 text-center font-black text-slate-300 animate-pulse">상담 정보를 동기화하고 있습니다...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">상담 문의 센터</h1>
                    <p className="text-slate-500 font-bold mt-2">비회원 문의부터 상담 기록까지 한 화면에서 관리하세요.</p>
                </div>
                <button onClick={fetchData} className="p-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-lg shadow-indigo-100 group">
                    <RefreshCcw className="w-5 h-5 text-white group-hover:rotate-180 transition-all duration-500" />
                </button>
            </header>

            <div className="grid grid-cols-1 gap-8">
                {inquiries.length === 0 ? (
                    <div className="p-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100 text-slate-300 font-black">새로운 문의가 없습니다.</div>
                ) : inquiries.map((inq) => (
                    <div key={inq.id} className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                {inq.child_id ? (
                                    <span className="px-4 py-1.5 rounded-2xl text-[10px] font-black bg-emerald-50 text-emerald-600">정회원</span>
                                ) : (
                                    <span className="px-4 py-1.5 rounded-2xl text-[10px] font-black bg-amber-50 text-amber-600">신규/비회원</span>
                                )}
                                <span className="text-[10px] font-bold text-slate-300">{inq.created_at?.slice(0, 10)} 접수</span>
                            </div>
                            <button onClick={() => deleteInquiry(inq.id)} className="p-3 text-slate-200 hover:text-rose-500 transition-all"><Trash2 className="w-5 h-5" /></button>
                        </div>

                        <h3 className="text-3xl font-black text-slate-900 mb-8">{inq.child_name} 아동 <span className="text-slate-300 text-lg">({inq.child_gender})</span></h3>

                        {/* 부모님 작성 내용 */}
                        <div className="bg-slate-50 p-8 rounded-[32px] mb-6 border border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-6 pb-6 border-b border-slate-200/50">
                                <p className="font-bold text-slate-700 flex items-center gap-3"><Phone className="w-5 h-5 text-indigo-400" /> {inq.guardian_phone} ({inq.guardian_name})</p>
                                <p className="font-bold text-slate-700 flex items-center gap-3"><Clock className="w-5 h-5 text-indigo-400" /> {inq.preferred_consult_schedule}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[11px] font-black text-indigo-500 uppercase tracking-wider">부모님 고민사항</p>
                                <p className="text-slate-600 leading-relaxed font-medium">{inq.primary_concerns}</p>
                            </div>
                        </div>

                        {/* [추가] 상담사 메모란 */}
                        <div className="mb-8 p-8 bg-indigo-50/30 rounded-[32px] border border-indigo-100/50 space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-indigo-600">
                                    <StickyNote className="w-4 h-4" />
                                    <span className="text-xs font-black uppercase">상담사 관리 메모</span>
                                </div>
                                <button
                                    onClick={() => saveMemo(inq.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold hover:bg-indigo-700 transition-all"
                                >
                                    <Save className="w-3 h-3" /> 메모 저장
                                </button>
                            </div>
                            <textarea
                                value={memoValues[inq.id] || ''}
                                onChange={(e) => setMemoValues({ ...memoValues, [inq.id]: e.target.value })}
                                placeholder="상담 진행 내용이나 예약 확정 일자 등을 기록하세요..."
                                className="w-full h-24 bg-white border border-indigo-100 rounded-2xl p-4 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none placeholder:text-slate-300"
                            />
                        </div>

                        {/* 상태 변경 버튼 */}
                        <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => updateStatus(inq.id, 'pending')} className={cn("py-4 rounded-2xl font-black text-[11px] flex items-center justify-center gap-2", inq.status === 'pending' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white border border-slate-100 text-slate-400")}>
                                <Hourglass className="w-4 h-4" /> 상담대기
                            </button>
                            <button onClick={() => updateStatus(inq.id, 'completed')} className={cn("py-4 rounded-2xl font-black text-[11px] flex items-center justify-center gap-2", inq.status === 'completed' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" : "bg-white border border-slate-100 text-slate-400")}>
                                <CheckCircle2 className="w-4 h-4" /> 상담완료
                            </button>
                            <button onClick={() => updateStatus(inq.id, 'canceled')} className={cn("py-4 rounded-2xl font-black text-[11px] flex items-center justify-center gap-2", inq.status === 'canceled' ? "bg-rose-600 text-white shadow-lg shadow-rose-100" : "bg-white border border-slate-100 text-slate-400")}>
                                <XCircle className="w-4 h-4" /> 상담취소
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}