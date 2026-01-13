// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Building2, Plus, MapPin, Phone } from 'lucide-react';


export function CenterList() {
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCenters();
    }, []);

    const fetchCenters = async () => {
        try {
            const { data, error } = await supabase
                .from('centers')
                .select('*')
                .order('name');

            if (error) throw error;
            setCenters(data || []);
        } catch (error) {
            console.error('Error fetching centers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCenter = async () => {
        const name = window.prompt('새로운 센터 이름을 입력해주세요 (예: 서초점)');
        if (!name) return;

        const slug = Math.random().toString(36).substring(2, 10); // Simple slug for now

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('centers')
                .insert({
                    name: `자라다 아동심리발달센터 ${name}`,
                    slug: `zarada-${slug}`,
                    status: 'active'
                })
                .select()
                .single();

            if (error) throw error;

            alert('새로운 센터가 등록되었습니다!');
            fetchCenters(); // Refresh list
        } catch (error) {
            console.error('Create Error:', error);
            alert('센터 등록 실패: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">전체 센터 관리</h1>
                    <p className="text-slate-500 font-medium">등록된 모든 지점을 관리합니다.</p>
                </div>
                <button
                    onClick={handleCreateCenter}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 py-2"
                >
                    <Plus className="w-4 h-4 mr-2" /> 새 센터 등록
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {centers.map((center) => (
                    <div
                        key={center.id}
                        onClick={() => navigate(`/admin/centers/${center.id}`)}
                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">
                                {center.id.slice(0, 8)}...
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{center.name}</h3>
                        <div className="space-y-2 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <span className="line-clamp-1">{center.address || '주소 미등록'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span className="line-clamp-1">{center.phone || '전화번호 미등록'}</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                            <span className="text-sm font-bold text-indigo-600 group-hover:underline flex items-center">
                                상세 관리 <span className="ml-1">→</span>
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
