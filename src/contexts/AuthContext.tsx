// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Modified by: Gemini AI (for An Uk-bin)
 * 📅 Date: 2026-01-13
 * 🖋️ Description: "퇴사자 실시간 차단 및 권한 변경 즉시 반영 로직 최적화"
 */
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { JAMSIL_CENTER_ID } from '@/config/center';

// ✨ UserRole 타입 유지 (retired 포함)
export type UserRole = 'super_admin' | 'admin' | 'staff' | 'therapist' | 'parent' | 'retired' | null;

const ROLE_CACHE_KEY = 'cached_user_role';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    role: UserRole;
    profile: any;
    therapistId: string | null;
    centerId: string | null;
    loading: boolean;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    role: null,
    profile: null,
    therapistId: null,
    centerId: null,
    loading: true,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [profile, setProfile] = useState<any>(null);
    const [therapistId, setTherapistId] = useState<string | null>(null);
    const [centerId, setCenterId] = useState<string | null>(JAMSIL_CENTER_ID);
    const [loading, setLoading] = useState(true);

    const initialLoadComplete = useRef(false);
    const isMounted = useRef(true);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    // 1. 세션 초기화 및 상태 감시
    useEffect(() => {
        let mounted = true;
        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                    if (!session) {
                        setLoading(false);
                        initialLoadComplete.current = true;
                    }
                }
            } catch (error) {
                if (mounted) setLoading(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
                if (!session) {
                    setRole(null);
                    setLoading(false);
                    initialLoadComplete.current = true;
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // 2. [핵심] DB 기반 권한 및 상태 체크 (퇴사자 차단 포함)
    const executeFetchRole = async (forceUpdate = false, retryCount = 0) => {
        if (!user) return;
        if (!forceUpdate && role && initialLoadComplete.current) return;
        if (!initialLoadComplete.current) setLoading(true);

        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (data) {
                const dbRole = (data.role as UserRole) || 'parent';

                // 🚨 [보안] 퇴사자 및 비활성 계정 즉시 차단
                if (data.status === 'retired' || data.status === 'inactive' || dbRole === 'retired') {
                    console.warn('[Auth] Access Blocked: Retired User');
                    setRole(null);
                    setProfile(null);
                    alert('접근 권한이 없습니다. (퇴사 또는 계정 비활성화)\n관리자에게 문의하세요.');
                    await signOut();
                    window.location.href = '/';
                    return;
                }

                setRole(dbRole);
                setProfile(data);
                setCenterId(data.center_id || JAMSIL_CENTER_ID);

                // 치료사 전용 ID 세팅
                if (dbRole === 'therapist') {
                    const { data: therapistData } = await supabase
                        .from('therapists')
                        .select('id')
                        .eq('email', user.email)
                        .maybeSingle();
                    if (therapistData) setTherapistId(therapistData.id);
                }

                setLoading(false);
                initialLoadComplete.current = true;
            } else {
                // 프로필 없을 시 재시도 (최대 5회)
                if (retryCount < 5) {
                    setTimeout(() => executeFetchRole(forceUpdate, retryCount + 1), 500);
                } else {
                    setRole('parent');
                    setLoading(false);
                    initialLoadComplete.current = true;
                }
            }
        } catch (e) {
            setRole('parent');
            setLoading(false);
            initialLoadComplete.current = true;
        }
    };

    const fetchRole = (forceUpdate = false) => executeFetchRole(forceUpdate, 0);

    useEffect(() => {
        if (user) {
            fetchRole();

            // ✨ [Real-time] 관리자가 DB에서 권한을 바꾸면 즉시 감지하여 튕겨내거나 새로고침
            const channel = supabase.channel(`profile_changes_${user.id}`)
                .on('postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'user_profiles', filter: `id=eq.${user.id}` },
                    (payload) => {
                        const newRole = payload.new.role;
                        const newStatus = payload.new.status;

                        // 퇴사 처리되었을 경우 즉시 튕겨냄
                        if (newStatus === 'retired' || newRole === 'retired') {
                            alert('권한이 회수되었습니다. 로그아웃됩니다.');
                            window.location.reload();
                            return;
                        }

                        // 역할이 변경되었을 경우 새로고침하여 메뉴 반영
                        if (role && role !== newRole) {
                            alert(`권한이 '${newRole}'(으)로 변경되었습니다. 시스템을 재시작합니다.`);
                            window.location.reload();
                        }
                    }
                )
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [user?.id, role]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setRole(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ session, user, role, profile, therapistId, centerId, loading, signOut }}>
            {children}
            {/* 초기 로딩 화면 */}
            {loading && !initialLoadComplete.current && (
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mb-4"></div>
                    <p className="text-slate-500 font-bold">센터 보안 확인 중...</p>
                </div>
            )}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);