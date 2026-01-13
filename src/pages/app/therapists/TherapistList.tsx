// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-12
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    Plus, Search, Phone, Mail, Edit2, Trash2, X, Check,
    Shield, Stethoscope, UserCog, UserCheck, AlertCircle, UserMinus, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isSuperAdmin, SUPER_ADMIN_EMAIL } from '@/config/superAdmin';
import { Helmet } from 'react-helmet-async';

const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
    '#64748b', '#71717a'
];

export function TherapistList() {
    const { user } = useAuth();
    const [staffs, setStaffs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        email: '',
        hire_type: 'freelancer',
        system_role: 'therapist',
        remarks: '',
        color: '#3b82f6'
    });

    useEffect(() => { fetchStaffs(); }, []);

    const fetchStaffs = async () => {
        setLoading(true);
        try {
            // 1. 기존 치료사 목록 가져오기
            const { data: therapistData } = await supabase.from('therapists').select('*').order('created_at', { ascending: false });

            // 2. [수정] 선생님의 테이블명인 'user_profiles'에서 권한 및 상태 정보 가져오기
            const { data: profileData } = await supabase.from('user_profiles').select('id, role, email, status, name');

            const mergedData = therapistData?.map(t => {
                const profile = profileData?.find(p => p.id === t.id || p.email === t.email);
                let effectiveRole = profile?.role || 'therapist';

                if (profile?.status === 'inactive' || profile?.status === 'retired' || profile?.status === 'rejected') {
                    effectiveRole = 'retired';
                }

                return {
                    ...t,
                    system_role: effectiveRole,
                    // 프로필이 있으면 실제 상태(active, pending 등) 사용
                    system_status: profile ? profile.status : 'invited'
                };
            });

            setStaffs(mergedData || []);
        } catch (error) {
            console.error("데이터 로딩 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    // ✨ 승인 로직 (기존 RPC 함수 사용)
    const handleApprove = async (staff) => {
        if (!confirm(`${staff.name}님을 치료사로 승인하시겠습니까?`)) return;

        try {
            // 1. 실제 가입된 프로필 확인 (선생님 테이블명 user_profiles로 수정)
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('id, email')
                .eq('email', staff.email)
                .maybeSingle();

            if (!profile) {
                alert('⚠️ 승인 불가: 해당 이메일로 가입된 계정이 없습니다.\n사용자가 먼저 회원가입을 완료해야 합니다.');
                return;
            }

            // 2. 일반적인 승인 처리 (DB에 이미 정의된 RPC 호출)
            const { data: rpcData, error: rpcError } = await supabase
                .rpc('approve_therapist', {
                    target_user_id: profile.id
                });

            if (rpcError) throw rpcError;

            // 3. therapists 테이블 정보 동기화 (색상 업데이트 등)
            await supabase.from('therapists').update({
                id: profile.id, // ID 일치화
                color: '#3b82f6'
            }).eq('email', staff.email);

            alert('✅ 승인이 완료되었습니다!');
            fetchStaffs();

        } catch (error) {
            console.error('Approval error:', error);
            alert(`❌ 승인 오류 발생: ${error.message}`);
        }
    };

    const handleReject = async (staff) => {
        if (!confirm(`⚠️ ${staff.name}님의 데이터를 삭제하시겠습니까?`)) return;
        try {
            await supabase.from('therapists').delete().eq('id', staff.id);
            await supabase.from('user_profiles').update({ status: 'rejected' }).eq('email', staff.email);
            alert('데이터가 삭제되었습니다.');
            fetchStaffs();
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const therapistPayload = {
                name: formData.name,
                contact: formData.contact,
                email: formData.email,
                hire_type: formData.hire_type,
                remarks: formData.remarks,
                color: formData.color,
                center_id: 'd327993a-e558-4442-bac5-1469306c35bb' // 선생님 센터 ID 고정
            };

            if (editingId) {
                await supabase.from('therapists').update(therapistPayload).eq('id', editingId);
                // 권한 직접 수정 (user_profiles 테이블 반영)
                await supabase.from('user_profiles').update({
                    role: formData.system_role,
                    status: formData.system_role === 'retired' ? 'inactive' : 'active'
                }).eq('email', formData.email);
                alert('✅ 수정되었습니다.');
            } else {
                await supabase.from('therapists').insert([therapistPayload]);
                alert('✅ 직원이 등록되었습니다.');
            }

            setIsModalOpen(false);
            setEditingId(null);
            fetchStaffs();
        } catch (error) {
            alert('❌ 저장 실패: ' + error.message);
        }
    };

    const handleEdit = (staff) => {
        setEditingId(staff.id);
        setFormData({
            name: staff.name,
            contact: staff.contact || '',
            email: staff.email || '',
            hire_type: staff.hire_type || 'freelancer',
            system_role: staff.system_role || 'therapist',
            remarks: staff.remarks || '',
            color: staff.color || '#3b82f6'
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id, email) => {
        if (isSuperAdmin(email)) return alert('최상위 관리자는 해제 불가합니다.');
        if (!confirm('직원 목록에서 삭제하시겠습니까?')) return;

        await supabase.from('therapists').delete().eq('id', id);
        await supabase.from('user_profiles').update({ role: 'parent' }).eq('email', email);
        fetchStaffs();
    };

    const pendingStaffs = staffs.filter(s => s.system_status === 'pending');
    const approvedStaffs = staffs.filter(s => s.system_status !== 'pending' && s.system_status !== 'rejected').filter(s => s.name.includes(searchTerm));

    return (
        <div className="space-y-6 pb-20 p-8 bg-slate-50/50 min-h-screen">
            <Helmet><title>직원 관리 - 자라다</title></Helmet>

            {/* 상단 헤더 */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">직원 및 권한 관리</h1>
                    <p className="text-slate-500 font-bold">센터 인력을 효율적으로 관리하세요.</p>
                </div>
                <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105">
                    <Plus className="w-5 h-5" /> 직원 직접 등록
                </button>
            </div>

            {/* ⚠️ 승인 대기 목록 (이 부분이 새로 생긴 부분입니다) */}
            {pendingStaffs.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-[32px] p-6 animate-in slide-in-from-top duration-500">
                    <h2 className="text-lg font-black text-amber-900 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" /> 신규 승인 대기 ({pendingStaffs.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingStaffs.map(staff => (
                            <div key={staff.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm">
                                <div>
                                    <p className="font-black text-slate-900">{staff.name}</p>
                                    <p className="text-xs text-slate-500">{staff.email}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleReject(staff)} className="px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl">거절</button>
                                    <button onClick={() => handleApprove(staff)} className="px-4 py-2 text-xs font-bold bg-amber-500 text-white rounded-xl hover:bg-slate-900 transition-all">승인하기</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 검색창 */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" placeholder="이름으로 검색..." className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            {/* 정식 직원 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {approvedStaffs.map((staff) => (
                    <div key={staff.id} className={cn("bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm", staff.system_role === 'retired' && "opacity-50 grayscale")}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-lg" style={{ backgroundColor: staff.color }}>
                                    {staff.name[0]}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 flex items-center gap-2">
                                        {staff.name}
                                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-black", staff.system_role === 'admin' ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600")}>
                                            {staff.system_role === 'admin' ? 'Admin' : '치료사'}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-slate-400 font-bold">{staff.email}</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => handleEdit(staff)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg"><Edit2 className="w-4 h-4 text-slate-400" /></button>
                                <button onClick={() => handleDelete(staff.id, staff.email)} className="p-2 bg-slate-50 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 모달 생략 (동일 구조) */}
            {isModalOpen && (
                /* 위에 제공해주신 모달 코드를 그대로 사용하시되, 테이블명만 user_profiles로 체크하시면 됩니다. */
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[40px] w-full max-w-md p-8">
                        <h2 className="text-2xl font-black mb-6">정보 수정</h2>
                        {/* 여기에 모달 폼 코드를 넣으세요 */}
                        <button onClick={() => setIsModalOpen(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold">닫기</button>
                    </div>
                </div>
            )}
        </div>
    );
}