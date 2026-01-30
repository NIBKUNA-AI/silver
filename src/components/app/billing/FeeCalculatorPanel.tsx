// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Silver Care - Fee Calculator Panel
 * 수가 계산기 UI 컴포넌트
 */
import { useState, useMemo } from 'react';
import { Calculator, Clock, User, Moon, Sun, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateVisitFee } from '@/lib/silver-care-calculator';

interface FeeCalculatorPanelProps {
    isDark?: boolean;
}

const GRADES = [
    { value: 1, label: '1등급' },
    { value: 2, label: '2등급' },
    { value: 3, label: '3등급' },
    { value: 4, label: '4등급' },
    { value: 5, label: '5등급' },
    { value: 'Cognitive', label: '인지지원등급' },
];

const TIME_SLOTS = [30, 60, 90, 120, 150, 180, 210, 240];

const COPAY_RATES = [
    { value: 15, label: '일반 (15%)' },
    { value: 9, label: '경감 (9%)' },
    { value: 6, label: '차상위 (6%)' },
    { value: 0, label: '기초수급 (0%)' },
];

export function FeeCalculatorPanel({ isDark = false }: FeeCalculatorPanelProps) {
    const [grade, setGrade] = useState<number | string>(3);
    const [minutes, setMinutes] = useState(120);
    const [isNight, setIsNight] = useState(false);
    const [isHoliday, setIsHoliday] = useState(false);
    const [copayRate, setCopayRate] = useState(15);

    const result = useMemo(() => {
        return calculateVisitFee(grade, minutes, {
            isNight,
            isHoliday,
            copayRate,
        });
    }, [grade, minutes, isNight, isHoliday, copayRate]);

    return (
        <div className={cn(
            "rounded-[32px] border p-8 space-y-8",
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xl"
        )}>
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center",
                    isDark ? "bg-indigo-900/50" : "bg-indigo-50"
                )}>
                    <Calculator className={cn("w-7 h-7", isDark ? "text-indigo-400" : "text-indigo-600")} />
                </div>
                <div>
                    <h2 className={cn("text-2xl font-black", isDark ? "text-white" : "text-slate-900")}>
                        장기요양 수가 계산기
                    </h2>
                    <p className={cn("text-sm", isDark ? "text-slate-500" : "text-slate-400")}>
                        2024년 방문요양 급여 수가표 기준
                    </p>
                </div>
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Grade Selection */}
                <div className="space-y-2">
                    <label className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-slate-500" : "text-slate-400")}>
                        <User className="w-4 h-4 inline mr-2" />장기요양등급
                    </label>
                    <select
                        value={grade}
                        onChange={(e) => setGrade(isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))}
                        className={cn(
                            "w-full p-4 rounded-2xl font-bold text-lg outline-none transition-all",
                            isDark
                                ? "bg-slate-800 text-white border-slate-700 focus:ring-4 focus:ring-indigo-900"
                                : "bg-slate-50 text-slate-900 border-slate-200 focus:ring-4 focus:ring-indigo-100"
                        )}
                    >
                        {GRADES.map(g => (
                            <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                    </select>
                </div>

                {/* Time Selection */}
                <div className="space-y-2">
                    <label className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-slate-500" : "text-slate-400")}>
                        <Clock className="w-4 h-4 inline mr-2" />방문 시간
                    </label>
                    <select
                        value={minutes}
                        onChange={(e) => setMinutes(Number(e.target.value))}
                        className={cn(
                            "w-full p-4 rounded-2xl font-bold text-lg outline-none transition-all",
                            isDark
                                ? "bg-slate-800 text-white border-slate-700 focus:ring-4 focus:ring-indigo-900"
                                : "bg-slate-50 text-slate-900 border-slate-200 focus:ring-4 focus:ring-indigo-100"
                        )}
                    >
                        {TIME_SLOTS.map(t => (
                            <option key={t} value={t}>{t}분 ({Math.floor(t / 60)}시간 {t % 60 > 0 ? `${t % 60}분` : ''})</option>
                        ))}
                    </select>
                </div>

                {/* Copay Rate */}
                <div className="space-y-2">
                    <label className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-slate-500" : "text-slate-400")}>
                        본인부담율
                    </label>
                    <select
                        value={copayRate}
                        onChange={(e) => setCopayRate(Number(e.target.value))}
                        className={cn(
                            "w-full p-4 rounded-2xl font-bold text-lg outline-none transition-all",
                            isDark
                                ? "bg-slate-800 text-white border-slate-700 focus:ring-4 focus:ring-indigo-900"
                                : "bg-slate-50 text-slate-900 border-slate-200 focus:ring-4 focus:ring-indigo-100"
                        )}
                    >
                        {COPAY_RATES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>

                {/* Shift Add-ons */}
                <div className="space-y-2">
                    <label className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-slate-500" : "text-slate-400")}>
                        가산 적용
                    </label>
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setIsNight(!isNight); if (!isNight) setIsHoliday(false); }}
                            className={cn(
                                "flex-1 p-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                                isNight
                                    ? "bg-amber-500 text-white shadow-lg"
                                    : isDark ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400"
                            )}
                        >
                            <Moon className="w-5 h-5" />
                            야간
                        </button>
                        <button
                            onClick={() => { setIsHoliday(!isHoliday); if (!isHoliday) setIsNight(false); }}
                            className={cn(
                                "flex-1 p-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                                isHoliday
                                    ? "bg-rose-500 text-white shadow-lg"
                                    : isDark ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400"
                            )}
                        >
                            <Calendar className="w-5 h-5" />
                            휴일
                        </button>
                    </div>
                </div>
            </div>

            {/* Result Display */}
            {result && (
                <div className={cn(
                    "rounded-[28px] p-8 grid grid-cols-2 md:grid-cols-4 gap-6",
                    isDark ? "bg-slate-800" : "bg-gradient-to-br from-indigo-50 to-blue-50"
                )}>
                    <div className="text-center">
                        <p className={cn("text-xs font-bold uppercase tracking-wider mb-2", isDark ? "text-slate-500" : "text-slate-400")}>기본 수가</p>
                        <p className={cn("text-2xl font-black", isDark ? "text-slate-300" : "text-slate-700")}>{result.basePrice.toLocaleString()}원</p>
                    </div>
                    <div className="text-center">
                        <p className={cn("text-xs font-bold uppercase tracking-wider mb-2", isDark ? "text-slate-500" : "text-slate-400")}>총 급여액</p>
                        <p className={cn("text-2xl font-black", isDark ? "text-white" : "text-slate-900")}>{result.totalPrice.toLocaleString()}원</p>
                    </div>
                    <div className="text-center">
                        <p className={cn("text-xs font-bold uppercase tracking-wider mb-2 text-rose-400")}>본인부담금</p>
                        <p className="text-2xl font-black text-rose-500">{result.copay.toLocaleString()}원</p>
                    </div>
                    <div className="text-center">
                        <p className={cn("text-xs font-bold uppercase tracking-wider mb-2 text-emerald-400")}>공단부담금</p>
                        <p className="text-2xl font-black text-emerald-500">{result.governmentPay.toLocaleString()}원</p>
                    </div>
                </div>
            )}

            {/* Monthly Limit Info */}
            {result && (
                <div className={cn(
                    "text-center py-4 rounded-2xl text-sm font-bold",
                    isDark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500"
                )}>
                    ※ {typeof grade === 'string' ? '인지지원등급' : `${grade}등급`} 월 한도액: <span className={cn("font-black", isDark ? "text-indigo-400" : "text-indigo-600")}>{result.limit.toLocaleString()}원</span>
                </div>
            )}
        </div>
    );
}
