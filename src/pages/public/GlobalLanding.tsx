import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext'; // ✨ Import
import { Search, ArrowRight, LayoutGrid, Lock, MapPin, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/hooks/useClickOutside';

export const GlobalLanding = () => {
    const navigate = useNavigate();
    const { role } = useAuth(); // ✨ Get Role
    const [keyword, setKeyword] = useState('');
    const [centers, setCenters] = useState<{ id: string, name: string, slug: string, address: string }[]>([]);
    const [filteredCenters, setFilteredCenters] = useState<{ id: string, name: string, slug: string, address: string }[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // ✨ [Hook] Close dropdown on outside click
    useClickOutside(dropdownRef, () => {
        setIsDropdownOpen(false);
    });

    // ✨ [Data] Fetch All Active Centers
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
            } catch (err: any) {
                console.error("❌ Failed to fetch centers:", err.message);
                setFetchError("센터 정보를 불러오지 못했습니다.");
            } finally {
                setIsInitialLoading(false);
            }
        };
        fetchCenters();
    }, []);

    // ✨ [Search] Filter Logic
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

    const handleSelect = (center: any) => {
        // ✨ [Simplicity] Choice -> Action
        // 👑 Super Admin Fast-Track: If already logged in, go straight to dashboard
        if (role === 'super_admin' || localStorage.getItem('zarada_user_role') === 'super_admin') {
            // Set slug manually just in case CenterContext needs a head start
            localStorage.setItem('zarada_center_slug', center.slug);
            navigate(`/app/dashboard`);
        } else {
            // Standard: Navigate to center homepage with login query param
            navigate(`/centers/${center.slug}?login=true`);
        }
    };

    const handleEnter = (e: React.FormEvent) => {
        e.preventDefault();
        if (filteredCenters.length > 0) {
            handleSelect(filteredCenters[0]);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="w-full px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-slate-100 fixed top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                        <LayoutGrid size={20} />
                    </div>
                    <span className="text-xl font-black text-slate-800 tracking-tight">Zarada</span>
                </div>
            </header>

            {/* Hero & Search */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 pt-20 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl mix-blend-multiply animate-blob" />
                <div className="absolute top-1/3 -right-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000" />

                <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
                    <div className="space-y-4">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black tracking-wide border border-indigo-100 uppercase">
                            Premium SaaS for Child Development
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                            아동발달센터의 모든 것,<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">자라다</span>로 연결합니다.
                        </h1>
                        <p className="text-lg text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
                            우리 아이가 다니는 센터를 검색하여 빠르고 간편하게 입장하세요.
                        </p>
                    </div>

                    {/* ✨ Combobox / Dropdown UI */}
                    <div className="relative max-w-xl mx-auto group" ref={dropdownRef}>
                        <div
                            className={cn(
                                "flex items-center bg-white p-2 rounded-[32px] border-2 transition-all duration-300",
                                isDropdownOpen
                                    ? "border-indigo-600 shadow-2xl ring-8 ring-indigo-50"
                                    : "border-slate-100 shadow-xl shadow-slate-200/50 hover:border-slate-200"
                            )}
                        >
                            <form onSubmit={handleEnter} className="flex-1 flex items-center min-w-0">
                                <div className="pl-6 text-slate-400">
                                    <Search className="w-6 h-6" />
                                </div>
                                <input
                                    type="text"
                                    value={keyword}
                                    onChange={(e) => {
                                        setKeyword(e.target.value);
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    className="w-full bg-transparent border-none outline-none px-4 py-4 text-slate-900 font-black placeholder-slate-300 text-xl"
                                    placeholder="어느 센터를 방문하시겠어요?"
                                    autoFocus
                                />
                            </form>
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="p-4 mr-1 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                <ChevronDown className={cn("w-6 h-6 transition-transform duration-300", isDropdownOpen && "rotate-180")} />
                            </button>
                        </div>

                        {fetchError && <p className="mt-4 text-sm font-bold text-rose-500">{fetchError}</p>}

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="max-h-[400px] overflow-y-auto p-4 space-y-2">
                                    {isInitialLoading ? (
                                        <div className="p-8 text-center text-slate-400 font-bold animate-pulse">정보를 불러오는 중...</div>
                                    ) : filteredCenters.length > 0 ? (
                                        filteredCenters.map(center => (
                                            <button
                                                key={center.id}
                                                type="button"
                                                onClick={() => handleSelect(center)}
                                                className="w-full p-6 text-left rounded-[28px] hover:bg-slate-50 transition-all group flex items-center justify-between active:scale-[0.98]"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                        <MapPin size={24} />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{center.name}</div>
                                                        <div className="text-sm text-slate-400 font-medium">{center.address || '대한민국'}</div>
                                                    </div>
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-slate-300 transform -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center text-slate-400 font-bold">검색 결과가 없습니다.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <footer className="py-8 text-center text-xs font-bold text-slate-400 border-t border-slate-100 bg-white/50">
                <p>© 2026 Zarada ERP. All rights reserved.</p>
                <div className="flex justify-center gap-4 mt-2">
                    <Link to="/policy/privacy" className="hover:text-slate-600">개인정보처리방침</Link>
                    <Link to="/policy/terms" className="hover:text-slate-600">이용약관</Link>
                    <span className="text-slate-300">|</span>
                    <Link to="/login" className="hover:text-slate-600">관리자 로그인</Link>
                </div>
            </footer>
        </div>
    );
};

