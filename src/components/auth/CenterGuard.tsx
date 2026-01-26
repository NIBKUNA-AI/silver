import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCenter } from '@/contexts/CenterContext';
import { useAuth } from '@/contexts/AuthContext'; // ✨ Added missing import
import { Loader2 } from 'lucide-react';

interface CenterGuardProps {
    children?: React.ReactNode;
}

export const CenterGuard: React.FC<CenterGuardProps> = ({ children }) => {
    const { center, loading } = useCenter(); // ✨ 다시 추가
    const { role, loading: authLoading } = useAuth();
    const location = useLocation();

    // ✨ [SaaS Logic] Bypass center selection for Super Admins or Admin Management paths
    const isAdminPath = location.pathname.startsWith('/app/admin');
    const isSuperAdmin = role === 'super_admin';

    // 1. 센터 정보 로딩 중이거나 권한 확인 중일 때 로더 표시
    if (loading || authLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50/50 backdrop-blur-sm">
                <div className="text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-600" />
                    <p className="mt-4 text-sm font-black text-slate-500">지점 구성 정보를 동기화하고 있습니다...</p>
                </div>
            </div>
        );
    }

    // 2. 권한 유효성 검사 및 리다이렉트
    // 센터가 선택되지 않았고, 관리자 경로도 아니며, 슈퍼 어드민도 아닐 때만 리다이렉트
    if (!center && !isAdminPath && !isSuperAdmin) {
        // 현재 경로가 이미 루트(/)이면 무한 루프 방지를 위해 중단
        if (location.pathname === '/' || location.pathname === '') return <Outlet />;

        console.log("🛡️ [CenterGuard] No center selected, redirecting to portal...");
        return <Navigate to="/" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};
