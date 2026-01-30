// @ts-nocheck
/* eslint-disable */
/**
 * 🌿 SILVER CARE - Elderly Care Consultation Form
 * 재가요양 상담 신청 양식
 */
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useTrafficSource } from '@/hooks/useTrafficSource';
import { useTheme } from '@/contexts/ThemeProvider';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Custom SVG Icons
const Icons = {
    checkCircle: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" />
            <path d="M22 4L12 14.01l-3-3" stroke="currentColor" />
        </svg>
    ),
    loader: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" />
            <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" />
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" stroke="currentColor" />
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" stroke="currentColor" />
            <line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" />
            <line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" />
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" stroke="currentColor" />
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" stroke="currentColor" />
        </svg>
    ),
    send: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" stroke="currentColor" />
        </svg>
    ),
};

interface ConsultationSurveyFormProps {
    centerId?: string;
    onSuccess?: () => void;
}

export function ConsultationSurveyForm({ centerId, onSuccess }: ConsultationSurveyFormProps) {
    const { getSource } = useTrafficSource();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;
    const formContainerRef = useRef<HTMLDivElement>(null);

    // 🌿 어르신 정보 (Silver Care 맞춤)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 50 }, (_, i) => currentYear - 60 - i); // 60세 이상
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    // 재가요양 서비스 종류
    const services = ['신체활동 지원', '가사활동 지원', '건강관리', '인지활동 지원', '정서 지원', '병원 동행'];

    const [birth, setBirth] = useState({ year: '', month: '', day: '' });

    const [formData, setFormData] = useState({
        // Step 1: 어르신 정보
        elder_name: '',
        elder_gender: '남성',
        has_care_grade: '없음',
        care_grade: '',
        living_situation: '자녀와 동거',

        // Step 2: 건강/케어 정보
        health_condition: '',
        preferred_service: [] as string[],
        service_frequency: '',

        // Step 3: 보호자 정보
        guardian_name: '',
        guardian_phone: '',
        guardian_relation: '',
        discovery_path: ''
    });

    const scrollToFormTop = () => {
        formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const nextStep = () => {
        if (currentStep === 1) {
            if (!formData.elder_name) {
                alert('어르신 성함을 입력해주세요.');
                return;
            }
        }
        if (currentStep === 2) {
            if (!formData.health_condition) {
                alert('건강 상태 또는 필요한 케어를 입력해주세요.');
                return;
            }
        }
        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        scrollToFormTop();
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        scrollToFormTop();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentStep < totalSteps) {
            nextStep();
            return;
        }

        if (!formData.guardian_name || !formData.guardian_phone || !formData.discovery_path) {
            alert('보호자 정보와 방문 경로를 모두 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const utmSource = localStorage.getItem('utm_source');
            const utmMedium = localStorage.getItem('utm_medium');
            const utmCampaign = localStorage.getItem('utm_campaign');
            const utmContent = localStorage.getItem('utm_content');

            const marketingInfo = [
                utmSource ? `Source: ${utmSource}` : null,
                utmMedium ? `Medium: ${utmMedium}` : null,
                utmCampaign ? `Campaign: ${utmCampaign}` : null,
                utmContent ? `Content: ${utmContent}` : null,
            ].filter(Boolean).join(' / ');

            // 🌿 어르신 정보로 저장
            const birthDate = birth.year && birth.month && birth.day
                ? `${birth.year}-${String(birth.month).padStart(2, '0')}-${String(birth.day).padStart(2, '0')}`
                : null;

            const { error } = await supabase.from('consultations').insert([{
                center_id: centerId,
                // child_* 필드를 어르신 정보로 사용
                child_name: formData.elder_name,
                child_gender: formData.elder_gender === '여성' ? 'female' : 'male',
                child_birth_date: birthDate,
                guardian_name: formData.guardian_name,
                guardian_phone: formData.guardian_phone,
                concern: `[어르신 상태]\n${formData.health_condition}\n\n[관리자 참고]\n장기요양등급: ${formData.has_care_grade}${formData.care_grade ? ` (${formData.care_grade}등급)` : ''}\n주거형태: ${formData.living_situation}\n관계: ${formData.guardian_relation}\n희망 서비스 빈도: ${formData.service_frequency}`,
                preferred_consult_schedule: formData.preferred_service.join(', '),
                inflow_source: formData.discovery_path || getSource() || 'Direct',
                marketing_source: marketingInfo || null,
                status: 'pending',
                created_at: new Date().toISOString()
            }]);

            if (error) throw error;
            setSubmitted(true);
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Submit Error:', err);
            alert('신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = cn(
        "w-full p-4 rounded-2xl border-none focus:ring-4 font-bold transition-colors",
        isDark
            ? "bg-slate-800 text-white placeholder-slate-500 focus:ring-emerald-900"
            : "bg-slate-50 text-slate-900 focus:ring-emerald-100/50"
    );

    const selectClass = cn(
        "w-full p-4 rounded-2xl border-none focus:ring-2 font-bold cursor-pointer appearance-none transition-colors",
        isDark
            ? "bg-slate-800 text-white focus:ring-emerald-900"
            : "bg-slate-50 text-slate-700 focus:ring-emerald-100/50"
    );

    if (submitted) {
        return (
            <div className={cn(
                "p-12 rounded-[40px] shadow-xl text-center space-y-6 animate-in fade-in zoom-in duration-500",
                isDark ? "bg-slate-800" : "bg-white"
            )}>
                <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center mx-auto",
                    isDark ? "bg-emerald-900 text-emerald-400" : "bg-emerald-100 text-emerald-600"
                )}>
                    {Icons.checkCircle("w-10 h-10")}
                </div>
                <h2 className={cn("text-3xl font-black", isDark ? "text-white" : "text-slate-900")}>상담 신청 완료!</h2>
                <p className={cn("font-bold leading-relaxed", isDark ? "text-slate-400" : "text-slate-500")}>
                    담당자가 확인 후 빠른 시일 내에 연락드리겠습니다.<br />
                    어르신의 건강한 일상을 함께 하겠습니다.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className={cn(
                        "px-8 py-4 rounded-2xl font-black mx-auto block transition-colors",
                        isDark ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-emerald-600 text-white hover:bg-emerald-700"
                    )}
                >
                    확인
                </button>
            </div>
        );
    }

    return (
        <div ref={formContainerRef} className="space-y-12 scroll-mt-24">
            {/* Step Progress Bar */}
            <div className="flex items-center justify-between max-w-xs mx-auto mb-16">
                {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center relative">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm z-10 transition-all duration-500",
                            currentStep === step
                                ? "bg-emerald-600 text-white scale-110 shadow-lg shadow-emerald-200"
                                : currentStep > step
                                    ? "bg-emerald-100 text-emerald-600"
                                    : (isDark ? "bg-slate-800 text-slate-600" : "bg-slate-100 text-slate-400")
                        )}>
                            {currentStep > step ? Icons.checkCircle("w-5 h-5") : step}
                        </div>
                        {step < 3 && (
                            <div className={cn(
                                "absolute left-10 w-24 h-[2px] -z-0",
                                currentStep > step ? "bg-emerald-600" : (isDark ? "bg-slate-800" : "bg-slate-100")
                            )} />
                        )}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-10 text-left">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* 🌿 STEP 1: 어르신 정보 */}
                    {currentStep === 1 && (
                        <section className="space-y-8">
                            <div className="space-y-2">
                                <h3 className={cn("text-2xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                                    어르신 정보를 알려주세요
                                </h3>
                                <p className="text-sm font-bold text-slate-400">맞춤 케어를 위한 기본 정보입니다.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">어르신 성함 *</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="성함 입력"
                                        className={inputClass}
                                        value={formData.elder_name}
                                        onChange={e => setFormData({ ...formData, elder_name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">출생년도 (선택)</label>
                                    <div className="flex gap-2">
                                        <select className={selectClass} value={birth.year} onChange={e => setBirth({ ...birth, year: e.target.value })}>
                                            <option value="">년도</option>
                                            {years.map(y => <option key={y} value={y}>{y}년</option>)}
                                        </select>
                                        <select className={selectClass} value={birth.month} onChange={e => setBirth({ ...birth, month: e.target.value })}>
                                            <option value="">월</option>
                                            {months.map(m => <option key={m} value={m}>{m}월</option>)}
                                        </select>
                                        <select className={selectClass} value={birth.day} onChange={e => setBirth({ ...birth, day: e.target.value })}>
                                            <option value="">일</option>
                                            {days.map(d => <option key={d} value={d}>{d}일</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">성별</label>
                                        <div className={cn("flex p-1.5 rounded-2xl", isDark ? "bg-slate-800" : "bg-slate-50")}>
                                            {['남성', '여성'].map(g => (
                                                <button
                                                    key={g}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, elder_gender: g })}
                                                    className={cn(
                                                        "flex-1 py-3 rounded-xl font-black text-sm transition-all",
                                                        formData.elder_gender === g
                                                            ? (isDark ? "bg-slate-700 text-emerald-400 shadow-sm" : "bg-white text-emerald-600 shadow-sm")
                                                            : (isDark ? "text-slate-500" : "text-slate-400")
                                                    )}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">장기요양등급</label>
                                        <select
                                            className={selectClass}
                                            value={formData.has_care_grade}
                                            onChange={e => setFormData({ ...formData, has_care_grade: e.target.value })}
                                        >
                                            <option value="없음">없음 / 모름</option>
                                            <option value="1등급">1등급</option>
                                            <option value="2등급">2등급</option>
                                            <option value="3등급">3등급</option>
                                            <option value="4등급">4등급</option>
                                            <option value="5등급">5등급</option>
                                            <option value="인지지원등급">인지지원등급</option>
                                            <option value="신청예정">신청 예정</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">주거 형태</label>
                                    <select
                                        className={selectClass}
                                        value={formData.living_situation}
                                        onChange={e => setFormData({ ...formData, living_situation: e.target.value })}
                                    >
                                        <option value="자녀와 동거">자녀와 동거</option>
                                        <option value="배우자와 동거">배우자와 동거</option>
                                        <option value="독거">혼자 거주 (독거)</option>
                                        <option value="요양시설">요양시설 거주</option>
                                        <option value="기타">기타</option>
                                    </select>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 🌿 STEP 2: 건강/케어 정보 */}
                    {currentStep === 2 && (
                        <section className="space-y-8">
                            <div className="space-y-2">
                                <h3 className={cn("text-2xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                                    어떤 도움이 필요하신가요?
                                </h3>
                                <p className="text-sm font-bold text-slate-400">어르신의 상황을 알려주시면 맞춤 상담을 도와드립니다.</p>
                            </div>

                            <div className="space-y-6">
                                <textarea
                                    required
                                    placeholder="어르신의 건강 상태, 필요한 케어, 특별히 신경 써야 할 부분 등을 자유롭게 적어주세요.&#10;&#10;예: 거동이 불편하셔서 이동 도움이 필요합니다. 당뇨가 있어 식이조절과 혈당 체크가 필요합니다."
                                    rows={5}
                                    className={cn(inputClass, "resize-none rounded-[32px] p-6")}
                                    value={formData.health_condition}
                                    onChange={e => setFormData({ ...formData, health_condition: e.target.value })}
                                />

                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">필요한 서비스 (중복 선택 가능)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {services.map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => {
                                                    const next = formData.preferred_service.includes(s)
                                                        ? formData.preferred_service.filter(i => i !== s)
                                                        : [...formData.preferred_service, s];
                                                    setFormData({ ...formData, preferred_service: next });
                                                }}
                                                className={cn(
                                                    "px-5 py-3 rounded-full text-sm font-black transition-all border-2",
                                                    formData.preferred_service.includes(s)
                                                        ? (isDark ? "bg-emerald-600 border-emerald-600 text-white" : "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100")
                                                        : (isDark ? "bg-slate-800 border-slate-700 text-slate-500" : "bg-white border-slate-100 text-slate-400")
                                                )}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">희망 서비스 빈도</label>
                                    <select
                                        className={selectClass}
                                        value={formData.service_frequency}
                                        onChange={e => setFormData({ ...formData, service_frequency: e.target.value })}
                                    >
                                        <option value="">선택해주세요</option>
                                        <option value="주 1~2회">주 1~2회</option>
                                        <option value="주 3~4회">주 3~4회</option>
                                        <option value="주 5회 이상">주 5회 이상</option>
                                        <option value="매일">매일</option>
                                        <option value="상담 후 결정">상담 후 결정</option>
                                    </select>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 🌿 STEP 3: 보호자 정보 */}
                    {currentStep === 3 && (
                        <section className="space-y-8">
                            <div className="space-y-2">
                                <h3 className={cn("text-2xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                                    마지막으로 연락처를 남겨주세요
                                </h3>
                                <p className="text-sm font-bold text-slate-400">담당자가 확인 후 직접 연락드리겠습니다.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">보호자 성함 *</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="성함"
                                            className={inputClass}
                                            value={formData.guardian_name}
                                            onChange={e => setFormData({ ...formData, guardian_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">어르신과의 관계</label>
                                        <input
                                            type="text"
                                            placeholder="예: 자녀, 배우자"
                                            className={inputClass}
                                            value={formData.guardian_relation}
                                            onChange={e => setFormData({ ...formData, guardian_relation: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">연락처 *</label>
                                    <input
                                        required
                                        type="tel"
                                        placeholder="010-0000-0000"
                                        className={inputClass}
                                        value={formData.guardian_phone}
                                        onChange={e => setFormData({ ...formData, guardian_phone: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2 pt-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">방문 경로 *</label>
                                    <select
                                        required
                                        className={selectClass}
                                        value={formData.discovery_path}
                                        onChange={e => setFormData({ ...formData, discovery_path: e.target.value })}
                                    >
                                        <option value="">저희 센터를 어떻게 알고 오셨나요?</option>
                                        <optgroup label="온라인">
                                            <option value="Naver Search">네이버 검색</option>
                                            <option value="Naver Place">네이버 지도</option>
                                            <option value="Naver Blog">네이버 블로그</option>
                                            <option value="Instagram">인스타그램/SNS</option>
                                        </optgroup>
                                        <optgroup label="오프라인/기타">
                                            <option value="Referral">지인 소개</option>
                                            <option value="Hospital">병원/복지관 추천</option>
                                            <option value="NHIS">국민건강보험공단 안내</option>
                                            <option value="Others">기타</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>
                        </section>
                    )}
                </motion.div>

                <div className="flex gap-4 pt-10">
                    {currentStep > 1 && (
                        <button
                            type="button"
                            onClick={prevStep}
                            className={cn(
                                "px-8 py-5 rounded-[24px] font-black transition-all",
                                isDark ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            )}
                        >
                            이전
                        </button>
                    )}
                    <button
                        disabled={loading}
                        type="submit"
                        className={cn(
                            "flex-1 py-5 rounded-[24px] text-lg font-black shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50",
                            isDark ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100"
                        )}
                    >
                        {loading ? Icons.loader("w-6 h-6 animate-spin") : (currentStep === totalSteps ? Icons.send("w-5 h-5") : null)}
                        {currentStep === totalSteps ? "상담 신청하기" : "다음 단계로"}
                    </button>
                </div>
            </form>
        </div>
    );
}