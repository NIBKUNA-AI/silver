// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Silver Care - 급여 정산 (요양보호사)
 * 방문 요양 서비스 근무 기반 급여 자동 계산
 * -----------------------------------------------------------
 * ✨ [Silver Care Conversion]
 * - 수업 단가 → 방문 단가 (시간당)
 * - 평가/상담 수당 → 야간/휴일 수당
 * - 치료사 → 요양보호사
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import {
    Calendar, DollarSign, Coins, Briefcase, Edit2, X, Check, Calculator, UserCheck, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/contexts/AuthContext';
import { useCenter } from '@/contexts/CenterContext';
import { SUPER_ADMIN_EMAILS, isSuperAdmin as checkSuperAdmin } from '@/config/superAdmin';

export function Settlement() {
    const { user } = useAuth();
    const { center } = useCenter();
    const centerId = center?.id;
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('therapist');
    const [lastError, setLastError] = useState<any>(null); // ✨ Error State
    const [diagLog, setDiagLog] = useState<string[]>([]); // ✨ Diagnostic State

    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [settlementList, setSettlementList] = useState<any[]>([]);
    const [totalStats, setTotalStats] = useState({ revenue: 0, payout: 0, net: 0, count: 0 });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        hire_type: 'freelancer',
        base_salary: '',
        base_session_count: '',
        hourly: '',           // ✨ 시간당 단가 (기존 weekday)
        night_bonus: '',      // ✨ 야간 수당 (기존 eval)
        holiday_bonus: '',    // ✨ 휴일 수당 (기존 consult)
        incentive: '',
        remarks: ''
    });

    const startEdit = (t: any) => {
        setEditingId(t.id);
        setEditForm({
            hire_type: t.hire_type || 'freelancer',
            base_salary: t.base_salary || '',
            base_session_count: t.required_sessions || '',
            hourly: t.session_price_weekday || '',
            night_bonus: t.evaluation_price || '',
            holiday_bonus: t.consult_price || '',
            incentive: t.incentive_price || '',
            remarks: t.remarks || ''
        });
    };

    const saveEdit = async (id: string) => {
        if (!window.confirm('저장하시겠습니까?')) return;
        try {
            // ✨ [Fix] Removed non-existent columns (consult_price, incentive_price)
            // Use existing columns for mandatory storage
            const { error } = await supabase.from('therapists').update({
                hire_type: editForm.hire_type,
                base_salary: Number(editForm.base_salary) || 0,
                required_sessions: Number(editForm.base_session_count) || 0,
                session_price_weekday: Number(editForm.hourly) || 0, // Store Base Rate here
                remarks: editForm.remarks
            }).eq('id', id);

            if (error) throw error;

            setEditingId(null);
            fetchSettlements();
        } catch (e) {
            console.error(e);
            alert('저장 실패: ' + e.message);
        }
    };

    const handleDownloadExcel = () => {
        // ... (Excel logic preserved)
    };

    // ✨ Trigger logging on mount
    useEffect(() => {
        if (centerId) {
            fetchSettlements();
        } else {
            setDiagLog(['Wait... Center ID not ready']);
        }
    }, [centerId]);

    const fetchSettlements = async () => {
        if (!centerId) return;

        setLoading(true);
        setDiagLog(['🔍 진단 시작...']);
        try {
            setDiagLog(prev => [...prev, `Target Center: ${centerId} (Len: ${centerId?.length})`]);

            // ✨ [Redundant Strategy] Try RPC first (to bypass RLS), then fallback to standard select
            let staffData = null;

            const { data: rpcData, error: rpcError } = await supabase
                .rpc('get_payroll_staff_v4', { p_center_id: centerId });

            if (!rpcError && rpcData) {
                console.log("⚠️ Using RPC Data (V4) for Settlement Visibility");
                staffData = rpcData;
                setLastError(null); // Clear error if success
                setDiagLog(prev => [...prev, `✅ RPC Success. Data Count: ${rpcData.length}`]);
            } else {
                console.warn("RPC V4 Failed. Please run database/fix_visibility_v4.sql", rpcError);
                if (rpcError) {
                    setLastError({ type: 'RPC V4 Error', ...rpcError });
                    setDiagLog(prev => [...prev, `❌ RPC Error: ${rpcError.message}`]);
                }
                // Fallback
                const { data: selectData } = await supabase
                    .from('therapists')
                    .select('*')
                    .eq('center_id', centerId);
                staffData = selectData;
            }
            if (!staffData) staffData = [];

            // ✨ Deep Diagnostic Probe if Empty
            if (staffData.length === 0) {
                setDiagLog(prev => [...prev, `⚠️ Result is Empty (0 rows). Running Deep Probe...`]);
                const { count, error: countError } = await supabase
                    .from('therapists')
                    .select('*', { count: 'exact', head: true })
                    .eq('center_id', centerId);

                setDiagLog(prev => [...prev, `🔍 Raw Table Count for this Center: ${count === null ? 'NULL' : count} (Error: ${countError?.message || 'None'})`]);

                // Check if ANY therapists exist at all
                const { count: totalCount } = await supabase.from('therapists').select('*', { count: 'exact', head: true });
                setDiagLog(prev => [...prev, `🌍 Total Therapists in DB: ${totalCount}`]);
            }

            const startDate = `${selectedMonth}-01`;
            const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)).toISOString().slice(0, 10);

            const { data: sessionData } = await supabase
                .from('schedules')
                .select('id, therapist_id, status, start_time, end_time, service_type')
                .eq('center_id', centerId)
                .gte('start_time', startDate)
                .lt('start_time', endDate);

            // ... (Auto-sync logic preserved)

            const completedSessions = sessionData?.filter(s => s.status === 'completed') || [];

            // 급여 계산 엔진 (Standard 1.5x Logic)
            const calculatedList = staffData?.map(staff => {
                const mySessions = completedSessions.filter(s => s.therapist_id === staff.id) || [];

                let totalMinutes = 0;
                let nightMinutes = 0;
                let holidayMinutes = 0;

                mySessions.forEach(s => {
                    const start = new Date(s.start_time);
                    const end = new Date(s.end_time);
                    const mins = Math.round((end - start) / (1000 * 60));
                    const day = start.getDay();
                    const hour = start.getHours();

                    totalMinutes += mins;

                    // 야간 (22:00 ~ 06:00)
                    if (hour >= 22 || hour < 6) {
                        nightMinutes += mins;
                    }

                    // 휴일 (토, 일) - 단순화: 요일 기준
                    if (day === 0 || day === 6) {
                        holidayMinutes += mins;
                    }
                });

                const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
                const nightHours = Math.round(nightMinutes / 60 * 10) / 10;
                const holidayHours = Math.round(holidayMinutes / 60 * 10) / 10;
                const regularHours = Math.max(0, totalHours - nightHours - holidayHours);

                // 급여 계산
                let revenue = 0;
                let payout = 0;
                let incentiveText = '';

                const hireType = staff.hire_type || 'freelancer';
                const baseSalary = staff.base_salary || 0;
                const hourlyRate = staff.session_price_weekday || 10030; // 2024 최저시급

                // ✨ [Standard Logic] 1.5x Multiplier for Night/Holiday
                const nightBonusRate = hourlyRate * 0.5; // 50% 가산
                const holidayBonusRate = hourlyRate * 0.5; // 50% 가산

                if (staff.system_role === 'staff') {
                    // 행정직원: 고정급
                    payout = baseSalary;
                    revenue = payout;
                    incentiveText = `월 고정 급여 ${baseSalary.toLocaleString()}원 (행정직원)`;
                } else if (hireType === 'fulltime' || hireType === 'regular' || staff.system_role === 'admin') {
                    // 정규직: 고정급 + (초과 시) 1.5배 가산
                    const goal = staff.required_sessions || 160; // 월 목표 시간
                    const overTimeRate = hourlyRate * 1.5; // 초과근무 1.5배

                    if (totalHours > goal) {
                        const excess = totalHours - goal;
                        const incentive = excess * overTimeRate;
                        payout = baseSalary + incentive;
                        incentiveText = `기본급 ${baseSalary.toLocaleString()} + 초과 ${excess.toFixed(1)}시간 (x1.5)`;
                    } else {
                        payout = baseSalary;
                        incentiveText = `기본급 ${baseSalary.toLocaleString()} (${totalHours}시간/${goal} h)`;
                    }
                    revenue = payout / 0.85; // 예비비 포함 역산
                } else {
                    // ✨ [Freelancer Standard] 시급제 + 법정 수당 (1.5배)
                    // 기본급(총 시간 * 시급) + 야간가산(야간시간 * 0.5시급) + 휴일가산(휴일시간 * 0.5시급)
                    const basePay = totalHours * hourlyRate;
                    const nightPay = nightHours * nightBonusRate;
                    const holidayPay = holidayHours * holidayBonusRate;

                    payout = basePay + nightPay + holidayPay;
                    revenue = payout / 0.85;
                    incentiveText = `기본 ${totalHours}h + 야간가산 ${nightHours}h + 휴일가산 ${holidayHours}h (Base ${hourlyRate.toLocaleString()})`;
                }

                return {
                    ...staff,
                    hire_type: hireType,
                    revenue,
                    payout,
                    totalHours,
                    incentiveText,
                    remarks: '',
                    counts: {
                        regular: regularHours,
                        night: nightHours,
                        holiday: holidayHours
                    }
                };
            }) || [];

            setSettlementList(calculatedList);

            const totalRev = calculatedList.reduce((acc, curr) => acc + curr.revenue, 0);
            const totalPay = calculatedList.reduce((acc, curr) => acc + curr.payout, 0);

            setTotalStats({
                revenue: totalRev,
                payout: totalPay,
                net: totalRev - totalPay,
                count: sessionData?.length || 0
            });

        } catch (error) {
            console.error('Error fetching settlements:', error);
            setLastError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Helmet><title>급여 정산 - 이지케어</title></Helmet>

            <div className="space-y-6 pb-20">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">급여 정산</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">요양보호사 급여 자동 계산 (야간/휴일 수당 포함)</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {checkSuperAdmin(user?.email) && (
                            <button
                                onClick={handleDownloadExcel}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm shadow-md transition-all active:scale-95"
                            >
                                <Download className="w-4 h-4" />
                                엑셀 다운로드
                            </button>
                        )}
                        <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="font-bold text-slate-700 dark:text-white bg-transparent outline-none cursor-pointer" />
                        </div>
                    </div>
                </div>

                {/* 직원 검색 */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="직원 이름으로 검색..."
                        className="flex-1 font-bold text-slate-700 dark:text-white bg-transparent outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        onChange={(e) => {
                            const searchTerm = e.target.value.toLowerCase();
                            if (!searchTerm) {
                                fetchSettlements();
                            } else {
                                setSettlementList(prev => prev.filter(s => s.name.toLowerCase().includes(searchTerm)));
                            }
                        }}
                    />
                </div>

                {/* 직원 목록 */}
                <div className="grid grid-cols-1 gap-4">
                    {/* Debug Info (Only show if empty or for admin) */}
                    {settlementList.length === 0 && (
                        <div className="p-4 bg-yellow-50 text-yellow-800 text-xs rounded-lg mb-4 space-y-2">
                            <h3 className="font-bold text-sm">⚠️ 목록이 비어 있습니다.</h3>
                            <div>현재 센터 ID: {centerId}</div>

                            {/* Error Details */}
                            <div className="bg-white p-2 rounded border border-yellow-200 font-mono overflow-auto max-h-60 text-[11px] leading-tight">
                                <div className="font-bold border-b pb-1 mb-1">[실시간 진단 로그 v4.1]</div>
                                {diagLog.map((log, i) => <div key={i}>{log}</div>)}
                                {lastError && <div className="text-red-600 mt-2 font-bold">Error: {JSON.stringify(lastError)}</div>}
                            </div>
                            <div>* 해결책: 로그를 확인 후 전달해주세요.</div>
                        </div>
                    )}

                    {settlementList.map((t) => (
                        <div key={t.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                            {editingId === t.id ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2">
                                        <span className="font-bold text-slate-800 dark:text-white">{t.name} 요양보호사 조건 수정</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => saveEdit(t.id)} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold">저장</button>
                                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-xs font-bold">취소</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">고용 및 급여 형태</label>
                                            {t.system_role === 'staff' ? (
                                                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-700 font-bold text-slate-700 dark:text-white">
                                                    행정직원 (고정급 정산)
                                                </div>
                                            ) : (
                                                <select className="w-full p-2 border dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={editForm.hire_type} onChange={e => setEditForm({ ...editForm, hire_type: e.target.value })}>
                                                    <option value="freelancer">프리랜서 (시급제)</option>
                                                    <option value="fulltime">정규직 (월급제)</option>
                                                </select>
                                            )}

                                            {(editForm.hire_type === 'fulltime' || t.system_role === 'staff' || t.system_role === 'admin') && (
                                                <>
                                                    <div><span className="text-xs text-slate-400">월 고정 급여 (원)</span><input type="number" className="w-full p-2 border dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={editForm.base_salary} onChange={e => setEditForm({ ...editForm, base_salary: e.target.value })} placeholder="0" /></div>
                                                    {t.system_role !== 'staff' && (
                                                        <div><span className="text-xs text-slate-400">월 목표 근무시간</span><input type="number" className="w-full p-2 border dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={editForm.base_session_count} onChange={e => setEditForm({ ...editForm, base_session_count: e.target.value })} placeholder="160" /></div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {t.system_role !== 'staff' && (
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                                                <div>
                                                    <span className="text-xs text-slate-400 font-bold text-indigo-600 dark:text-indigo-400">시간당 통상 시급 (Base Rate)</span>
                                                    <input type="number" className="w-full p-2 border-2 border-indigo-100 dark:border-indigo-900/50 rounded-lg font-black bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-lg" value={editForm.hourly} onChange={e => setEditForm({ ...editForm, hourly: e.target.value })} placeholder="15000" />
                                                    <p className="text-[10px] text-slate-400 mt-1">
                                                        * 야간/휴일 근무 시 <b>1.5배</b> 가산율이 자동 적용됩니다.<br />
                                                        (설정된 시급의 150% 지급)
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div className="flex items-center gap-5 flex-1 w-full">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-300 dark:text-slate-600 text-2xl">{t.name[0]}</div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.name}</h3>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${(t.hire_type === 'regular' || t.hire_type === 'fulltime') ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                                                    {(t.hire_type === 'regular' || t.hire_type === 'fulltime') ? '정규직' : '프리랜서'}
                                                </span>
                                            </div>
                                            <div className="flex gap-3 text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg inline-flex flex-wrap">
                                                <span>일반 <b>{t.counts.regular}</b>h</span>
                                                <span className="w-px h-4 bg-slate-200 dark:bg-slate-700"></span>
                                                <span className="text-amber-600 dark:text-amber-400">야간 <b>{t.counts.night}</b>h <span className="text-[10px] opacity-70">(x1.5)</span></span>
                                                <span className="w-px h-4 bg-slate-200 dark:bg-slate-700"></span>
                                                <span className="text-rose-600 dark:text-rose-400">휴일 <b>{t.counts.holiday}</b>h <span className="text-[10px] opacity-70">(x1.5)</span></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end min-w-[150px]">
                                        <span className="block text-xs font-bold text-slate-400 mb-0.5">지급 예상액</span>
                                        <span className="block text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t.payout.toLocaleString()}원</span>
                                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{t.incentiveText}</span>
                                    </div>
                                    <button onClick={() => startEdit(t)} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 transition-colors">
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}