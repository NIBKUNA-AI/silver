import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCenter } from '@/contexts/CenterContext';
import { useAuth } from '@/contexts/AuthContext'; // ✨ Added missing import
import { Loader2 } from 'lucide-react';

interface CenterGuardProps {
    children?: React.ReactNode;
}

export const CenterGuard: React.FC<CenterGuardProps> = ({ children }) => {
    const { center, loading } = useCenter();
    const { role } = useAuth(); // ✨ Check user role
    const location = useLocation();

    // ✨ [SaaS Logic] Bypass center selection for Super Admins or Admin Management paths
    const isAdminPath = location.pathname.startsWith('/app/admin');
    const isSuperAdmin = role === 'super_admin';

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
                    <p className="mt-4 text-sm text-gray-500">센터 정보를 불러오는 중입니다...</p>
                </div>
            </div>
        );
    }

    // Allow if a center is selected OR if it's a super admin/admin management path
    if (!center && !isAdminPath && !isSuperAdmin) {
        // If we're already at root, don't redirect (infinite loop protection)
        if (location.pathname === '/') return <Outlet />;

        // Redirect to Global Landing (Center Selector)
        return <Navigate to="/" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};
