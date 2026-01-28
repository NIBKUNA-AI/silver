// @ts-nocheck
/* eslint-disable */
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { Brain, Activity, MessageCircle, Baby, HeartHandshake } from "lucide-react";
import { cn } from '@/lib/utils';

const DOMAINS_META = [
    { key: 'communication', label: '언어/의사소통', color: 'text-blue-600', bg: 'bg-blue-50', icon: MessageCircle },
    { key: 'social', label: '사회/정서', color: 'text-rose-600', bg: 'bg-rose-50', icon: HeartHandshake },
    { key: 'cognitive', label: '인지/학습', color: 'text-purple-600', bg: 'bg-purple-50', icon: Brain },
    { key: 'motor', label: '대근육/소근육', color: 'text-amber-600', bg: 'bg-amber-50', icon: Activity },
    { key: 'adaptive', label: '자조/적응', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Baby },
];

export function ParentDevelopmentChart({
    assessments,
    isInteractive = false
}: {
    assessments: any[],
    isInteractive?: boolean
}) {
    const hasData = assessments && assessments.length > 0;

    if (!hasData) return (
        <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-black">아직 기록된 발달 평가가 없습니다.</p>
            <p className="text-xs text-slate-300 mt-2">치료사가 정기 평가를 작성하면 이곳에 그래프가 표시됩니다.</p>
        </div>
    );

    const latest = assessments[0] || {
        evaluation_date: '진단 기록 없음',
        score_communication: 0, score_social: 0, score_cognitive: 0, score_motor: 0, score_adaptive: 0,
        assessment_details: {}
    };

    const previous = assessments.length > 1 ? assessments[1] : null;

    const radarData = [
        { subject: '언어/의사소통', A: latest.score_communication || 0, B: previous?.score_communication || 0, fullMark: 5 },
        { subject: '사회/정서', A: latest.score_social || 0, B: previous?.score_social || 0, fullMark: 5 },
        { subject: '인지/학습', A: latest.score_cognitive || 0, B: previous?.score_cognitive || 0, fullMark: 5 },
        { subject: '대/소근육', A: latest.score_motor || 0, B: previous?.score_motor || 0, fullMark: 5 },
        { subject: '자조/적응', A: latest.score_adaptive || 0, B: previous?.score_adaptive || 0, fullMark: 5 },
    ];

    const historyData = assessments
        .filter(a => a.evaluation_date !== '실시간 자가진단')
        .reverse()
        .map(a => ({
            date: a.evaluation_date?.includes('-') ? a.evaluation_date.slice(5, 7) + '월' : a.evaluation_date,
            '언어': a.score_communication,
            '사회': a.score_social,
            '인지': a.score_cognitive,
            '운동': a.score_motor,
            '자조': a.score_adaptive,
        }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* 1. 최신 발달 밸런스 (Radar Chart) */}
            <section className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-50 relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 leading-none">영역별 발달 밸런스</h3>
                        <p className="text-xs text-indigo-600 mt-2 font-black">
                            {latest.evaluation_date === '실시간 자가진단' ? '✨ 실시간 체크 결과가 반영된 그래프입니다.' : `최근 기록일: ${latest.evaluation_date}`}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                            <span className="text-[10px] font-bold text-slate-600">현재 상태</span>
                        </div>
                        {previous && (
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-slate-200 border border-dashed border-slate-400"></div>
                                <span className="text-[10px] font-bold text-slate-400">
                                    이전 기록 ({previous.evaluation_date?.slice(5)})
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="h-[300px] md:h-[340px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                            <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                            {previous && (
                                <Radar
                                    name="이전 기록"
                                    dataKey="B"
                                    stroke="#94a3b8"
                                    strokeWidth={1.5}
                                    strokeDasharray="4 4"
                                    fill="#cbd5e1"
                                    fillOpacity={0.1}
                                />
                            )}
                            <Radar
                                name="현재 발달"
                                dataKey="A"
                                stroke="#6366f1"
                                strokeWidth={3}
                                fill="#8b5cf6"
                                fillOpacity={0.4}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                    {DOMAINS_META.map(d => (
                        <div key={d.key} className={cn("flex flex-col items-center gap-1 p-2.5 rounded-2xl border border-transparent transition-all", d.bg)}>
                            <d.icon className={cn("w-3.5 h-3.5", d.color)} />
                            <span className={cn("text-xs font-black", d.color)}>
                                {latest[`score_${d.key}`] || 0}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">{d.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* 2. 성장 추이 (Line Chart) */}
            {historyData.length > 0 && (
                <section className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-50">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">우리 아이 성장 변화</h3>
                            <p className="text-xs text-slate-400 mt-1 font-bold">누적된 체크 결과를 통해 발달 추이를 확인하세요.</p>
                        </div>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                                    dy={10}
                                />
                                <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: 'black', padding: '2px 0' }}
                                    labelStyle={{ fontSize: '12px', fontWeight: 'black', marginBottom: '8px', color: '#1e293b' }}
                                />
                                <Line type="monotone" dataKey="언어" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="사회" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="인지" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="운동" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="적응" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6">
                        {DOMAINS_META.map(d => (
                            <div key={d.key} className="flex items-center gap-1.5">
                                <div className={cn("w-2 h-2 rounded-full", d.color.replace('text-', 'bg-'))} />
                                <span className="text-[10px] font-bold text-slate-500">{d.label}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ✨ Scientific Grounds & Disclaimer */}
            <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 space-y-4">
                <div className="flex items-center gap-2 text-slate-500">
                    <Brain className="w-5 h-5" />
                    <h4 className="text-sm font-black italic">Scientific Basis & Research Summary</h4>
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    본 발달 지표는 K-DST 및 K-ASQ 등의 표준 발달 선별검사 항목을 기반으로 산출되었습니다.
                    전문 치료사가 작성한 정기 평가 데이터를 통해 아이의 성장 과정을 시각화하여 제공합니다.
                </p>
                <div className="h-px bg-slate-200 w-12"></div>
                <p className="text-[11px] text-rose-400 font-extrabold leading-relaxed">
                    ⚠️ 최종 판단은 반드시 전문의 또는 센터 전문가와 상담하시기 바랍니다.
                </p>
            </div>
        </div>
    );
}