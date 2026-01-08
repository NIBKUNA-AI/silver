import { useState, useEffect } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useTrafficSource } from '@/hooks/useTrafficSource';

interface ConsultationSurveyFormProps {
    initialData?: {
        childName?: string;
        childBirthDate?: string;
        childGender?: 'male' | 'female' | 'other';
        guardianName?: string;
        guardianPhone?: string;
        childId?: string; // If logged in
    };
    onSuccess?: () => void;
    className?: string;
}

export function ConsultationSurveyForm({ initialData, onSuccess, className = '' }: ConsultationSurveyFormProps) {
    const { getSetting } = useAdminSettings();
    const { getSource } = useTrafficSource();
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        childName: initialData?.childName || '',
        childGender: initialData?.childGender || 'male',
        childBirthDate: initialData?.childBirthDate || '',

        concern: '', // 주 호소 문제
        diagnosis: 'no', // 장애 진단 여부 (yes/no/pending)

        consultationArea: [] as string[], // 다중 선택

        preferredConsultSchedule: '', // 상담 희망 시간
        preferredClassSchedule: '', // 수업 희망 시간

        guardianName: initialData?.guardianName || '',
        guardianRelationship: '',
        guardianPhone: initialData?.guardianPhone || '',

        inflowSource: '', // 내원 경로
    });

    // Update form if initialData changes late (e.g. async fetch)
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                childName: initialData.childName || prev.childName,
                childBirthDate: initialData.childBirthDate || prev.childBirthDate,
                childGender: initialData.childGender || prev.childGender,
                guardianName: initialData.guardianName || prev.guardianName,
                guardianPhone: initialData.guardianPhone || prev.guardianPhone,
            }));
        }
    }, [initialData]);

    const handleAreaToggle = (area: string) => {
        setFormData(prev => {
            const current = prev.consultationArea;
            if (current.includes(area)) return { ...prev, consultationArea: current.filter(a => a !== area) };
            return { ...prev, consultationArea: [...current, area] };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.childName || !formData.guardianPhone || !formData.concern) {
            alert('필수 정보를 모두 입력해주세요.');
            return;
        }

        setLoading(true);

        try {
            // 1. Save to 'consultations' table
            const finalMarketingSource = getSource();

            const { error: insertError } = await (supabase.from('consultations') as any).insert([{
                child_id: initialData?.childId || null, // Link if logged in
                child_name: formData.childName,
                child_gender: formData.childGender,
                child_birth_date: formData.childBirthDate || null,

                concern: formData.concern,
                diagnosis: formData.diagnosis,
                consultation_area: formData.consultationArea,

                preferred_consult_schedule: formData.preferredConsultSchedule,
                preferred_class_schedule: formData.preferredClassSchedule,

                guardian_name: formData.guardianName,
                guardian_phone: formData.guardianPhone,
                guardian_relationship: formData.guardianRelationship,

                inflow_source: formData.inflowSource,
                marketing_source: finalMarketingSource,
                status: 'pending'
            }]);

            if (insertError) throw insertError;

            // 2. Update 'inflow_source' in 'children' table if applicable
            if (initialData?.childId && formData.inflowSource) {
                await (supabase.from('children') as any)
                    .update({ inflow_source: formData.inflowSource })
                    .eq('id', initialData.childId);
            }

            // 3. KakaoTalk Integration (Pre-fill)
            const kakaoUrl = getSetting('kakao_url');
            if (kakaoUrl) {
                const message = `[상담 신청서]\n` +
                    `이름 : ${formData.childName}\n` +
                    `성별 : ${formData.childGender === 'male' ? '남아' : '여아'}\n` +
                    `생년월일 : ${formData.childBirthDate}\n` +
                    `어려움을 보이는점 : ${formData.concern}\n` +
                    `장애진단 여부 : ${formData.diagnosis === 'yes' ? '있음' : formData.diagnosis === 'pending' ? '검사중' : '없음'}\n` +
                    `원하시는 상담영역 : ${formData.consultationArea.join(', ')}\n` +
                    `상담 희망 시간 : ${formData.preferredConsultSchedule}\n` +
                    `수업 희망 시간 : ${formData.preferredClassSchedule}\n` +
                    `관계/연락처 : ${formData.guardianRelationship} / ${formData.guardianPhone}\n` +
                    `센터 내원경로 : ${formData.inflowSource}\n\n` +
                    `원활한 상담을 위해 작성을 완료했습니다 :)`;

                // URL Parameter method as requested
                // Note: KakaoTalk Channel chat URLs typically format as http://pf.kakao.com/_ID/chat
                // Appending query params might support pre-filling depending on the platform/scheme.
                // We will attempt to append it.
                // If it's a full URL, we check if it already has params.
                const separator = kakaoUrl.includes('?') ? '&' : '?';
                // Using a generic 'message' param or 'query' param based on common practices, 
                // though specific 3rd party support varies. The user requested this method.
                const finalUrl = `${kakaoUrl}${separator}query=${encodeURIComponent(message)}`;

                // Fallback: Also try to copy to clipboard just in case URL param doesn't work effectively on all devices
                // But user explicitly said "No Clipboard Copy", so we respect that strict wish and rely on URL.

                window.open(finalUrl, '_blank');
            }

            setIsSubmitted(true);
            if (onSuccess) onSuccess();

        } catch (error: any) {
            console.error('Error submitting consultation:', error);
            alert('접수 중 오류가 발생했습니다. ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className={`text-center py-12 space-y-6 bg-green-50 rounded-3xl border border-green-100 ${className}`}>
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-800">상담 신청이 완료되었습니다!</h3>
                    <p className="text-slate-600 mt-2">
                        담당자가 확인 후 카카오톡 또는 전화로<br />빠르게 연락드리겠습니다.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={`space-y-8 text-left ${className}`}>

            {/* 1. 아동 기본 정보 */}
            <section className="space-y-4">
                <h4 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b pb-2">
                    <span className="w-1.5 h-6 bg-primary rounded-full"></span> 아동 정보
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">아이 이름 <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            value={formData.childName}
                            onChange={e => setFormData({ ...formData, childName: e.target.value })}
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="이름 입력"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">생년월일</label>
                        <input
                            type="date"
                            value={formData.childBirthDate}
                            onChange={e => setFormData({ ...formData, childBirthDate: e.target.value })}
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">성별</label>
                        <div className="flex gap-2">
                            {(['male', 'female', 'other'] as const).map(g => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, childGender: g })}
                                    className={`flex-1 h-11 rounded-xl font-bold text-sm border transition-all ${formData.childGender === g ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                                >
                                    {g === 'male' ? '남아' : g === 'female' ? '여아' : '기타'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">장애진단 여부</label>
                        <select
                            value={formData.diagnosis}
                            onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        >
                            <option value="no">아니오 (없음)</option>
                            <option value="yes">예 (진단 받음)</option>
                            <option value="pending">검사 진행 중</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* 2. 상세 상담 내용 */}
            <section className="space-y-4">
                <h4 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b pb-2">
                    <span className="w-1.5 h-6 bg-primary rounded-full"></span> 상담 신청 내용
                </h4>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">어려움을 보이는 점 (주 호소 문제) <span className="text-red-500">*</span></label>
                    <textarea
                        required
                        value={formData.concern}
                        onChange={e => setFormData({ ...formData, concern: e.target.value })}
                        className="w-full p-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm min-h-[100px] resize-none"
                        placeholder="아이가 겪고 있는 어려움이나 걱정되는 부분을 자유롭게 적어주세요."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 block mb-2">희망 상담 영역 (중복 선택 가능)</label>
                    <div className="flex flex-wrap gap-2">
                        {['언어치료', '놀이치료', '감각통합', '인지학습', '사회성그룹', '발달검사'].map(area => (
                            <button
                                key={area}
                                type="button"
                                onClick={() => handleAreaToggle(area)}
                                className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${formData.consultationArea.includes(area)
                                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-primary/50 hover:text-primary'
                                    }`}
                            >
                                {area}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">상담 가능한 시간대</label>
                        <input
                            type="text"
                            value={formData.preferredConsultSchedule}
                            onChange={e => setFormData({ ...formData, preferredConsultSchedule: e.target.value })}
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="예: 평일 오후 2시 이후, 토요일 오전"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">정규 수업 희망 시간대</label>
                        <input
                            type="text"
                            value={formData.preferredClassSchedule}
                            onChange={e => setFormData({ ...formData, preferredClassSchedule: e.target.value })}
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="예: 월/수 4시, 화/목 5시"
                        />
                    </div>
                </div>
            </section>

            {/* 3. 보호자 정보 */}
            <section className="space-y-4">
                <h4 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b pb-2">
                    <span className="w-1.5 h-6 bg-primary rounded-full"></span> 보호자 정보
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">보호자 성함</label>
                        <input
                            type="text"
                            value={formData.guardianName}
                            onChange={e => setFormData({ ...formData, guardianName: e.target.value })}
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="성함 입력"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">연락처 <span className="text-red-500">*</span></label>
                        <input
                            type="tel"
                            required
                            value={formData.guardianPhone}
                            onChange={e => setFormData({ ...formData, guardianPhone: e.target.value })}
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="010-0000-0000"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">아동과의 관계</label>
                        <input
                            type="text"
                            value={formData.guardianRelationship}
                            onChange={e => setFormData({ ...formData, guardianRelationship: e.target.value })}
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="예: 모, 부, 조모"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">센터를 알게 된 경로</label>
                        <select
                            value={formData.inflowSource}
                            onChange={e => setFormData({ ...formData, inflowSource: e.target.value })}
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        >
                            <option value="">선택해주세요</option>
                            <option value="internet">인터넷 검색 (네이버 등)</option>
                            <option value="blog">블로그/카페 후기</option>
                            <option value="referral">지인 소개</option>
                            <option value="hospital">병원/기관 연계</option>
                            <option value="banner">현수막/전단지</option>
                            <option value="other">기타</option>
                        </select>
                    </div>
                </div>
            </section>

            <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-slate-900 text-white rounded-xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" /> : '상담 예약 신청하기'}
            </button>
            <p className="text-xs text-center text-slate-400 font-medium">
                신청하기를 누르면 카카오톡 채널 상담으로 연결됩니다.
            </p>
        </form>
    );
}
