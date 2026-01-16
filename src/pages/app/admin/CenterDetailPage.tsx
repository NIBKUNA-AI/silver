// @ts-nocheck
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Building2, Users, Baby, ArrowLeft, MoreHorizontal } from 'lucide-react';

export function CenterDetailPage() {
    const { centerId } = useParams();
    const navigate = useNavigate();
    const [center, setCenter] = useState<any>(null);
    const [stats, setStats] = useState({ teachers: 0, children: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (centerId) {
            fetchCenterDetails();
        }
    }, [centerId]);

    const fetchCenterDetails = async () => {
        try {
            // 1. Fetch Center Basic Info
            const { data: centerData, error: centerError } = await supabase
                .from('centers')
                .select('*')
                .eq('id', centerId)
                .single();

            if (centerError) throw centerError;

            // 2. Fetch Stats (Teachers & Children)
            // Note: DB schema might verify if 'therapist' role exists in profiles or separate table.
            // Using profiles table for simplicity based on SaaS structure.
            const { count: teacherCount } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true })
                .eq('center_id', centerId)
                .in('role', ['therapist', 'staff']);

            const { count: childCount } = await supabase
                .from('children')
                .select('*', { count: 'exact', head: true })
                .eq('center_id', centerId);

            setCenter(centerData);
            setStats({ teachers: teacherCount || 0, children: childCount || 0 });
        } catch (error) {
            console.error('Error loading center details:', error);
            alert('센터 정보를 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse">상세 정보 로딩 중...</div>;
    if (!center) return <div className="p-8 text-center text-slate-500">센터를 찾을 수 없습니다.</div>;

    return (
        <div className="space-y-8 max-w-5xl mx-auto p-6">
            {/* Header with Navigation */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/centers')}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-slate-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900">{center.name}</h1>
                    <p className="text-slate-500 text-sm">센터 ID: {center.id}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400">등록된 치료사/직원</p>
                        <p className="text-2xl font-black text-slate-900">{stats.teachers}명</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <Baby className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400">등록된 아동</p>
                        <p className="text-2xl font-black text-slate-900">{stats.children}명</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400">운영 상태</p>
                        <p className="text-2xl font-black text-slate-900 capitalize">{center.status || 'Active'}</p>
                    </div>
                </div>
            </div>

            {/* Details Section */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">기본 정보</h2>
                    <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                    <div className="space-y-4">
                        <div>
                            <p className="font-bold text-slate-400 mb-1">지점 주소</p>
                            <p className="font-medium text-slate-900 text-lg">{center.address || '미등록'}</p>
                        </div>
                        <div>
                            <p className="font-bold text-slate-400 mb-1">대표 전화번호</p>
                            <p className="font-medium text-slate-900 text-lg">{center.phone || '미등록'}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="font-bold text-slate-400 mb-1">사업자 등록번호</p>
                            <p className="font-medium text-slate-900 text-lg">{center.business_number || '미등록'}</p>
                        </div>
                        <div>
                            <p className="font-bold text-slate-400 mb-1">관리자 이메일</p>
                            <p className="font-medium text-slate-900 text-lg">{center.email || '미등록'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
