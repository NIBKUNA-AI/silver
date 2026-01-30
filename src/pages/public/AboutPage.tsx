// @ts-nocheck
/* eslint-disable */
/**
 * 🌿 SILVER CARE - AboutPage Complete Redesign
 */
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { useCenter } from '@/contexts/CenterContext';
import { useCenterBranding } from '@/hooks/useCenterBranding';

export function AboutPage() {
    const { getSetting } = useAdminSettings();
    const { center } = useCenter();
    const { theme } = useTheme();
    const { branding, loading } = useCenterBranding();
    const isDark = theme === 'dark';

    if (loading) return null;

    const centerName = branding.name || center?.name || '재가요양센터';
    const phone = center?.phone || import.meta.env.VITE_CENTER_PHONE || '1588-0000';
    const basePath = center?.slug ? `/centers/${center.slug}` : '';

    return (
        <div className={cn("min-h-screen", isDark ? "bg-slate-950" : "bg-white")}>
            <Helmet>
                <title>센터 소개 - {centerName}</title>
            </Helmet>

            {/* ========================================
                🌿 HERO SECTION - 심플 텍스트
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
                                About Us
                            </span>
                            <h1 className={cn(
                                "text-4xl md:text-6xl font-black mb-6 leading-tight",
                                isDark ? "text-white" : "text-slate-900"
                            )}>
                                어르신의 행복이<br />
                                <span className="text-emerald-600">우리의 행복</span>입니다
                            </h1>
                            <p className={cn(
                                "text-lg md:text-xl leading-relaxed",
                                isDark ? "text-slate-400" : "text-slate-600"
                            )}>
                                {centerName}는 어르신 한 분 한 분을 가족처럼 모시며,<br />
                                건강하고 행복한 노후 생활을 함께 합니다.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ========================================
                🌿 MISSION & VISION - 2컬럼
            ======================================== */}
            <section className={cn("py-20", isDark ? "bg-slate-950" : "bg-white")}>
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Mission */}
                        <motion.div
                            className={cn(
                                "p-10 rounded-3xl",
                                isDark ? "bg-slate-900" : "bg-slate-50"
                            )}
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl mb-6">
                                🎯
                            </div>
                            <h2 className={cn(
                                "text-2xl font-black mb-4",
                                isDark ? "text-white" : "text-slate-900"
                            )}>우리의 미션</h2>
                            <p className={cn(
                                "text-lg leading-relaxed",
                                isDark ? "text-slate-400" : "text-slate-600"
                            )}>
                                모든 어르신이 가정에서 존엄하게 노후를 보낼 수 있도록,
                                전문적이고 따뜻한 돌봄 서비스를 제공합니다.
                            </p>
                        </motion.div>

                        {/* Vision */}
                        <motion.div
                            className={cn(
                                "p-10 rounded-3xl",
                                isDark ? "bg-slate-900" : "bg-slate-50"
                            )}
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl mb-6">
                                ✨
                            </div>
                            <h2 className={cn(
                                "text-2xl font-black mb-4",
                                isDark ? "text-white" : "text-slate-900"
                            )}>우리의 비전</h2>
                            <p className={cn(
                                "text-lg leading-relaxed",
                                isDark ? "text-slate-400" : "text-slate-600"
                            )}>
                                대한민국 No.1 재가요양 서비스로서,
                                어르신과 가족 모두가 신뢰하고 만족하는 돌봄 문화를 선도합니다.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ========================================
                🌿 핵심 가치 - 아이콘 그리드
            ======================================== */}
            <section className={cn(
                "py-20",
                isDark ? "bg-slate-900" : "bg-emerald-50"
            )}>
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-emerald-600 font-bold text-sm tracking-widest uppercase mb-4 block">
                            Core Values
                        </span>
                        <h2 className={cn(
                            "text-3xl md:text-4xl font-black",
                            isDark ? "text-white" : "text-slate-900"
                        )}>핵심 가치</h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { icon: "❤️", title: "사랑", desc: "가족을 대하듯 진심으로" },
                            { icon: "🤝", title: "신뢰", desc: "투명하고 정직한 서비스" },
                            { icon: "⭐", title: "전문성", desc: "체계적인 교육과 관리" },
                            { icon: "🌱", title: "성장", desc: "끊임없는 서비스 개선" },
                        ].map((value, idx) => (
                            <motion.div
                                key={idx}
                                className={cn(
                                    "p-8 rounded-3xl text-center",
                                    isDark ? "bg-slate-800" : "bg-white shadow-lg"
                                )}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <div className="text-4xl mb-4">{value.icon}</div>
                                <h3 className={cn(
                                    "text-xl font-black mb-2",
                                    isDark ? "text-white" : "text-slate-900"
                                )}>{value.title}</h3>
                                <p className={cn(
                                    "text-sm",
                                    isDark ? "text-slate-400" : "text-slate-600"
                                )}>{value.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================
                🌿 센터 특장점 - 리스트
            ======================================== */}
            <section className={cn("py-20", isDark ? "bg-slate-950" : "bg-white")}>
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <span className="text-emerald-600 font-bold text-sm tracking-widest uppercase mb-4 block">
                                Why {centerName}
                            </span>
                            <h2 className={cn(
                                "text-3xl md:text-4xl font-black mb-8",
                                isDark ? "text-white" : "text-slate-900"
                            )}>
                                {centerName}의 차별점
                            </h2>

                            <ul className="space-y-6">
                                {[
                                    "장기요양기관 지정 센터",
                                    "배상책임보험 가입으로 안심 케어",
                                    "국가공인 요양보호사 자격 보유",
                                    "정기적인 요양보호사 교육 실시",
                                    "보호자 주간/월간 케어 리포트 제공",
                                    "24시간 비상 연락망 운영",
                                ].map((item, idx) => (
                                    <motion.li
                                        key={idx}
                                        className="flex items-center gap-4"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className={cn(
                                            "text-lg font-medium",
                                            isDark ? "text-slate-300" : "text-slate-700"
                                        )}>{item}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div
                            className="relative"
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <img
                                src="https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=800"
                                alt="케어 서비스"
                                className="rounded-3xl shadow-2xl"
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ========================================
                🌿 CTA SECTION
            ======================================== */}
            <section className={cn(
                "py-20",
                isDark ? "bg-emerald-900" : "bg-emerald-600"
            )}>
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                        지금 무료 상담을 받아보세요
                    </h2>
                    <p className="text-emerald-100 text-lg mb-10 max-w-lg mx-auto">
                        어르신의 상황에 맞는 최적의 케어 방법을 안내해 드립니다.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href={`tel:${phone}`}
                            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-emerald-700 rounded-2xl font-bold text-lg"
                        >
                            📞 {phone}
                        </a>
                        <Link
                            to={`${basePath}/contact`}
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg hover:bg-emerald-400 transition"
                        >
                            온라인 상담 신청
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
