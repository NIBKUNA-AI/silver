// @ts-nocheck
/* eslint-disable */
/**
 * 🌿 SILVER CARE - TherapistsPage Complete Redesign (요양보호사 소개)
 */
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { useCenter } from '@/contexts/CenterContext';
import { useCenterBranding } from '@/hooks/useCenterBranding';
import { supabase } from '@/lib/supabase';

export function TherapistsPage() {
    const { getSetting } = useAdminSettings();
    const { center } = useCenter();
    const { theme } = useTheme();
    const { branding, loading: brandingLoading } = useCenterBranding();
    const isDark = theme === 'dark';

    const [caregivers, setCaregivers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (center?.id) {
            fetchCaregivers();
        }
    }, [center?.id]);

    const fetchCaregivers = async () => {
        try {
            const { data, error } = await supabase
                .from('therapists')
                .select('*')
                .eq('center_id', center.id)
                .eq('system_status', 'active')
                .eq('website_visible', true);

            if (error) throw error;
            setCaregivers(data || []);
        } catch (error) {
            console.error('Error fetching caregivers:', error);
        } finally {
            setLoading(false);
        }
    };

    if (brandingLoading || loading) return null;

    const centerName = branding.name || center?.name || '재가요양센터';
    const phone = center?.phone || import.meta.env.VITE_CENTER_PHONE || '1588-0000';
    const basePath = center?.slug ? `/centers/${center.slug}` : '';

    return (
        <div className={cn("min-h-screen", isDark ? "bg-slate-950" : "bg-white")}>
            <Helmet>
                <title>요양보호사 소개 - {centerName}</title>
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
                                Our Caregivers
                            </span>
                            <h1 className={cn(
                                "text-4xl md:text-6xl font-black mb-6 leading-tight",
                                isDark ? "text-white" : "text-slate-900"
                            )}>
                                <span className="text-emerald-600">전문</span> 요양보호사
                            </h1>
                            <p className={cn(
                                "text-lg md:text-xl leading-relaxed",
                                isDark ? "text-slate-400" : "text-slate-600"
                            )}>
                                국가공인 자격을 갖춘 요양보호사가<br />
                                어르신을 가족처럼 정성껏 돌봅니다.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ========================================
                🌿 요양보호사 자격 안내
            ======================================== */}
            <section className={cn(
                "py-16",
                isDark ? "bg-slate-950" : "bg-white"
            )}>
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { icon: "📜", title: "국가자격 보유", desc: "요양보호사 자격증" },
                            { icon: "🩺", title: "건강검진 완료", desc: "정기 건강검진" },
                            { icon: "🔍", title: "신원검증 완료", desc: "범죄경력 조회" },
                            { icon: "📚", title: "정기 교육", desc: "월 1회 보수교육" },
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                className={cn(
                                    "p-6 rounded-2xl text-center",
                                    isDark ? "bg-slate-900" : "bg-emerald-50"
                                )}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <div className="text-3xl mb-3">{item.icon}</div>
                                <h3 className={cn(
                                    "font-bold mb-1",
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
                🌿 CAREGIVERS LIST
            ======================================== */}
            <section className={cn("py-20", isDark ? "bg-slate-900" : "bg-slate-50")}>
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className={cn(
                            "text-3xl font-black",
                            isDark ? "text-white" : "text-slate-900"
                        )}>우리 요양보호사를 소개합니다</h2>
                    </div>

                    {caregivers.length === 0 ? (
                        <div className={cn(
                            "max-w-lg mx-auto p-12 rounded-3xl text-center",
                            isDark ? "bg-slate-800" : "bg-white shadow-lg"
                        )}>
                            <div className="text-6xl mb-6">👩‍⚕️</div>
                            <h3 className={cn(
                                "text-xl font-bold mb-4",
                                isDark ? "text-white" : "text-slate-900"
                            )}>요양보호사 정보 준비 중</h3>
                            <p className={cn(
                                "mb-8",
                                isDark ? "text-slate-400" : "text-slate-600"
                            )}>
                                곧 전문 요양보호사 선생님들을 소개해 드립니다.<br />
                                먼저 상담을 원하시면 연락주세요.
                            </p>
                            <a
                                href={`tel:${phone}`}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold"
                            >
                                📞 {phone}
                            </a>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {caregivers.map((person, idx) => (
                                <motion.div
                                    key={person.id}
                                    className={cn(
                                        "rounded-3xl overflow-hidden",
                                        isDark ? "bg-slate-800" : "bg-white shadow-xl"
                                    )}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    {/* Photo */}
                                    <div className="aspect-[4/3] relative">
                                        {person.profile_image ? (
                                            <img
                                                src={person.profile_image}
                                                alt={person.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className={cn(
                                                "w-full h-full flex items-center justify-center",
                                                isDark ? "bg-slate-700" : "bg-slate-200"
                                            )}>
                                                <span className="text-6xl opacity-50">👤</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className={cn(
                                                "text-xl font-black",
                                                isDark ? "text-white" : "text-slate-900"
                                            )}>{person.name}</h3>
                                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">
                                                {person.system_role === 'admin' ? '센터장' : '요양보호사'}
                                            </span>
                                        </div>

                                        {person.bio && (
                                            <p className={cn(
                                                "text-sm mb-4",
                                                isDark ? "text-slate-400" : "text-slate-600"
                                            )}>{person.bio}</p>
                                        )}

                                        {person.specialties && (
                                            <div className="flex flex-wrap gap-2">
                                                {person.specialties.split(',').map((s, i) => (
                                                    <span
                                                        key={i}
                                                        className={cn(
                                                            "px-3 py-1 rounded-full text-xs font-medium",
                                                            isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700"
                                                        )}
                                                    >{s.trim()}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ========================================
                🌿 CTA
            ======================================== */}
            <section className="py-20 bg-gradient-to-br from-emerald-600 to-emerald-800">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                        어르신께 맞는 요양보호사를 찾아드립니다
                    </h2>
                    <p className="text-emerald-100 text-lg mb-10 max-w-lg mx-auto">
                        어르신의 성향과 필요에 맞는 최적의 요양보호사를 배정해 드립니다.
                    </p>
                    <Link
                        to={`${basePath}/contact`}
                        className="inline-flex items-center gap-2 px-10 py-5 bg-white text-emerald-700 rounded-2xl font-bold text-lg"
                    >
                        상담 신청하기
                    </Link>
                </div>
            </section>
        </div>
    );
}
