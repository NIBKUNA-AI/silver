// @ts-nocheck
/* eslint-disable */
/**
 * 🌿 SILVER CARE - ProgramsPage Complete Redesign
 */
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { useCenter } from '@/contexts/CenterContext';
import { useCenterBranding } from '@/hooks/useCenterBranding';

export function ProgramsPage() {
    const { getSetting } = useAdminSettings();
    const { center } = useCenter();
    const { theme } = useTheme();
    const { branding, loading } = useCenterBranding();
    const isDark = theme === 'dark';

    if (loading) return null;

    const centerName = branding.name || center?.name || '재가요양센터';
    const phone = center?.phone || import.meta.env.VITE_CENTER_PHONE || '1588-0000';
    const basePath = center?.slug ? `/centers/${center.slug}` : '';

    const services = [
        {
            icon: "🧑‍🤝‍🧑",
            title: "신체활동 지원",
            subtitle: "일상생활 기본 동작 지원",
            features: ["식사 도움", "세면/목욕 도움", "배설 도움", "옷 갈아입기", "체위 변경", "이동 도움"],
            color: "bg-blue-500",
            lightBg: "bg-blue-50"
        },
        {
            icon: "🏠",
            title: "가사활동 지원",
            subtitle: "쾌적한 생활환경 조성",
            features: ["청소 및 정리정돈", "세탁 및 다림질", "식사 준비", "장보기 대행", "생활필수품 구매"],
            color: "bg-orange-500",
            lightBg: "bg-orange-50"
        },
        {
            icon: "💊",
            title: "건강관리 지원",
            subtitle: "체계적인 건강 모니터링",
            features: ["혈압/혈당 측정", "투약 관리 및 확인", "병원 동행", "건강상태 기록", "응급상황 대처"],
            color: "bg-red-500",
            lightBg: "bg-red-50"
        },
        {
            icon: "🧠",
            title: "인지활동 지원",
            subtitle: "두뇌 건강 유지",
            features: ["말벗 서비스", "인지자극 활동", "회상요법", "간단한 게임/퍼즐", "독서 지원"],
            color: "bg-purple-500",
            lightBg: "bg-purple-50"
        },
        {
            icon: "💚",
            title: "정서활동 지원",
            subtitle: "마음 건강 케어",
            features: ["정서적 대화", "기분 전환 활동", "취미활동 지원", "가족 연락 지원", "외출 동행"],
            color: "bg-emerald-500",
            lightBg: "bg-emerald-50"
        },
        {
            icon: "📋",
            title: "행정업무 지원",
            subtitle: "복잡한 행정 대행",
            features: ["등급 신청 대행", "서류 작성 지원", "보험 청구 안내", "복지 서비스 연계"],
            color: "bg-slate-500",
            lightBg: "bg-slate-50"
        },
    ];

    return (
        <div className={cn("min-h-screen", isDark ? "bg-slate-950" : "bg-white")}>
            <Helmet>
                <title>케어 서비스 - {centerName}</title>
            </Helmet>

            {/* ========================================
                🌿 HERO
            ======================================== */}
            <section className={cn(
                "pt-32 pb-20",
                isDark ? "bg-slate-900" : "bg-gradient-to-b from-emerald-50 to-white"
            )}>
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <span className="text-emerald-600 font-bold text-sm tracking-widest uppercase mb-4 block">
                                Our Services
                            </span>
                            <h1 className={cn(
                                "text-4xl md:text-6xl font-black mb-6 leading-tight",
                                isDark ? "text-white" : "text-slate-900"
                            )}>
                                <span className="text-emerald-600">맞춤형</span> 케어 서비스
                            </h1>
                            <p className={cn(
                                "text-lg md:text-xl leading-relaxed",
                                isDark ? "text-slate-400" : "text-slate-600"
                            )}>
                                어르신의 상황과 필요에 맞는<br />
                                다양한 재가요양 서비스를 제공합니다.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ========================================
                🌿 SERVICES GRID
            ======================================== */}
            <section className={cn("py-20", isDark ? "bg-slate-950" : "bg-white")}>
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {services.map((service, idx) => (
                            <motion.div
                                key={idx}
                                className={cn(
                                    "rounded-3xl overflow-hidden border",
                                    isDark
                                        ? "bg-slate-900 border-slate-800"
                                        : "bg-white border-slate-200 shadow-lg hover:shadow-xl transition-shadow"
                                )}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                {/* Header */}
                                <div className={cn(
                                    "p-6",
                                    isDark ? "bg-slate-800" : service.lightBg
                                )}>
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl",
                                            isDark ? "bg-slate-700" : "bg-white shadow-md"
                                        )}>
                                            {service.icon}
                                        </div>
                                        <div>
                                            <h3 className={cn(
                                                "text-xl font-black",
                                                isDark ? "text-white" : "text-slate-900"
                                            )}>{service.title}</h3>
                                            <p className={cn(
                                                "text-sm",
                                                isDark ? "text-slate-400" : "text-slate-600"
                                            )}>{service.subtitle}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="p-6">
                                    <ul className="space-y-3">
                                        {service.features.map((feature, fidx) => (
                                            <li key={fidx} className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                                                    service.color
                                                )}>
                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <span className={cn(
                                                    "text-sm",
                                                    isDark ? "text-slate-300" : "text-slate-700"
                                                )}>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================
                🌿 장기요양보험 안내
            ======================================== */}
            <section className={cn(
                "py-20",
                isDark ? "bg-slate-900" : "bg-slate-50"
            )}>
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <span className="text-emerald-600 font-bold text-sm tracking-widest uppercase mb-4 block">
                                Long-term Care Insurance
                            </span>
                            <h2 className={cn(
                                "text-3xl md:text-4xl font-black",
                                isDark ? "text-white" : "text-slate-900"
                            )}>장기요양보험 이용 안내</h2>
                        </div>

                        <div className={cn(
                            "p-8 md:p-12 rounded-3xl",
                            isDark ? "bg-slate-800" : "bg-white shadow-xl"
                        )}>
                            <div className="grid md:grid-cols-3 gap-8 text-center">
                                <div>
                                    <div className="text-4xl font-black text-emerald-600 mb-2">1~5등급</div>
                                    <p className={cn(
                                        "text-sm",
                                        isDark ? "text-slate-400" : "text-slate-600"
                                    )}>장기요양등급 대상</p>
                                </div>
                                <div>
                                    <div className="text-4xl font-black text-emerald-600 mb-2">본인부담 15%</div>
                                    <p className={cn(
                                        "text-sm",
                                        isDark ? "text-slate-400" : "text-slate-600"
                                    )}>일반 수급자 기준</p>
                                </div>
                                <div>
                                    <div className="text-4xl font-black text-emerald-600 mb-2">무료 신청대행</div>
                                    <p className={cn(
                                        "text-sm",
                                        isDark ? "text-slate-400" : "text-slate-600"
                                    )}>등급 신청 도움</p>
                                </div>
                            </div>

                            <div className={cn(
                                "mt-10 pt-8 border-t text-center",
                                isDark ? "border-slate-700" : "border-slate-200"
                            )}>
                                <p className={cn(
                                    "text-lg mb-6",
                                    isDark ? "text-slate-300" : "text-slate-700"
                                )}>
                                    장기요양등급이 없으신가요? 저희가 신청을 도와드립니다.
                                </p>
                                <a
                                    href={`tel:${phone}`}
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition"
                                >
                                    📞 {phone}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================
                🌿 CTA
            ======================================== */}
            <section className="py-20 bg-gradient-to-br from-emerald-600 to-emerald-800">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                        어떤 서비스가 필요하신가요?
                    </h2>
                    <p className="text-emerald-100 text-lg mb-10 max-w-lg mx-auto">
                        전문 상담사가 어르신 상황에 맞는 최적의 서비스를 안내해 드립니다.
                    </p>
                    <Link
                        to={`${basePath}/contact`}
                        className="inline-flex items-center gap-2 px-10 py-5 bg-white text-emerald-700 rounded-2xl font-bold text-lg"
                    >
                        무료 상담 신청하기
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </section>
        </div>
    );
}
