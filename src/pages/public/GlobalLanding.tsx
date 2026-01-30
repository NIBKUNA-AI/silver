import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Search, ArrowRight, MapPin, ChevronDown, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/hooks/useClickOutside';
import { motion, AnimatePresence } from 'framer-motion';

interface Center {
    id: string;
    name: string;
    slug: string;
    address: string;
}

export const GlobalLanding = () => {
    const navigate = useNavigate();
    const { role } = useAuth();
    const [keyword, setKeyword] = useState('');
    const [centers, setCenters] = useState<Center[]>([]);
    const [filteredCenters, setFilteredCenters] = useState<Center[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useClickOutside(dropdownRef, () => {
        setIsDropdownOpen(false);
    });

    useEffect(() => {
        const fetchCenters = async () => {
            setIsInitialLoading(true);
            try {
                const { data, error } = await supabase
                    .from('centers')
                    .select('id, name, slug, address')
                    .eq('is_active', true)
                    .order('name');

                if (error) throw error;
                if (data) {
                    setCenters(data);
                    setFilteredCenters(data);
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                console.error("❌ Failed to fetch centers:", message);
                setFetchError("센터 정보를 불러오지 못했습니다.");
            } finally {
                setIsInitialLoading(false);
            }
        };
        fetchCenters();
    }, []);

    useEffect(() => {
        if (!keyword.trim()) {
            setFilteredCenters(centers);
        } else {
            const lowerKeyword = keyword.toLowerCase();
            setFilteredCenters(centers.filter(c =>
                c.name.toLowerCase().includes(lowerKeyword) ||
                c.slug.toLowerCase().includes(lowerKeyword) ||
                (c.address && c.address.toLowerCase().includes(lowerKeyword))
            ));
        }
    }, [keyword, centers]);

    const handleSelect = (center: Center) => {
        localStorage.setItem('zarada_center_slug', center.slug);
        if (role === 'super_admin' || localStorage.getItem('zarada_user_role') === 'super_admin') {
            navigate(`/app/dashboard`);
        } else {
            navigate(`/centers/${center.slug}?login=true`);
        }
        setIsDropdownOpen(false);
    };

    const handleEnter = (e: React.FormEvent) => {
        e.preventDefault();
        // 검색 버튼 누를 시 리스트만 보여주고 자동 이동은 막음 (사용자가 직접 선택 유도)
        if (!isDropdownOpen) setIsDropdownOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#FDF8F3] flex flex-col font-sans overflow-x-hidden text-slate-900">
            {/* ✨ Premium Minimalist Header */}
            <header
                className={cn(
                    "w-full px-8 md:px-16 py-6 flex justify-between items-center fixed top-0 z-[100] transition-all duration-500",
                    isScrolled
                        ? "bg-white/80 backdrop-blur-2xl py-4 shadow-[0_4px_30px_rgba(0,0,0,0.03)] border-b border-slate-100"
                        : "bg-transparent py-8"
                )}
            >
                <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="w-12 h-12 rounded-[18px] overflow-hidden shadow-lg transition-transform group-hover:scale-110 duration-500">
                        <img src="/logo.png" className="w-full h-full object-cover scale-110" alt="Logo" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-slate-900">
                        SilverTree
                    </span>
                </div>
                <div className="flex items-center gap-10">
                    <a
                        href="https://zarada.co.kr/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-[#6B8E6B] text-white rounded-full text-sm font-black shadow-lg shadow-[#6B8E6B]/20 hover:scale-105 transition-all"
                    >
                        도입 문의하기
                    </a>
                </div>
            </header>

            {/* 🚀 New Grand Hero: Split Layout */}
            <main className="flex-1">
                <section className="relative pt-40 pb-20 md:pt-60 md:pb-40 px-8 md:px-20 max-w-[1600px] mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

                        {/* Left Content (Text & Search) */}
                        <div className="lg:col-span-7 space-y-12">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                className="space-y-6"
                            >
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6B8E6B]/10 border border-[#6B8E6B]/20 text-[#6B8E6B] text-[10px] font-black tracking-widest uppercase">
                                    <Heart className="w-3 h-3 animate-pulse" /> Always with Humanity
                                </div>
                                <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.95] text-slate-900">
                                    실버 케어의<br />
                                    <span className="text-[#6B8E6B]">자연스러운</span> 동행.
                                </h1>
                                <p className="text-xl md:text-2xl text-slate-500 font-medium max-w-xl leading-relaxed">
                                    사랑하는 부모님이 계신 곳을 찾으세요.<br />
                                    데이터와 마음이 만나는 실버트리만의 특별한 케어 솔루션.
                                </p>
                            </motion.div>

                            {/* Search refined */}
                            <div className="relative w-full max-w-2xl" ref={dropdownRef}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.8 }}
                                    className={cn(
                                        "bg-white rounded-[32px] p-2 pr-2 md:p-3 md:pr-3 shadow-[0_20px_60px_rgba(107,142,107,0.1)] flex items-center border border-slate-100 transition-all duration-500",
                                        isDropdownOpen ? "ring-8 ring-[#6B8E6B]/5 border-[#6B8E6B]/20" : "hover:border-slate-200"
                                    )}
                                >
                                    <form onSubmit={handleEnter} className="flex-1 flex items-center pl-5">
                                        <Search className="w-6 h-6 text-[#6B8E6B]/50" />
                                        <input
                                            type="text"
                                            value={keyword}
                                            onChange={(e) => {
                                                setKeyword(e.target.value);
                                                if (!isDropdownOpen) setIsDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsDropdownOpen(true)}
                                            className="w-full bg-transparent border-none outline-none px-4 py-4 text-xl font-bold text-slate-800 placeholder-slate-300"
                                            placeholder="센터 이름을 검색해보세요"
                                        />
                                    </form>
                                    <button
                                        type="button"
                                        onClick={handleEnter}
                                        className="bg-[#6B8E6B] text-white px-8 py-4 rounded-[24px] font-black text-sm flex items-center gap-2 hover:bg-[#5A7A5A] transition-all shadow-lg active:scale-95"
                                    >
                                        검색 <ArrowRight className="w-4 h-4" />
                                    </button>
                                </motion.div>

                                {/* Results Dropdown */}
                                <AnimatePresence>
                                    {isDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full left-4 right-4 bg-white mt-4 rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-slate-100 p-4 z-50 overflow-hidden"
                                        >
                                            <div className="max-h-[400px] overflow-y-auto px-2 custom-scrollbar space-y-1">
                                                {isInitialLoading ? (
                                                    <div className="py-20 flex flex-col items-center gap-6">
                                                        <div className="w-10 h-10 border-4 border-slate-50 border-t-[#6B8E6B] rounded-full animate-spin" />
                                                        <p className="text-slate-400 font-bold">센터를 불러오고 있습니다...</p>
                                                    </div>
                                                ) : filteredCenters.length > 0 ? (
                                                    filteredCenters.map(center => (
                                                        <button
                                                            key={center.id}
                                                            onClick={() => handleSelect(center)}
                                                            className="w-full p-5 text-left rounded-[24px] hover:bg-[#6B8E6B]/5 transition-all flex items-center justify-between group"
                                                        >
                                                            <div className="flex items-center gap-5">
                                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-[#6B8E6B] group-hover:text-white transition-all shadow-sm border border-slate-50">
                                                                    <MapPin size={22} />
                                                                </div>
                                                                <div>
                                                                    <div className="font-black text-slate-900 text-lg group-hover:text-[#6B8E6B] transition-colors">{center.name}</div>
                                                                    <p className="text-slate-400 text-xs font-bold mt-1 line-clamp-1">{center.address || '재가요양 / 데이케어'}</p>
                                                                </div>
                                                            </div>
                                                            <ArrowRight className="w-5 h-5 text-slate-200 group-hover:text-[#6B8E6B] transition-all" />
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="py-20 text-center text-slate-400 font-bold">검색 결과가 없습니다.</div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Trust Badges */}
                            <div className="flex items-center gap-10 pt-8 border-t border-slate-100">
                                <div className="space-y-1">
                                    <div className="text-2xl font-black text-slate-900">500+</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Centers</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-2xl font-black text-slate-900">98%</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Satisfaction</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-2xl font-black text-slate-900">Global</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expansion</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Content (Floating Hero Image) */}
                        <div className="lg:col-span-5 relative">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1, delay: 0.2 }}
                                className="relative z-10 aspect-[4/5] rounded-[60px] md:rounded-[120px] overflow-hidden shadow-[0_50px_100px_rgba(107,142,107,0.15)] border-8 border-white group"
                            >
                                <img src="/hero-bg.png" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Serene Care Environment" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#6B8E6B]/30 to-transparent" />
                            </motion.div>

                            {/* Floating Decorative UI Card */}
                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="absolute -bottom-10 -left-10 z-20 bg-white/90 backdrop-blur-xl p-6 rounded-[40px] shadow-2xl border border-white/50 space-y-4 max-w-[280px]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-slate-900">Security First</div>
                                        <div className="text-[10px] font-bold text-slate-400">Personal Data Protected</div>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 2 }}
                                        className="h-full bg-[#6B8E6B]"
                                    />
                                </div>
                                <p className="text-[11px] font-medium text-slate-500 leading-relaxed">센터의 모든 정보는 실시간 암호화되어 관리됩니다.</p>
                            </motion.div>
                        </div>

                    </div>
                </section>

                {/* Section 2: Core Values */}
                <section className="py-32 bg-white">
                    <div className="max-w-[1200px] mx-auto px-8">
                        <div className="text-center space-y-4 mb-20">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight">우리가 제안하는 <span className="text-[#6B8E6B]">가치</span></h2>
                            <p className="text-slate-400 font-bold max-w-xl mx-auto italic">실버트리는 단순한 프로그램을 넘어, 가족의 평온한 일상을 고민합니다.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {[
                                { title: "투명한 소통", desc: "센터의 돌봄 기록을 보호자가 모바일로 실시간 확인합니다.", icon: "💬", color: "bg-blue-50 text-blue-500" },
                                { title: "데이터 분석", desc: "어르신의 건강 상태와 활동량을 과학적으로 시각화합니다.", icon: "📊", color: "bg-[#6B8E6B]/10 text-[#6B8E6B]" },
                                { title: "스마트 관리", desc: "복잡한 서류 업무를 자동화하여 케어의 질을 높입니다.", icon: "⚡", color: "bg-amber-50 text-amber-500" }
                            ].map((val, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -10 }}
                                    className="p-10 rounded-[48px] bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-500 space-y-6"
                                >
                                    <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center text-2xl shadow-sm", val.color)}>
                                        {val.icon}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900">{val.title}</h3>
                                    <p className="text-slate-400 font-medium leading-relaxed">{val.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* 🏗️ Modern Footer */}
            <footer className="py-24 px-8 bg-[#1B1D25] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#6B8E6B]/5 rounded-full blur-[120px] -mr-64 -mt-64" />
                <div className="max-w-[1400px] mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-16 pb-16 border-b border-white/5">
                        <div className="md:col-span-5 space-y-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white shadow-xl">
                                    <img src="/logo.png" className="w-full h-full object-cover" alt="Logo" />
                                </div>
                                <span className="text-3xl font-black tracking-tighter">SilverTree</span>
                            </div>
                            <p className="text-lg text-slate-400 font-bold leading-relaxed max-w-sm">
                                부모님의 평온한 삶을 데이터로 증명하는<br />
                                차세대 실버 케어 솔루션 SilverTree입니다.
                            </p>
                            <div className="flex gap-4">
                                {['Naver', 'Facebook', 'Instagram'].map(sns => (
                                    <div key={sns} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 hover:bg-white hover:text-black transition-all cursor-pointer">
                                        {sns[0]}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-10 gap-12 md:pl-16 md:border-l md:border-white/5">
                            <div className="sm:col-span-5 space-y-6">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#6B8E6B]">Office</h4>
                                <ul className="space-y-4 text-[13px] text-slate-400 font-bold leading-relaxed">
                                    <li className="grid grid-cols-[60px,1fr] gap-2">
                                        <span className="text-slate-500">본사</span>
                                        <span className="break-keep">경기도 성남시 수정구 청계산로4길 17, 4F</span>
                                    </li>
                                    <li className="grid grid-cols-[60px,1fr] gap-2">
                                        <span className="text-slate-500">연구소</span>
                                        <span className="break-keep">서울 송파구 석촌호수로12길 51 201호</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="sm:col-span-2 space-y-6">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#6B8E6B]">Corp No.</h4>
                                <p className="text-[13px] text-slate-400 font-bold tracking-wider">188 - 87 - 02240</p>
                            </div>
                            <div className="sm:col-span-3 space-y-6">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#6B8E6B]">Contact</h4>
                                <div className="space-y-4 text-[13px] text-slate-400 font-bold">
                                    <div className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-3">
                                        <div className="flex gap-2">
                                            <span className="text-slate-500 w-4">T.</span>
                                            <span className="whitespace-nowrap">02-2039-1167</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-slate-500 w-4">F.</span>
                                            <span className="whitespace-nowrap">070-7547-1177</span>
                                        </div>
                                    </div>
                                    <div className="text-[#6B8E6B] font-black pt-1 hover:text-[#8AAD8A] transition-colors cursor-pointer">office@zarada.co.kr</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-xs font-black text-slate-600 tracking-tight italic">
                            © Zarada Co., Ltd. All Rights Reserved.
                        </p>
                        <div className="flex items-center gap-8">
                            <Link to="/policy/privacy" className="text-[10px] font-black text-slate-600 hover:text-white transition-colors uppercase tracking-widest">Privacy Policy</Link>
                            <Link to="/policy/terms" className="text-[10px] font-black text-slate-600 hover:text-white transition-colors uppercase tracking-widest">Terms of Service</Link>
                            <Link to="/login" className="text-[10px] font-black text-slate-400/30 hover:text-[#6B8E6B] transition-colors uppercase tracking-widest ml-4">Admin Login</Link>
                        </div>
                    </div>
                </div>
            </footer>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6B8E6B; }
            `}} />
        </div>
    );
};
