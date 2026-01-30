// @ts-nocheck
/* eslint-disable */
/**
 * 🌿 SILVER CARE - ContactPage Complete Redesign
 */
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { useCenter } from '@/contexts/CenterContext';
import { useCenterBranding } from '@/hooks/useCenterBranding';
import { ConsultationSurveyForm } from '@/components/public/ConsultationSurveyForm';

export function ContactPage() {
    const { getSetting } = useAdminSettings();
    const { center } = useCenter();
    const { theme } = useTheme();
    const { branding, loading } = useCenterBranding();
    const isDark = theme === 'dark';

    if (loading) return null;

    const centerName = branding.name || center?.name || '재가요양센터';
    const phone = center?.phone || import.meta.env.VITE_CENTER_PHONE || '1588-0000';
    const address = center?.address || getSetting('center_address') || '';
    const basePath = center?.slug ? `/centers/${center.slug}` : '';

    return (
        <div className={cn("min-h-screen", isDark ? "bg-slate-950" : "bg-white")}>
            <Helmet>
                <title>상담 문의 - {centerName}</title>
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
                                Contact Us
                            </span>
                            <h1 className={cn(
                                "text-4xl md:text-6xl font-black mb-6 leading-tight",
                                isDark ? "text-white" : "text-slate-900"
                            )}>
                                <span className="text-emerald-600">무료</span> 상담 신청
                            </h1>
                            <p className={cn(
                                "text-lg md:text-xl leading-relaxed",
                                isDark ? "text-slate-400" : "text-slate-600"
                            )}>
                                어르신의 상황에 맞는 최적의 케어 방법을<br />
                                전문 상담사가 안내해 드립니다.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ========================================
                🌿 CONTACT INFO + FORM
            ======================================== */}
            <section className={cn("py-20", isDark ? "bg-slate-950" : "bg-white")}>
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-5 gap-12">
                        {/* Left: Contact Info */}
                        <div className="lg:col-span-2">
                            <div className="sticky top-32 space-y-8">
                                {/* Phone */}
                                <motion.div
                                    className={cn(
                                        "p-8 rounded-3xl",
                                        isDark ? "bg-slate-900" : "bg-emerald-50"
                                    )}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <div className="text-3xl mb-4">📞</div>
                                    <h3 className={cn(
                                        "text-lg font-bold mb-2",
                                        isDark ? "text-white" : "text-slate-900"
                                    )}>전화 상담</h3>
                                    <a
                                        href={`tel:${phone}`}
                                        className="text-2xl font-black text-emerald-600 hover:underline"
                                    >
                                        {phone}
                                    </a>
                                    <p className={cn(
                                        "text-sm mt-2",
                                        isDark ? "text-slate-400" : "text-slate-600"
                                    )}>
                                        평일 09:00 - 18:00
                                    </p>
                                </motion.div>

                                {/* Address */}
                                {address && (
                                    <motion.div
                                        className={cn(
                                            "p-8 rounded-3xl",
                                            isDark ? "bg-slate-900" : "bg-slate-50"
                                        )}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <div className="text-3xl mb-4">📍</div>
                                        <h3 className={cn(
                                            "text-lg font-bold mb-2",
                                            isDark ? "text-white" : "text-slate-900"
                                        )}>센터 위치</h3>
                                        <p className={cn(
                                            "text-lg",
                                            isDark ? "text-slate-300" : "text-slate-700"
                                        )}>
                                            {address}
                                        </p>
                                    </motion.div>
                                )}

                                {/* Quick Info */}
                                <motion.div
                                    className={cn(
                                        "p-8 rounded-3xl",
                                        isDark ? "bg-slate-900" : "bg-amber-50"
                                    )}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <div className="text-3xl mb-4">💡</div>
                                    <h3 className={cn(
                                        "text-lg font-bold mb-4",
                                        isDark ? "text-white" : "text-slate-900"
                                    )}>상담 전 준비사항</h3>
                                    <ul className={cn(
                                        "space-y-2 text-sm",
                                        isDark ? "text-slate-400" : "text-slate-600"
                                    )}>
                                        <li>• 어르신의 연령 및 건강상태</li>
                                        <li>• 현재 진단받은 질병 유무</li>
                                        <li>• 장기요양등급 보유 여부</li>
                                        <li>• 원하시는 서비스 종류</li>
                                        <li>• 서비스 희망 시간대</li>
                                    </ul>
                                </motion.div>
                            </div>
                        </div>

                        {/* Right: Form */}
                        <div className="lg:col-span-3">
                            <motion.div
                                className={cn(
                                    "p-8 md:p-12 rounded-3xl",
                                    isDark ? "bg-slate-900" : "bg-white border border-slate-200 shadow-xl"
                                )}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <h2 className={cn(
                                    "text-2xl font-black mb-2",
                                    isDark ? "text-white" : "text-slate-900"
                                )}>온라인 상담 신청</h2>
                                <p className={cn(
                                    "mb-8",
                                    isDark ? "text-slate-400" : "text-slate-600"
                                )}>
                                    아래 양식을 작성해 주시면 상담사가 연락드립니다.
                                </p>

                                <ConsultationSurveyForm centerId={branding?.id} />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================
                🌿 FAQ
            ======================================== */}
            <section className={cn(
                "py-20",
                isDark ? "bg-slate-900" : "bg-slate-50"
            )}>
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className={cn(
                                "text-3xl font-black",
                                isDark ? "text-white" : "text-slate-900"
                            )}>자주 묻는 질문</h2>
                        </div>

                        <div className="space-y-4">
                            {[
                                {
                                    q: "장기요양등급이 없어도 서비스 이용이 가능한가요?",
                                    a: "네, 등급 신청 과정부터 저희가 무료로 도와드립니다. 등급 신청에 필요한 서류 준비와 절차를 안내해 드립니다."
                                },
                                {
                                    q: "서비스 비용은 얼마인가요?",
                                    a: "장기요양등급자의 경우 본인부담금은 약 15% 수준입니다. 기초생활수급자는 본인부담금이 면제됩니다. 자세한 비용은 상담 시 안내해 드립니다."
                                },
                                {
                                    q: "요양보호사를 바꿀 수 있나요?",
                                    a: "네, 어르신과의 케미가 맞지 않거나 불편한 점이 있으시면 언제든 말씀해 주세요. 새로운 요양보호사로 교체해 드립니다."
                                },
                                {
                                    q: "서비스 시작까지 얼마나 걸리나요?",
                                    a: "등급이 있으신 경우 상담 후 바로 서비스 시작이 가능합니다. 등급 신청이 필요한 경우 1~2개월 정도 소요될 수 있습니다."
                                },
                            ].map((item, idx) => (
                                <motion.details
                                    key={idx}
                                    className={cn(
                                        "p-6 rounded-2xl group",
                                        isDark ? "bg-slate-800" : "bg-white shadow-md"
                                    )}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <summary className={cn(
                                        "font-bold cursor-pointer list-none flex justify-between items-center",
                                        isDark ? "text-white" : "text-slate-900"
                                    )}>
                                        {item.q}
                                        <span className="text-emerald-600">+</span>
                                    </summary>
                                    <p className={cn(
                                        "mt-4 text-sm leading-relaxed",
                                        isDark ? "text-slate-400" : "text-slate-600"
                                    )}>
                                        {item.a}
                                    </p>
                                </motion.details>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}