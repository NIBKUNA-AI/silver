import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { MessageCircle, Bell, LayoutTemplate, Info, BookOpen, Palette, CheckCircle2, Brain } from 'lucide-react';
import { useAdminSettings, type AdminSettingKey, type ProgramItem } from '@/hooks/useAdminSettings';
import { ImageUploader } from '@/components/common/ImageUploader';
import { ProgramListEditor } from '@/components/admin/ProgramListEditor';
import { DEFAULT_PROGRAMS } from '@/constants/defaultPrograms';

export function SettingsPage() {
    const { getSetting, updateSetting, loading: settingsLoading } = useAdminSettings();
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'home' | 'about' | 'programs' | 'branding' | 'center_info' | 'ai_blog'>('home');

    const handleSave = async (key: AdminSettingKey, value: string) => {
        setSaving(true);
        try {
            await updateSetting(key, value);
        } catch (error) {
            console.error(error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleSavePrograms = async (newList: ProgramItem[]) => {
        setSaving(true);
        try {
            const jsonValue = JSON.stringify(newList);
            await updateSetting('programs_list', jsonValue);
        } catch (error) {
            console.error(error);
            alert('프로그램 저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    // Default programs fallback to avoid empty editor on first load if DB is empty
    const initialProgramsJson = getSetting('programs_list');
    const programsList: ProgramItem[] = initialProgramsJson ? JSON.parse(initialProgramsJson) : DEFAULT_PROGRAMS;

    if (settingsLoading) {
        return <div className="p-8 text-center text-slate-500">설정을 불러오는 중입니다...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <Helmet><title>사이트 콘텐츠 관리 - 아동발달센터 Admin</title></Helmet>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">사이트 콘텐츠 관리</h1>
                    <p className="text-slate-500 mt-1">홈페이지 전반의 콘텐츠와 브랜딩을 관리합니다.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto">
                <TabButton
                    active={activeTab === 'home'}
                    onClick={() => setActiveTab('home')}
                    icon={<LayoutTemplate className="w-4 h-4" />}
                    label="홈 (메인)"
                />
                <TabButton
                    active={activeTab === 'about'}
                    onClick={() => setActiveTab('about')}
                    icon={<Info className="w-4 h-4" />}
                    label="센터 소개"
                />
                <TabButton
                    active={activeTab === 'programs'}
                    onClick={() => setActiveTab('programs')}
                    icon={<BookOpen className="w-4 h-4" />}
                    label="프로그램"
                />
                <TabButton
                    active={activeTab === 'branding'}
                    onClick={() => setActiveTab('branding')}
                    icon={<Palette className="w-4 h-4" />}
                    label="브랜딩 (로고)"
                />
                <TabButton
                    active={activeTab === 'center_info'}
                    onClick={() => setActiveTab('center_info')}
                    icon={<Info className="w-4 h-4" />}
                    label="센터 정보"
                />
                <TabButton
                    active={activeTab === 'ai_blog'}
                    onClick={() => setActiveTab('ai_blog')}
                    icon={<BookOpen className="w-4 h-4" />}
                    label="AI 블로그 설정"
                />
            </div>

            {/* Content Area */}
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6">

                {activeTab === 'home' && (
                    <>
                        <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-yellow-100 p-2.5 rounded-xl text-yellow-600"><MessageCircle className="w-6 h-6" /></div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">카카오톡 채널 연동</h2>
                                    <p className="text-sm text-slate-500">학부모님들이 '상담 예약 확정' 시 채팅하기 버튼을 통해 이동할 링크입니다.</p>
                                </div>
                            </div>
                            <SaveableInput
                                label="카카오 채널 채팅 URL"
                                placeholder="https://pf.kakao.com/_xxxxxx/chat"
                                initialValue={getSetting('kakao_url')}
                                onSave={(val) => handleSave('kakao_url', val)}
                                saving={saving}
                            />
                        </section>

                        <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600"><Bell className="w-6 h-6" /></div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">홈페이지 상단 공지</h2>
                                    <p className="text-sm text-slate-500">메인 홈페이지 최상단에 띄울 긴급/중요 공지사항입니다. (비워두면 숨겨집니다)</p>
                                </div>
                            </div>
                            <SaveableTextArea
                                label="공지 내용"
                                placeholder="예: 5월 5일 어린이날은 휴관입니다."
                                initialValue={getSetting('notice_text')}
                                onSave={(val) => handleSave('notice_text', val)}
                                saving={saving}
                            />
                        </section>

                        <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600"><LayoutTemplate className="w-6 h-6" /></div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">메인 배너 이미지</h2>
                                    <p className="text-sm text-slate-500">홈페이지 첫 화면에 크게 들어가는 배경 이미지입니다.</p>
                                </div>
                            </div>
                            <ImageUploader
                                currentImage={getSetting('main_banner_url')}
                                onUploadComplete={(url) => handleSave('main_banner_url', url)}
                                label="배너 이미지 업로드"
                            />
                        </section>
                    </>
                )}

                {activeTab === 'about' && (
                    <>
                        <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-8">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 mb-6">소개 페이지 상단</h2>
                                <SaveableTextArea
                                    label="인트로 텍스트"
                                    placeholder="아이는 믿는 만큼 자라고..."
                                    initialValue={getSetting('about_intro_text')}
                                    onSave={(val) => handleSave('about_intro_text', val)}
                                    saving={saving}
                                    rows={3}
                                />
                            </div>

                            <hr className="border-slate-100" />

                            <div>
                                <h2 className="text-lg font-bold text-slate-900 mb-6">센터 소개 본문</h2>
                                <div className="space-y-6">
                                    <ImageUploader
                                        currentImage={getSetting('about_main_image')}
                                        onUploadComplete={(url) => handleSave('about_main_image', url)}
                                        label="소개 메인 이미지 (전경 등)"
                                    />
                                    <SaveableInput
                                        label="소개 제목 (강조)"
                                        placeholder="따뜻한 시선으로 아이의 잠재력을..."
                                        initialValue={getSetting('about_desc_title')}
                                        onSave={(val) => handleSave('about_desc_title', val)}
                                        saving={saving}
                                    />
                                    <SaveableTextArea
                                        label="소개 내용 (본문)"
                                        placeholder="행복아동발달센터는..."
                                        initialValue={getSetting('about_desc_body')}
                                        onSave={(val) => handleSave('about_desc_body', val)}
                                        saving={saving}
                                        rows={6}
                                    />
                                </div>
                            </div>
                        </section>
                    </>
                )}

                {activeTab === 'programs' && (
                    <>
                        <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-8">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 mb-6">프로그램 페이지 상단</h2>
                                <SaveableTextArea
                                    label="인트로 텍스트"
                                    placeholder="아이의 고유한 특성을 존중하며..."
                                    initialValue={getSetting('programs_intro_text')}
                                    onSave={(val) => handleSave('programs_intro_text', val)}
                                    saving={saving}
                                    rows={3}
                                />
                            </div>

                            <hr className="border-slate-100" />

                            <div>
                                <h2 className="text-lg font-bold text-slate-900 mb-2">치료 프로그램 목록</h2>
                                <p className="text-sm text-slate-500 mb-6">홈페이지에 표시될 치료 프로그램들을 관리합니다. 드래그 앤 드롭으로 순서를 변경할 수 있습니다(추후 지원).</p>

                                <ProgramListEditor
                                    initialList={programsList}
                                    onSave={handleSavePrograms}
                                />
                            </div>
                        </section>
                    </>
                )}

                {activeTab === 'branding' && (
                    <>
                        <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-teal-100 p-2.5 rounded-xl text-teal-600"><Palette className="w-6 h-6" /></div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">센터 로고 (Logo)</h2>
                                    <p className="text-sm text-slate-500">홈페이지 상단 메뉴와 하단에 표시될 로고 이미지입니다. (배경이 투명한 PNG 권장)</p>
                                </div>
                            </div>
                            <ImageUploader
                                currentImage={getSetting('center_logo')}
                                onUploadComplete={(url) => handleSave('center_logo', url)}
                                label="로고 이미지 업로드"
                                bucketName="images" // Explicitly simpler
                            />
                        </section>
                    </>
                )}


                {
                    activeTab === 'center_info' && (
                        <>
                            <CenterInfoSection />
                        </>
                    )
                }

                {
                    activeTab === 'ai_blog' && (
                        <>
                            <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600"><Brain className="w-6 h-6" /></div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">AI 블로그 자동 포스팅</h2>
                                        <p className="text-sm text-slate-500">매주 정해진 시간에 AI가 자동으로 블로그 글을 작성하고 게시합니다.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">포스팅 요일</label>
                                        <select
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                            value={getSetting('ai_posting_day') || 'Monday'}
                                            onChange={(e) => handleSave('ai_posting_day', e.target.value)}
                                            disabled={saving}
                                        >
                                            <option value="Monday">월요일</option>
                                            <option value="Tuesday">화요일</option>
                                            <option value="Wednesday">수요일</option>
                                            <option value="Thursday">목요일</option>
                                            <option value="Friday">금요일</option>
                                            <option value="Saturday">토요일</option>
                                            <option value="Sunday">일요일</option>
                                        </select>
                                    </div>
                                    <SaveableInput
                                        label="포스팅 시간 (24시간)"
                                        placeholder="09:00"
                                        initialValue={getSetting('ai_posting_time') || '09:00'}
                                        onSave={(val) => handleSave('ai_posting_time', val)}
                                        saving={saving}
                                    />
                                </div>

                                <SaveableTextArea
                                    label="다음 주제 (Next Topic)"
                                    placeholder="예: 아동의 언어 발달 단계를 촉진하는 놀이 방법 (비워두면 AI가 자동 선정)"
                                    initialValue={getSetting('ai_next_topic')}
                                    onSave={(val) => handleSave('ai_next_topic', val)}
                                    saving={saving}
                                    rows={2}
                                />
                            </section>
                        </>
                    )
                }

            </div >
        </div >
    );
}


import { supabase } from '@/lib/supabase';

// --- Center Info Component (Fetches from 'centers' table) ---
function CenterInfoSection() {
    // Local state for fetching center info
    const [info, setInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Initial Fetch
    const fetchCenterInfo = async () => {
        setLoading(true);
        console.log("Fetching center info...");

        // Assuming single center for now or linked to user
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
            console.log("No user found");
            setLoading(false);
            return;
        }

        // 1. Get Center ID from profile
        const { data: profile } = await (supabase
            .from('user_profiles') as any)
            .select('center_id')
            .eq('id', user.user!.id)
            .single();

        console.log("User profile:", profile);

        let centerId = profile?.center_id;

        // Fallback: If no center linked, get the first one (for initial setup/demo)
        if (!centerId) {
            console.log("No center linked to profile, trying fallback...");
            const { data: firstCenter } = await (supabase
                .from('centers') as any)
                .select('id')
                .limit(1)
                .single();

            if (firstCenter) {
                centerId = firstCenter.id;
                console.log("Fallback center found:", centerId);
            }
        }

        console.log("Current Center ID:", centerId);

        if (centerId) {
            const { data: center } = await (supabase
                .from('centers') as any)
                .select('*')
                .eq('id', centerId)
                .single();

            console.log("Center data fetched:", center);
            setInfo(center);
        } else {
            console.log("No center found in DB.");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCenterInfo();
    }, []);

    const handleSaveInfo = async (key: string, value: string) => {
        if (!info?.id) return;
        setSaving(true);
        const { error } = await (supabase
            .from('centers') as any)
            .update({ [key]: value })
            .eq('id', info.id);

        if (error) {
            alert('저장 실패: ' + error.message);
        } else {
            setInfo({ ...info, [key]: value });
        }
        setSaving(false);
    };

    if (loading) return <div>센터 정보 로딩 중...</div>;
    if (!info) return <div>연결된 센터 정보가 없습니다.</div>;

    return (
        <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 p-2.5 rounded-xl text-green-600"><Info className="w-6 h-6" /></div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900">센터 기본 정보</h2>
                    <p className="text-sm text-slate-500">사업자 등록증 상의 실제 센터 정보를 입력해주세요.</p>
                </div>
            </div>

            <div className="space-y-4">
                <SaveableInput
                    label="센터명 (사업자명)"
                    initialValue={info.name}
                    onSave={(val) => handleSaveInfo('name', val)}
                    saving={saving}
                />
                <SaveableInput
                    label="대표 전화번호"
                    initialValue={info.phone}
                    onSave={(val) => handleSaveInfo('phone', val)}
                    saving={saving}
                />
                <SaveableInput
                    label="주소"
                    initialValue={info.address}
                    onSave={(val) => handleSaveInfo('address', val)}
                    saving={saving}
                />
                <SaveableInput
                    label="이메일"
                    initialValue={info.email}
                    onSave={(val) => handleSaveInfo('email', val)}
                    saving={saving}
                />
            </div>
            {/* Note provided for branding sync */}
            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-500">
                💡 참고: 이곳의 정보는 실제 계약/행정용 정보입니다. 홈페이지에 표시되는 브랜드 이름이나 로고는 '브랜딩' 탭에서 별도로 설정할 수 있습니다.
            </div>
        </section>
    );
}

// --- Helper Components ---

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${active ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
            {icon} {label}
        </button>
    );
}

function SaveableInput({ label, initialValue, onSave, saving, placeholder }: { label: string, initialValue: string | null, onSave: (val: string) => void, saving: boolean, placeholder?: string }) {
    const [value, setValue] = useState(initialValue || '');
    const isChanged = value !== (initialValue || '');

    return (
        <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                />
                <button
                    onClick={() => onSave(value)}
                    disabled={!isChanged || saving}
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap flex items-center gap-2"
                >
                    {saving ? '저장...' : '저장'}
                    {!saving && isChanged && <CheckCircle2 className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

function SaveableTextArea({ label, initialValue, onSave, saving, placeholder, rows = 4 }: { label: string, initialValue: string | null, onSave: (val: string) => void, saving: boolean, placeholder?: string, rows?: number }) {
    const [value, setValue] = useState(initialValue || '');
    const isChanged = value !== (initialValue || '');

    return (
        <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
            <div className="space-y-3">
                <textarea
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    rows={rows}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium resize-none"
                    spellCheck={false}
                />
                <div className="flex justify-end">
                    <button
                        onClick={() => onSave(value)}
                        disabled={!isChanged || saving}
                        className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        {saving ? '저장 중...' : '변경사항 저장'}
                        {!saving && isChanged && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
