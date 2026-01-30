// @ts-nocheck
/* eslint-disable */
/**
 * ?åø SILVER CARE - Complete Redesign
 * ?¨Í??îÏñë?ºÌÑ∞ ?ÑÏö© ?àÌéò?¥Ï? - ?ÑÏ†Ñ ?†Í∑ú ?àÏù¥?ÑÏõÉ
 */
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { useCenter } from '@/contexts/CenterContext';

export function HomePage() {
    const { getSetting, loading } = useAdminSettings();
    const { theme } = useTheme();
    const { center } = useCenter();
    const isDark = theme === 'dark';

    const brandName = center?.name || getSetting('center_name') || "?¨Í??îÏñë?ºÌÑ∞";
    const phone = center?.phone || import.meta.env.VITE_CENTER_PHONE || '1588-0000';
    const basePath = center?.slug ? `/centers/${center.slug}` : '';

    if (loading) return <div className="min-h-screen flex items-center justify-center" />;

    return (
        <div className={cn("min-h-screen", isDark ? "bg-slate-950 text-white" : "bg-white text-slate-900")}>
            <Helmet>
                <title>{brandName} - ?¥Î•¥?†Ïùò ?âÎ≥µ???ºÏÉÅ???®Íªò?©Îãà??/title>
            </Helmet>

            {/* ========================================
                ?åø SECTION 1: HERO - ?Ä?§ÌÅ¨Î¶??àÏñ¥Î°?
            ======================================== */}
            <section className="relative min-h-[90vh] flex items-center">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=2000"
                        alt="?¥Î•¥???åÎ¥Ñ"
                        className="w-full h-full object-cover"
                    />
                    <div className={cn(
                        "absolute inset-0",
                        isDark ? "bg-slate-950/80" : "bg-gradient-to-r from-white/95 via-white/80 to-transparent"
                    )} />
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            {/* Badge */}
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 text-brand-700 text-sm font-bold mb-6">
                                <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                                ?•Í∏∞?îÏñëÍ∏∞Í? ÏßÄ???ºÌÑ∞
                            </span>

                            {/* Main Title */}
                            <h1 className={cn(
                                "text-4xl md:text-6xl font-black leading-tight mb-6",
                                isDark ? "text-white" : "text-slate-900"
                            )}>
                                {getSetting('home_title') || "Î∂ÄÎ™®Îãò??Í±¥Í∞ï???ºÏÉÅ??n?®Íªò ÏßÄÏºúÎìúÎ¶ΩÎãà??}
                            </h1>

                            <p className={cn(
                                "text-lg md:text-xl mb-10 leading-relaxed",
                                isDark ? "text-slate-300" : "text-slate-600"
                            )}>
                                {getSetting('home_subtitle') || "Íµ??Í≥µÏù∏ ?îÏñëÎ≥¥Ìò∏?¨Í? ÏßÅÏ†ë Í∞Ä?ïÏùÑ Î∞©Î¨∏?òÏó¨\n?¥Î•¥?†Ïùò ?†Ï≤¥?úÎèôÍ≥??ºÏÉÅ?ùÌôú???ïÏÑ±Íª??åÎ¥Ö?àÎã§."}
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <a
                                    href={`tel:${phone}`}
                                    className="inline-flex items-center justify-center gap-3 px-8 py-5 bg-brand-600 text-white rounded-2xl font-bold text-lg hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/30"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {phone}
                                </a>
                                <Link
                                    to={`${basePath}/contact`}
                                    className={cn(
                                        "inline-flex items-center justify-center gap-2 px-8 py-5 rounded-2xl font-bold text-lg border-2 transition-all",
                                        isDark
                                            ? "border-white/30 text-white hover:bg-white/10"
                                            : "border-slate-300 text-slate-700 hover:bg-slate-50"
                                    )}
                                >
                                    Î¨¥Î£å ?ÅÎã¥ ?†Ï≤≠
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ========================================
                ?åø SECTION 2: ?†Î¢∞ Î∞∞Ï? - ?òÌèâ ?§Ìä∏Î¶?
            ======================================== */}
            <section className={cn(
                "py-8 border-y",
                isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"
            )}>
                <div className="container mx-auto px-6">
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
                        {[
                            { icon: "?èõÔ∏?, label: "?•Í∏∞?îÏñëÍ∏∞Í? ÏßÄ?? },
                            { icon: "?ìã", label: "Î∞∞ÏÉÅÏ±ÖÏûÑÎ≥¥Ìóò Í∞Ä?? },
                            { icon: "?ë©?ç‚öïÔ∏?, label: "?ÑÎ¨∏ ?îÏñëÎ≥¥Ìò∏?? },
                            { icon: "??, label: "365??ÏºÄ??Í∞Ä?? },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <span className="text-2xl">{item.icon}</span>
                                <span className={cn(
                                    "font-bold",
                                    isDark ? "text-slate-300" : "text-slate-700"
                                )}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================
                ?åø SECTION 3: ?úÎπÑ???åÍ∞ú - Í∑∏Î¶¨??Ïπ¥Îìú
            ======================================== */}
            <section className={cn("py-24", isDark ? "bg-slate-950" : "bg-white")}>
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-brand-600 font-bold text-sm tracking-widest uppercase mb-4 block">
                            Our Services
                        </span>
                        <h2 className={cn(
                            "text-3xl md:text-5xl font-black",
                            isDark ? "text-white" : "text-slate-900"
                        )}>
                            ÎßûÏ∂§??ÏºÄ???úÎπÑ??
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: "?ßë?çü§ù‚Äçüß?,
                                title: "?†Ï≤¥?úÎèô ÏßÄ??,
                                desc: "?ùÏÇ¨, ?∏Î©¥, Î∞∞ÏÑ§, ?¥Îèô ???ºÏÉÅ?ùÌôú Í∏∞Î≥∏ ?ôÏûë???ÑÏ??úÎ¶Ω?àÎã§.",
                                color: "bg-blue-50 text-blue-600"
                            },
                            {
                                icon: "?è†",
                                title: "Í∞Ä?¨Ìôú??ÏßÄ??,
                                desc: "Ï≤?Üå, ?∏ÌÉÅ, ?ùÏÇ¨ Ï§ÄÎπ???ÏæåÏ†Å???ùÌôú?òÍ≤Ω??ÎßåÎì§?¥ÎìúÎ¶ΩÎãà??",
                                color: "bg-orange-50 text-orange-600"
                            },
                            {
                                icon: "?íä",
                                title: "Í±¥Í∞ïÍ¥ÄÎ¶?ÏßÄ??,
                                desc: "?àÏïï/?àÎãπ Ï≤¥ÌÅ¨, ?¨ÏïΩ Í¥ÄÎ¶? Î≥ëÏõê ?ôÌñâ ?úÎπÑ?§Î? ?úÍ≥µ?©Îãà??",
                                color: "bg-red-50 text-red-600"
                            },
                            {
                                icon: "?íö",
                                title: "?ïÏÑú?úÎèô ÏßÄ??,
                                desc: "ÎßêÎ≤ó ?úÎπÑ?§Ï? ?∏Ï∂ú ?ôÌñâ?ºÎ°ú ?ïÏÑú???àÏ†ï???ÑÎ™®?©Îãà??",
                                color: "bg-brand-50 text-brand-600"
                            },
                        ].map((service, idx) => (
                            <motion.div
                                key={idx}
                                className={cn(
                                    "p-8 rounded-3xl border group hover:shadow-xl transition-all duration-300",
                                    isDark
                                        ? "bg-slate-900 border-slate-800 hover:border-brand-500/50"
                                        : "bg-white border-slate-200 hover:border-brand-500/50"
                                )}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6",
                                    isDark ? "bg-slate-800" : service.color.split(' ')[0]
                                )}>
                                    {service.icon}
                                </div>
                                <h3 className={cn(
                                    "text-xl font-black mb-3",
                                    isDark ? "text-white" : "text-slate-900"
                                )}>{service.title}</h3>
                                <p className={cn(
                                    "text-sm leading-relaxed",
                                    isDark ? "text-slate-400" : "text-slate-600"
                                )}>{service.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Link
                            to={`${basePath}/programs`}
                            className="inline-flex items-center gap-2 text-brand-600 font-bold hover:underline"
                        >
                            Î™®Îì† ?úÎπÑ??Î≥¥Í∏∞
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ========================================
                ?åø SECTION 4: ?¥Ïö© ?àÏ∞® - ?Ä?ÑÎùº??
            ======================================== */}
            <section className={cn(
                "py-24",
                isDark ? "bg-slate-900" : "bg-brand-50"
            )}>
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-brand-600 font-bold text-sm tracking-widest uppercase mb-4 block">
                            Process
                        </span>
                        <h2 className={cn(
                            "text-3xl md:text-5xl font-black",
                            isDark ? "text-white" : "text-slate-900"
                        )}>
                            ?úÎπÑ???¥Ïö© ?àÏ∞®
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { step: "01", title: "?ÑÌôî ?ÅÎã¥", desc: "Î¨∏Ïùò ?ÑÌôîÎ°??¥Î•¥???ÅÌô© ?åÏïÖ" },
                            { step: "02", title: "Î∞©Î¨∏ ?ÅÎã¥", desc: "?ÑÎ¨∏ ?ÅÎã¥?¨Í? ÏßÅÏ†ë Î∞©Î¨∏ ?ÅÎã¥" },
                            { step: "03", title: "?±Í∏â ?†Ï≤≠", desc: "?•Í∏∞?îÏñë?±Í∏â ?†Ï≤≠ ?Ä??ÏßÄ?? },
                            { step: "04", title: "?úÎπÑ???úÏûë", desc: "ÎßûÏ∂§ ?îÏñëÎ≥¥Ìò∏??Î∞∞Ï†ï ???úÎπÑ?? },
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                className="text-center relative"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.15 }}
                            >
                                {/* Connector Line */}
                                {idx < 3 && (
                                    <div className="hidden md:block absolute top-8 left-[60%] w-full h-0.5 bg-brand-300" />
                                )}

                                <div className={cn(
                                    "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-black relative z-10",
                                    isDark
                                        ? "bg-brand-600 text-white"
                                        : "bg-brand-600 text-white"
                                )}>
                                    {item.step}
                                </div>
                                <h3 className={cn(
                                    "text-lg font-black mb-2",
                                    isDark ? "text-white" : "text-slate-900"
                                )}>{item.title}</h3>
                                <p className={cn(
                                    "text-sm",
                                    isDark ? "text-slate-400" : "text-slate-600"
                                )}>{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================
                ?åø SECTION 5: ???Ä?¨Ïù∏Í∞Ä - ?πÏû•??
            ======================================== */}
            <section className={cn("py-24", isDark ? "bg-slate-950" : "bg-white")}>
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-brand-600 font-bold text-sm tracking-widest uppercase mb-4 block">
                                Why Choose Us
                            </span>
                            <h2 className={cn(
                                "text-3xl md:text-5xl font-black mb-8",
                                isDark ? "text-white" : "text-slate-900"
                            )}>
                                {getSetting('home_story_title') || `${brandName}Î•?n?†ÌÉù?¥Ïïº ?òÎäî ?¥Ïú†`}
                            </h2>
                            <p className={cn("text-lg mb-8 leading-relaxed", isDark ? "text-slate-400" : "text-slate-600")}>
                                {getSetting('home_story_body')}
                            </p>

                            <div className="space-y-6">
                                {[
                                    { title: "Íµ??Í≥µÏù∏ ?ÑÎ¨∏ ?∏Î†•", desc: "?îÏñëÎ≥¥Ìò∏???êÍ≤©Ï¶ùÏùÑ Î≥¥Ïú†???ÑÎ¨∏ ?∏Î†•Îß?Î∞∞Ï†ï?©Îãà??" },
                                    { title: "1:1 ÎßûÏ∂§ ÏºÄ?¥Ìîå??, desc: "?¥Î•¥?†Ïùò Í±¥Í∞ï ?ÅÌÉú?Ä ?ÑÏöî??ÎßûÏ∂ò Í∞úÏù∏Î≥?ÏºÄ?¥Ìîå?úÏùÑ ?òÎ¶Ω?©Îãà??" },
                                    { title: "?ïÍ∏∞ Î™®Îãà?∞ÎßÅ", desc: "Ï£?1??Î≥¥Ìò∏???ºÎìúÎ∞±Í≥º ?îÍ∞Ñ ÏºÄ??Î¶¨Ìè¨?∏Î? ?úÍ≥µ?©Îãà??" },
                                    { title: "24?úÍ∞Ñ Í∏¥Í∏â ?∞ÎùΩÎß?, desc: "?ëÍ∏â ?ÅÌô© Î∞úÏÉù ??Ï¶âÍ∞Å ?Ä?ëÌï† ???àÎäî ÎπÑÏÉÅ ?∞ÎùΩÎßùÏùÑ ?¥ÏòÅ?©Îãà??" },
                                ].map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        className="flex gap-4"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center shrink-0 mt-1">
                                            <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className={cn(
                                                "font-bold text-lg mb-1",
                                                isDark ? "text-white" : "text-slate-900"
                                            )}>{item.title}</h4>
                                            <p className={cn(
                                                "text-sm",
                                                isDark ? "text-slate-400" : "text-slate-600"
                                            )}>{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <img
                                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800"
                                alt="?ÑÎ¨∏ ÏºÄ???úÎπÑ??
                                className="rounded-3xl shadow-2xl"
                            />
                            {/* Floating Stats Card */}
                            <div className={cn(
                                "absolute -bottom-8 -left-8 p-6 rounded-2xl shadow-xl",
                                isDark ? "bg-slate-800" : "bg-white"
                            )}>
                                <div className="text-4xl font-black text-brand-600 mb-1">10+</div>
                                <div className={cn(
                                    "text-sm font-bold",
                                    isDark ? "text-slate-400" : "text-slate-600"
                                )}>??Í≤ΩÎ†• ?ÑÎ¨∏?Ä</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================
                ?åø SECTION 6: ÏµúÏ¢Ö CTA
            ======================================== */}
            <section className="py-24 bg-gradient-to-br from-brand-600 to-brand-800">
                <div className="container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
                            ÏßÄÍ∏?Î∞îÎ°ú ?ÅÎã¥Î∞õÏúº?∏Ïöî
                        </h2>
                        <p className="text-brand-100 text-lg mb-10 max-w-xl mx-auto">
                            ?¥Î•¥?†Ïùò Í±¥Í∞ï???ºÏÉÅ???ÑÌïú Ï≤?Í±∏Ïùå,<br />
                            Î¨¥Î£å ?ÅÎã¥?ºÎ°ú ?úÏûë?¥Î≥¥?∏Ïöî.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href={`tel:${phone}`}
                                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-brand-700 rounded-2xl font-bold text-xl hover:bg-brand-50 transition-all shadow-xl"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {phone}
                            </a>
                            <Link
                                to={`${basePath}/contact`}
                                className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-brand-500 text-white rounded-2xl font-bold text-xl hover:bg-brand-400 transition-all"
                            >
                                ?®Îùº???ÅÎã¥ ?†Ï≤≠
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
