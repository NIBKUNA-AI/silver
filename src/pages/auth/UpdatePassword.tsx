
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeProvider';
import { Helmet } from 'react-helmet-async';

export function UpdatePassword() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Ensure session exists
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                alert('유효하지 않은 접근입니다. 다시 로그인 링크를 클릭해주세요.');
                navigate('/login');
            }
        });
    }, [navigate]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            alert('비밀번호가 성공적으로 설정되었습니다. 환영합니다!');

            // 🔥 [Fix] 강제 로그아웃 대신 즉시 대시보드로 이동
            // AuthContext가 알아서 상태를 업데이트하고 AppHomeRedirect가 길을 안내합니다.
            navigate('/app');
        } catch (err: any) {
            setError(err.message || '비밀번호 변경 실패');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Helmet><title>새 비밀번호 설정 - Zarada</title></Helmet>
            <div className={cn("min-h-screen flex items-center justify-center px-4 transition-colors", isDark ? "bg-slate-950" : "bg-slate-50")}>
                <div className={cn("w-full max-w-md p-8 rounded-[32px] shadow-lg border", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100")}>
                    <div className="text-center mb-8">
                        <h2 className={cn("text-2xl font-black mb-2", isDark ? "text-white" : "text-slate-900")}>새 비밀번호 설정</h2>
                        <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>새로운 비밀번호를 입력해주세요.</p>
                    </div>

                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div>
                            <label className={cn("block text-xs font-bold ml-1 mb-1", isDark ? "text-slate-500" : "text-slate-400")}>새 비밀번호</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={cn("w-full px-4 py-3 rounded-2xl border font-bold text-sm outline-none transition-all",
                                    isDark ? "bg-slate-800 border-slate-700 text-white focus:ring-2 ring-indigo-500/50" : "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-2 ring-indigo-500/20")}
                                placeholder="8자 이상 입력"
                                minLength={8}
                            />
                        </div>

                        {error && <div className="p-4 bg-red-50 text-red-500 text-sm font-bold rounded-xl border border-red-100">{error}</div>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
                        >
                            {loading ? '변경 중...' : '비밀번호 변경하기'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
