// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-10
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 이 파일의 UI/UX 설계 및 데이터 연동 로직은 독자적인 기술과
 * 예술적 영감을 바탕으로 구축되었습니다.
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ConsultationSurveyForm } from '@/components/public/ConsultationSurveyForm';
import { useCenterBranding } from '@/hooks/useCenterBranding';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { useAdminSettings } from '@/hooks/useAdminSettings';

// Custom SVG Icons
const Icons = {
    mapPin: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" />
            <circle cx="12" cy="10" r="3" stroke="currentColor" />
        </svg>
    ),
    clock: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" stroke="currentColor" />
            <path d="M12 6v6l4 2" stroke="currentColor" />
        </svg>
    ),
    calendar: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" />
            <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" />
            <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" />
            <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" />
        </svg>
    ),
};

export function ContactPage() {
    const { branding } = useCenterBranding();
    const { getSetting } = useAdminSettings();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const weekdayHours = getSetting('center_weekday_hours') || branding?.weekday_hours || '09:00 - 19:00';
    const saturdayHours = getSetting('center_saturday_hours') || branding?.saturday_hours || '09:00 - 16:00';
    const holidayText = getSetting('center_holiday_text') || branding?.holiday_text || '매주 일요일 및 공휴일';
    const brandColor = branding?.brand_color || '#6366f1';

    return (
        <div className={cn("min-h-screen transition-colors", isDark ? "bg-[#0a0c10]" : "bg-[#f8fafc]")}>
            <Helmet>
                <title>문의 및 오시는 길 - {branding?.name || '센터'}</title>
                <meta name="description" content="센터 위치 안내, 운영 시간, 상담 예약 문의 방법을 안내해드립니다." />
            </Helmet>

            {/* ✨ Premium Header Section */}
            <section className="relative py-28 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20" style={{ backgroundColor: brandColor }}></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full blur-[100px] opacity-10" style={{ backgroundColor: brandColor }}></div>

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span
                            className="inline-block px-5 py-2 rounded-full text-[10px] font-black tracking-[0.3em] uppercase mb-8 border"
                            style={{ backgroundColor: brandColor + '15', color: brandColor, borderColor: brandColor + '30' }}
                        >
                            Get In Touch
                        </span>
                        <h1 className={cn(
                            "text-4xl md:text-6xl font-black tracking-tighter mb-8 leading-tight",
                            isDark ? "text-white" : "text-slate-900"
                        )}>
                            문의 및 오시는 길
                        </h1>
                        <p className={cn(
                            "mx-auto max-w-2xl text-lg md:text-xl font-medium leading-relaxed opacity-60",
                            isDark ? "text-slate-300" : "text-slate-600"
                        )}>
                            아이의 밝은 내일을 위한 첫 걸음,<br />
                            자라다가 가장 따뜻한 목소리로 답하겠습니다.
                        </p>
                    </motion.div>
                </div>
            </section>

            <section className="container mx-auto px-6 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                    {/* 📍 Info Column (Left) */}
                    <div className="lg:col-span-5 space-y-8">

                        {/* Center Info Card */}
                        <motion.div
                            className={cn(
                                "p-10 rounded-[50px] border shadow-2xl relative overflow-hidden group",
                                isDark ? "bg-[#141620] border-white/5" : "bg-white border-slate-100 shadow-slate-200/50"
                            )}
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                            <h2 className={cn("text-2xl font-black mb-10 flex items-center gap-3", isDark ? "text-white" : "text-slate-900")}>
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10" style={{ color: brandColor }}>
                                    {Icons.mapPin("w-6 h-6")}
                                </div>
                                센터 정보
                            </h2>

                            <div className="space-y-8">
                                {[
                                    { label: '주소', value: branding?.address || '정보를 불러오는 중...', icon: Icons.mapPin },
                                    { label: '전화', value: branding?.phone || '정보를 불러오는 중...', icon: null, large: true },
                                    { label: '이메일', value: branding?.email || '정보를 불러오는 중...', icon: null }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex flex-col gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{item.label}</span>
                                        <span className={cn(
                                            "font-bold leading-relaxed",
                                            item.large ? "text-2xl md:text-3xl tracking-tighter" : "text-lg",
                                            isDark ? "text-white" : "text-slate-900"
                                        )} style={item.large ? { color: brandColor } : {}}>
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Hours Card */}
                        <motion.div
                            className={cn(
                                "p-10 rounded-[50px] border shadow-2xl relative overflow-hidden",
                                isDark ? "bg-[#141620] border-white/5" : "bg-white border-slate-100 shadow-slate-200/50"
                            )}
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className={cn("text-2xl font-black mb-10 flex items-center gap-3", isDark ? "text-white" : "text-slate-900")}>
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10" style={{ color: brandColor }}>
                                    {Icons.clock("w-6 h-6")}
                                </div>
                                운영 시간
                            </h2>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center py-4 border-b border-white/5">
                                    <span className="font-bold opacity-60">평일 (월-금)</span>
                                    <span className="text-xl font-black tracking-tight" style={{ color: brandColor }}>{weekdayHours}</span>
                                </div>
                                <div className="flex justify-between items-center py-4 border-b border-white/5">
                                    <span className="font-bold opacity-60">토요일</span>
                                    <span className="text-xl font-black tracking-tight">{saturdayHours}</span>
                                </div>
                                <div className="flex justify-between items-center py-4">
                                    <span className="font-bold text-rose-500">일요일/공휴일</span>
                                    <span className="font-black text-rose-500">{holidayText}</span>
                                </div>
                            </div>

                            <div
                                className="mt-10 p-5 rounded-[30px] border border-dashed text-xs font-bold leading-relaxed opacity-80"
                                style={{ backgroundColor: brandColor + '05', borderColor: brandColor + '30', color: brandColor }}
                            >
                                * 모든 상담 및 치료는 100% 예약제로 운영됩니다.<br />
                                * 방문 전 반드시 예약 부탁드립니다.
                            </div>
                        </motion.div>
                    </div>

                    {/* 📝 Request Form Column (Right) */}
                    <motion.div
                        className="lg:col-span-7"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className={cn(
                            "p-10 md:p-14 rounded-[60px] border shadow-[0_40px_100px_rgba(0,0,0,0.1)] relative overflow-hidden",
                            isDark ? "bg-[#141620] border-white/5" : "bg-white border-slate-200"
                        )}>
                            {/* Decorative background gradient for form */}
                            <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] opacity-10 pointer-events-none" style={{ backgroundColor: brandColor }}></div>

                            <div className="relative z-10">
                                <h2 className={cn("text-3xl font-black mb-10 tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                                    상담 예약 신청
                                </h2>
                                <p className="mb-12 text-sm font-bold opacity-50 leading-relaxed">
                                    아래 양식을 작성해 주시면 확인 후 전문 치료사가 직접 연락드려<br />
                                    아이에게 가장 필요한 상담 일정을 잡아드리겠습니다.
                                </p>

                                <ConsultationSurveyForm centerId={branding?.id} />
                            </div>
                        </div>
                    </motion.div>

                </div>
            </section>
        </div>
    );
}