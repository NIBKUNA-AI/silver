// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Building2, Plus, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CenterList() {
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">전체 센터 관리</h1>
                    <p className="text-slate-500 font-medium">등록된 모든 지점을 관리합니다.</p>
                </div>
                <Button>
                    <Plus className="w-4 h-4 mr-2" /> 새 센터 등록
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {centers.map((center) => (
                    <div key={center.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
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
                                <span>{center.phone || '전화번호 미등록'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
