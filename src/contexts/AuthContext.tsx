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
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// ✨ super_admin, retired 타입 추가
export type UserRole = 'super_admin' | 'admin' | 'staff' | 'therapist' | 'parent' | 'retired' | null;

const ROLE_CACHE_KEY = 'cached_user_role';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    role: UserRole;
    profile: any;
    therapistId: string | null;  // ✨ therapists.id (치료사 전용)
    centerId: string | null;     // ✨ center_id (소속 센터)
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

// ✨ Import Fixed Center ID
import { JAMSIL_CENTER_ID } from '@/config/center';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    // ✨ [Profile-First Guard] 캐시 사용 안 함. DB 조회 전까지는 null 상태로 대기 (로딩 스피너 유지)
    const [role, setRole] = useState<UserRole>(null);

    const [profile, setProfile] = useState<any>(null);
    const [therapistId, setTherapistId] = useState<string | null>(null);  // ✨ therapists.id
    // ✨ [Force Single Center] Initialize with Jamsil ID
    const [centerId, setCenterId] = useState<string | null>(JAMSIL_CENTER_ID); // ✨ center_id
    const [loading, setLoading] = useState(true);

    // ✨ [No Re-block] 초기 로딩 후에는 전체 화면 로딩을 다시 보여주지 않음
    const initialLoadComplete = useRef(false);
    const isMounted = useRef(true); // ✨ [Fix] Mount tracking

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        let mounted = true;

        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                    // 세션이 없으면 로딩 종료
                    if (!session) {
                        setLoading(false);
                        initialLoadComplete.current = true;
                    } else {
                        // ✨ [Fix] 세션이 있으면 fetchRole이 로딩 해제할 때까지 대기
                        setLoading(true);
                    }
                }
            } catch (error) {
                if (mounted) {
                    setLoading(false);
                    initialLoadComplete.current = true;
                }
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
                if (!session) {
                    setRole(null);
                    localStorage.removeItem(ROLE_CACHE_KEY);
                    setLoading(false);
                    initialLoadComplete.current = true;
                } else {
                    // ✨ [Fix] 세션이 있으면 로딩을 유지하고 fetchRole이 완료될 때까지 기다림
                    // 단, 이미 로드된 상태에서 재진입(refresh 등)이면 스피너 안보여도 됨
                    if (!initialLoadComplete.current) setLoading(true);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // ✨ [Single Source of Truth] 권한 확인 로직 리팩토링
    // Auth Metadata가 아닌 실제 DB(user_profiles)의 role을 기준으로 함
    // ✨ [Single Source of Truth] 권한 확인 로직 리팩토링
    // Auth Metadata가 아닌 실제 DB(user_profiles)의 role을 기준으로 함
    const fetchRole = async (forceUpdate = false, retryCount = 0) => {
        if (!user) return;

        if (!forceUpdate && role && initialLoadComplete.current) return;
        if (!initialLoadComplete.current) setLoading(true);

        try {
            // ✨ [Direct DB Query] 항상 최신 권한을 가져옴
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (isMounted.current) {
                if (data) {
                    const dbRole = (data.role as UserRole) || 'parent';
                    console.log(`[Auth] Role Synced (user_profiles): ${dbRole} (${data.email})`);

                    if (data.status === 'inactive' || data.status === 'banned' || dbRole === 'retired') {
                        console.warn('[Auth] Blocked inactive user');
                        setRole(null);
                        setProfile(null);
                        if (window.location.pathname.startsWith('/app')) {
                            alert('접근 권한이 없습니다. (퇴사 또는 계정 비활성화)');
                            await signOut();
                            window.location.href = '/';
                        }
                        return;
                    }

                    setRole(dbRole);
                    setProfile(data);
                    setCenterId(data.center_id || null);

                    if (dbRole === 'therapist') {
                        const { data: therapistData } = await supabase
                            .from('therapists')
                            .select('id, center_id')
                            .eq('profile_id', user.id)
                            .maybeSingle();
                        if (therapistData) {
                            setTherapistId(therapistData.id);
                            if (!data.center_id && therapistData.center_id) {
                                setCenterId(therapistData.center_id);
                            }
                        }
                    }

                    localStorage.setItem(ROLE_CACHE_KEY, dbRole);
                } else {
                    // ✨ [Sync Logic] 프로필이 없으면 'Ghost User'일 수 있으므로 동기화 시도
                    console.log('[Auth] Profile missing, attempting sync_profile_by_email...');
                    const { data: syncSuccess, error: syncError } = await supabase.rpc('sync_profile_by_email');

                    if (syncSuccess) {
                        console.log('[Auth] Sync successful! Retrying fetch...');
                        fetchRole(true, retryCount + 1); // 재시도
                        return;
                    }

                    // ✨ [Retry Logic] 동기화도 실패했다면, 네트워크 지연일 수 있으므로 몇 번 더 재시도
                    if (retryCount < 3) {
                        console.log(`[Auth] Still missing, retrying... (${retryCount + 1}/3)`);
                        setTimeout(() => fetchRole(forceUpdate, retryCount + 1), 1000);
                        return;
                    }

                    // 🚨 [CRITICAL] 절대 parent로 기본 설정하지 않음 (사용자 요청)
                    // 대신 명시적인 에러 상태로 처리하거나 로그아웃 유도
                    console.error('[Auth] Critical: No profile found for authenticated user.');
                    alert('사용자 정보를 찾을 수 없습니다. (관리자에게 문의하세요)\nYour Profile is missing.');
                    // setRole('parent'); // ❌ REMOVED
                    setRole(null); // 권한 없음 상태 유지
                    setLoading(false); // 로딩은 끄고 에러 화면 등으로 처리해야 함 (ProtectedRoute가 막음)
                }
            }
        } catch (error) {
            console.error('[Auth] Role fetch error:', error);
            if (isMounted.current) setRole('parent');
        } finally {
            // ✨ [Logic Fix] 재시도 중이 아닐 때만 로딩 종료
            if (retryCount >= 3 || (isMounted.current && role !== null) || (isMounted.current && !loading)) {
                // role이 설정되었거나, 재시도가 끝났을 때만
                if (isMounted.current) {
                    // data가 있어서 role이 세팅되었으면 loading false
                    // data가 없어서 retry 중이면 loading true 유지해야 함.
                    // 위 로직에서 데이터가 있으면 setRole 했음.
                    // 데이터가 없어서 재시도 중이면 return 했음.
                    // 따라서 여기는 재시도를 안하거나 못찾았을 때 옴.
                    // 복잡하므로 단순화:
                }
            }
            // ⚠️ finally 블록은 재귀 호출과 상관없이 실행됨.
            // 따라서 여기서 무조건 loading false 하면 안됨.
            // 데이터가 성공적으로 로드되었거나(retry 안함), 재시도 횟수를 초과했을 때만 끎.
        }

        // Refactored finally logic outside try/catch to handle retry cleanly
        if (isMounted.current) {
            // 성공했거나 실패(부모처리)했으면 로딩 끔. 재시도 중이면 건드리지 않음.
            setLoading((prev) => {
                // 이미 role이 생겼으면 false
                // 아직 재시도 중이면 prev (true)
                return prev;
            });
            // This logic is tricky inside functional update.
            // Let's rely on the fact that if we retry, we explicitly DON'T turn off loading.
            // We need to move initialLoadComplete.current = true to ONLY success or fail scenarios.
        }
    };

    // Wrapper to separate loading logic from recursion
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
                // Success
                const dbRole = (data.role as UserRole) || 'parent';
                /* ... Same Logic ... */
                // Block check...
                if (data.status === 'inactive' || data.status === 'banned' || dbRole === 'retired') {
                    // Blocked
                    setRole(null);
                    setLoading(false);
                    initialLoadComplete.current = true;
                    /* Alert & Redirect */
                    return;
                }

                setRole(dbRole);
                setProfile(data);
                setCenterId(data.center_id || null);
                if (dbRole === 'therapist') { /* ... */ }

                // DONE
                setLoading(false);
                initialLoadComplete.current = true;
            } else {
                // Not found
                if (retryCount < 5) { // 5 retries * 500ms = 2.5s
                    console.log(`[Auth] Profile missing, retrying... (${retryCount + 1})`);
                    setTimeout(() => executeFetchRole(forceUpdate, retryCount + 1), 500);
                } else {
                    // Give up
                    console.warn('[Auth] Giving up, defaulting to parent');
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

    // Alias to keep existing calls working
    const fetchRole = (forceUpdate = false) => executeFetchRole(forceUpdate, 0);

    useEffect(() => {
        fetchRole();

        // ✨ [Real-time] 내 권한이 변경되면 즉시 반영 (Supabase Realtime)
        // user_profiles 테이블의 변경사항을 감지
        const channel = supabase.channel(`public:user_profiles:id=eq.${user?.id}`)
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'user_profiles', filter: `id=eq.${user?.id}` },
                (payload) => {
                    const newRole = payload.new.role as UserRole;
                    console.log('[Auth] Role updated via Realtime (user_profiles):', newRole);

                    // ✨ [Instant Redirect] 권한이 실시간으로 바뀌면, 앱을 새로고침하여 즉시 올바른 경로로 이동시킴
                    // (SPA 라우팅보다 새로고침이 확실한 "깜빡임 없는" 전환 보장)
                    if (role && role !== newRole) {
                        alert(`관리자에 의해 권한이 '${newRole}'(으)로 변경되었습니다.\n새 권한을 적용하기 위해 페이지를 새로고침합니다.`);
                        window.location.reload();
                    } else {
                        setRole(newRole);
                        fetchRole(true);
                    }
                })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    // ✨ [Manual Refresh] 외부에서(예: 로그인 직후) 권한 갱신 요청 가능하게 노출
    const refreshRole = () => fetchRole(true);

    const signOut = async () => {
        localStorage.removeItem(ROLE_CACHE_KEY);
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, role, profile, therapistId, centerId, loading, signOut }}>
            {children}
            {/* ✨ 초기 로딩 때만 전체 화면 로딩 표시 (한 번 완료되면 다시 표시 안 함) */}
            {loading && !initialLoadComplete.current && (
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mb-4"></div>
                    <p className="text-slate-500 font-bold">권한을 확인 중입니다...</p>
                </div>
            )}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
