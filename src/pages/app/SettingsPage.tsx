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
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MessageCircle, Bell, LayoutTemplate, Info, BookOpen, Palette, CheckCircle2, Brain, Loader2, X, Receipt, Search, ChevronLeft, ChevronRight, Pencil, Clock, Share2, UserX, Heart } from 'lucide-react';
import { useAdminSettings, type AdminSettingKey, type ProgramItem } from '@/hooks/useAdminSettings';
import { ImageUploader } from '@/components/common/ImageUploader';
import { MultiImageUploader } from '@/components/common/MultiImageUploader';
import { ProgramListEditor } from '@/components/admin/ProgramListEditor';
import { DEFAULT_PROGRAMS } from '@/constants/defaultPrograms';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCenter } from '@/contexts/CenterContext';
import { useTheme } from '@/contexts/ThemeProvider';
import { AccountDeletionModal } from '@/components/AccountDeletionModal';
import { Plus, Trash2, Edit2, Globe, Eye, EyeOff, MapPin, Phone } from 'lucide-react';

// --- ❌ 원본 로직 절대 보존 ---
const AI_GENERATING_KEY = 'ai_blog_generating';
const AI_GENERATION_START_KEY = 'ai_blog_generation_start';

type TabType = 'home' | 'about' | 'programs' | 'therapists' | 'branding' | 'center_info' | 'account';
const VALID_TABS: TabType[] = ['home', 'about', 'programs', 'therapists', 'branding', 'center_info', 'account'];

export function SettingsPage() {
    const { settings, getSetting, loading: settingsLoading, fetchSettings } = useAdminSettings();
    const { user } = useAuth();
    const { center } = useCenter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const centerId = center?.id;
    const [saving, setSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab') as TabType | null;
    const activeTab: TabType = (tabParam && VALID_TABS.includes(tabParam)) ? tabParam : 'home';

    const setActiveTab = (tab: TabType) => {
        setSearchParams({ tab });
    };

    const handleSave = async (key: AdminSettingKey, value: string | null) => {
        if (!centerId) {
            alert('센터 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        setSaving(true);
        try {
            const finalValue = (value === "" || value === null) ? null : value;
            // ✨ [Persistence Fix] Enforce center_id to prevent orphan data
            const { error } = await supabase
                .from('admin_settings')
                .upsert({
                    center_id: centerId,
                    key: key,
                    value: finalValue,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'center_id, key' }); // Composite Key Constraint

            if (error) throw error;

            // ✨ [Sync Fix] Notify all listeners to refetch
            window.dispatchEvent(new Event('settings-updated'));

            if (fetchSettings) await fetchSettings();
        } catch (error) {
            console.error('Save Error:', error);
            alert('저장 중 오류 발생: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSavePrograms = async (newList: ProgramItem[]) => {
        if (!centerId) return;
        setSaving(true);
        try {
            const jsonValue = JSON.stringify(newList);
            const { error } = await supabase.from('admin_settings').upsert({
                center_id: centerId,
                key: 'programs_list',
                value: jsonValue,
                updated_at: new Date().toISOString()
            }, { onConflict: 'center_id, key' });

            if (error) throw error;

            // ✨ [Sync Fix] Notify all listeners to refetch
            window.dispatchEvent(new Event('settings-updated'));

            if (fetchSettings) await fetchSettings();
            alert('프로그램 목록이 즉시 반영되었습니다.');
        } catch (error) {
            alert('저장 실패');
        } finally {
            setSaving(false);
        }
    };

    const initialProgramsJson = getSetting('programs_list');
    const programsList: ProgramItem[] = initialProgramsJson ? JSON.parse(initialProgramsJson) : DEFAULT_PROGRAMS;

    if (settingsLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline w-10 h-10 text-slate-300" /></div>;

    // ✨ [Safety] Super Admin Global Mode Guard
    if (!centerId) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center space-y-6">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <Pencil className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">센터를 선택해주세요</h2>
                <p className="text-slate-500 font-bold max-w-md">
                    설정을 변경할 센터가 선택되지 않았습니다. 상단 배너의 '센터 전환' 버튼을 눌러 관리할 지점을 선택해주세요.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4 text-left font-bold">
            <Helmet><title>사이트 관리</title></Helmet>

            <div className="flex flex-col gap-1 text-left">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white text-left">사이트 콘텐츠 관리</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold text-left">콘텐츠 수정 후 저장 시 즉시 반영됩니다.</p>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl overflow-x-auto gap-1 no-scrollbar">
                {[
                    { id: 'home', label: '홈', icon: <LayoutTemplate className="w-4 h-4" /> },
                    { id: 'about', label: '센터소개', icon: <Info className="w-4 h-4" /> },
                    { id: 'programs', label: '케어서비스', icon: <BookOpen className="w-4 h-4" /> },
                    { id: 'therapists', label: '요양보호사', icon: <Heart className="w-4 h-4" /> },
                    { id: 'center_info', label: '운영정보', icon: <Clock className="w-4 h-4" /> },
                    { id: 'branding', label: '브랜드/SEO', icon: <Palette className="w-4 h-4" /> },
                    { id: 'account', label: '계정', icon: <UserX className="w-4 h-4" /> },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={cn(
                            "flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex-1 hover:bg-white/50 dark:hover:bg-slate-700/50",
                            activeTab === tab.id
                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                : "text-slate-500 dark:text-slate-400"
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-10 pt-4 text-left">
                {activeTab === 'home' && (
                    <HomeSettingsTab
                        getSetting={getSetting}
                        handleSave={handleSave}
                        saving={saving}
                    />
                )}

                {activeTab === 'about' && (
                    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {/* 1. ✨ Hero Intro Section (Top) */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">페이지 상단 소개</h3>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HERO SECTION</span>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">
                                {/* Actual AboutPage Hero Preview */}
                                <div className={cn(
                                    "rounded-[40px] overflow-hidden shadow-2xl relative border border-emerald-100",
                                    isDark ? "bg-slate-900" : "bg-gradient-to-b from-emerald-50 to-white"
                                )}>
                                    <div className="p-12 flex flex-col justify-center h-full text-left">
                                        <span className="text-emerald-600 font-bold text-[10px] tracking-widest uppercase mb-3 block">
                                            About Us
                                        </span>
                                        <h1 className={cn(
                                            "text-3xl font-black mb-4 leading-tight",
                                            isDark ? "text-white" : "text-slate-900"
                                        )}>
                                            어르신의 행복이<br />
                                            <span className="text-emerald-600">우리의 행복</span>입니다
                                        </h1>
                                        <p className={cn(
                                            "text-sm leading-relaxed whitespace-pre-line",
                                            isDark ? "text-slate-400" : "text-slate-600"
                                        )}>
                                            {getSetting('about_intro_text') || "어르신 한 분 한 분을 가족처럼 모시며,\n건강하고 행복한 노후 생활을 함께 합니다."}
                                        </p>
                                    </div>
                                </div>

                                {/* Editor */}
                                <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                                    <SaveableTextArea
                                        label="인트로 문구 (상단 배너)"
                                        placeholder="줄바꿈을 사용하여 보기 좋게 작성해주세요."
                                        initialValue={getSetting('about_intro_text')}
                                        onSave={(v) => handleSave('about_intro_text', v)}
                                        saving={saving}
                                        rows={4}
                                    />
                                    <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
                                        * 이 문구는 센터 소개 페이지의 최상단 배경 위에 표시됩니다.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 2. ✨ Main Page Story Section (Separate) */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                        <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">메인 홈페이지 스토리</h3>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MAIN PAGE</span>
                            </div>

                            {/* Live Preview (Text Left, Image Right) */}
                            <div className={cn(
                                "relative rounded-[50px] overflow-hidden shadow-2xl border",
                                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                            )}>
                                <div className="absolute top-4 left-6 z-20 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-widest border border-white/10">
                                    Home: Story Preview
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2">
                                    {/* Text Content */}
                                    <div className="p-12 md:p-16 flex flex-col justify-center space-y-8">
                                        <div>
                                            <span className="text-emerald-600 font-bold text-sm tracking-widest uppercase mb-4 block">
                                                Why Choose Us
                                            </span>
                                            <h3 className={cn("text-3xl md:text-4xl font-black leading-[1.2] mb-6", isDark ? "text-white" : "text-slate-900")}>
                                                {getSetting('home_story_title') || "부모님의 평온한 일상을\n위한 가장 따뜻한 선택"}
                                            </h3>
                                            <p className={cn("text-base leading-relaxed mb-8 font-medium", isDark ? "text-slate-400" : "text-slate-600")}>
                                                {getSetting('home_story_body') || "메인 홈페이지에 표시될 소개글입니다.\n정성 어린 마음으로 부모님을 모십니다."}
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            {[{ title: "국가공인 전문 인력" }, { title: "1:1 맞춤 케어플랜" }].map((item, idx) => (
                                                <div key={idx} className="flex gap-4">
                                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-1">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                    </div>
                                                    <h4 className={cn("font-bold text-lg", isDark ? "text-white" : "text-slate-900")}>{item.title}</h4>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Image Side */}
                                    <div className="hidden lg:block relative p-12">
                                        <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl relative">
                                            <img
                                                src={getSetting('home_story_image') || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800"}
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Floating Stats */}
                                            <div className={cn("absolute -bottom-4 -left-4 p-4 rounded-xl shadow-xl", isDark ? "bg-slate-800" : "bg-white")}>
                                                <div className="text-2xl font-black text-emerald-600">10+</div>
                                                <div className="text-[10px] font-bold text-slate-500">년 경력 전문팀</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Editor */}
                            <SectionCard title="메인 페이지 스토리 편집" icon={<Edit2 className="text-blue-500" />}>
                                <div className="space-y-6">
                                    <ImageUploader bucketName="images" label="메인 스토리 (우측) 이미지" currentImage={getSetting('home_story_image')} onUploadComplete={(url) => handleSave('home_story_image', url)} />
                                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
                                    <SaveableTextArea label="강조 제목 (Quote)" initialValue={getSetting('home_story_title')} onSave={(v) => handleSave('home_story_title', v)} saving={saving} rows={2} />
                                    <SaveableTextArea label="본문 설명 (Description)" initialValue={getSetting('home_story_body')} onSave={(v) => handleSave('home_story_body', v)} saving={saving} rows={4} />
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <SaveableInput label="버튼 텍스트" initialValue={getSetting('home_cta_text')} onSave={(v) => handleSave('home_cta_text', v)} saving={saving} />
                                        <SaveableInput label="버튼 링크 (URL)" initialValue={getSetting('home_cta_link')} onSave={(v) => handleSave('home_cta_link', v)} saving={saving} />
                                    </div>
                                </div>
                            </SectionCard>
                        </div>


                        {/* 3. ✨ About Page Story Section (Separate) */}
                        <div className="space-y-6 pt-12 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                                        <Heart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">센터 소개 (About) 페이지 스토리</h3>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ABOUT PAGE</span>
                            </div>

                            {/* Live Preview (Image Left, Text Right) */}
                            <div className="relative rounded-[50px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 group">
                                <div className="absolute top-4 right-6 z-20 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-widest border border-white/10">
                                    About Page Live Preview
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2">
                                    {/* Image (Left) */}
                                    <div className="relative h-[350px] lg:h-auto bg-slate-100 dark:bg-slate-800 order-last lg:order-first">
                                        {getSetting('about_main_image') ? (
                                            <img src={getSetting('about_main_image')} alt="About Preview" className="absolute inset-0 w-full h-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold">이미지가 없습니다</div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent lg:bg-gradient-to-r"></div>
                                    </div>

                                    {/* Text (Right) */}
                                    <div className="p-10 md:p-16 flex flex-col justify-center space-y-6">
                                        <div className="text-indigo-100 dark:text-slate-700">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M4.583 17.321C3.548 16.227 3 15 3 13.044c0-3.347 2.48-6.332 6.264-8.044L10.5 6.5c-2.352 1.15-3.88 2.882-4.098 4.69.09-.016.178-.024.266-.024a2.5 2.5 0 010 5c-1.38 0-2.5-1.12-2.5-2.5a.5.5 0 01.015-.105zm10.333 0C13.881 16.227 13.333 15 13.333 13.044c0-3.347 2.48-6.332 6.264-8.044L20.833 6.5c-2.352 1.15-3.88 2.882-4.098 4.69.09-.016.178-.024.266-.024a2.5 2.5 0 010 5c-1.38 0-2.5-1.12-2.5-2.5a.5.5 0 01.015-.105z" /></svg>
                                        </div>
                                        <h3 className="text-3xl font-black leading-tight tracking-[-0.05em] text-slate-900 dark:text-white whitespace-pre-line" style={{ wordBreak: 'keep-all' }}>
                                            {getSetting('about_desc_title') || "가족 같은 마음으로\n어르신의 손발이 되어드립니다"}
                                        </h3>
                                        <p className="text-base font-medium leading-relaxed text-slate-500 dark:text-slate-400 whitespace-pre-line" style={{ wordBreak: 'keep-all' }}>
                                            {getSetting('about_desc_body') || "센터의 철학과 정성 어린 케어 서비스를\n보호자분들에게 진솔하게 전달해 보세요."}
                                        </p>
                                        <div className="flex items-center gap-2 font-bold text-sm mt-4" style={{ color: getSetting('brand_color') || '#8B5A2B' }}>
                                            {getSetting('about_cta_text') || '상담 예약하기'}
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Editor */}
                            <SectionCard title="센터 소개 페이지 스토리 편집" icon={<Edit2 className="text-emerald-500" />}>
                                <div className="space-y-6">
                                    <ImageUploader bucketName="images" label="센터 소개 (좌측) 이미지" currentImage={getSetting('about_main_image')} onUploadComplete={(url) => handleSave('about_main_image', url)} />
                                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
                                    <SaveableTextArea label="강조 제목 (Quote)" initialValue={getSetting('about_desc_title')} onSave={(v) => handleSave('about_desc_title', v)} saving={saving} rows={2} />
                                    <SaveableTextArea label="본문 설명 (Description)" initialValue={getSetting('about_desc_body')} onSave={(v) => handleSave('about_desc_body', v)} saving={saving} rows={5} />
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <SaveableInput label="버튼 텍스트" initialValue={getSetting('about_cta_text')} onSave={(v) => handleSave('about_cta_text', v)} saving={saving} />
                                        <SaveableInput label="버튼 링크 (URL)" initialValue={getSetting('about_cta_link')} onSave={(v) => handleSave('about_cta_link', v)} saving={saving} />
                                    </div>
                                </div>
                            </SectionCard>
                        </div>

                        {/* 3. Gallery */}
                        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                            <SectionCard title="센터 갤러리 (하단)" icon={<Palette className="text-purple-500" />}>
                                <MultiImageUploader
                                    label="갤러리 이미지 (여러 장 선택 가능)"
                                    currentImages={getSetting('about_gallery')}
                                    onUploadComplete={(url) => handleSave('about_gallery', url)}
                                />
                            </SectionCard>
                        </div>
                    </div>
                )}

                {activeTab === 'programs' && (
                    <div className="space-y-10">
                        {/* ✨ Actual ProgramsPage Header & Card Preview */}
                        <div className={cn(
                            "rounded-[40px] overflow-hidden shadow-2xl border",
                            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                        )}>
                            <div className={cn(
                                "p-12 border-b",
                                isDark ? "bg-slate-900 border-slate-800" : "bg-gradient-to-b from-emerald-50 to-white border-slate-100"
                            )}>
                                <span className="text-emerald-600 font-bold text-[10px] tracking-widest uppercase mb-3 block">Our Services</span>
                                <h1 className={cn(
                                    "text-3xl font-black mb-4",
                                    isDark ? "text-white" : "text-slate-900"
                                )}>
                                    <span className="text-emerald-600">맞춤형</span> 케어 서비스
                                </h1>
                                <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-600")}>
                                    어르신의 상황과 필요에 맞는 다양한 재가요양 서비스를 제공합니다.
                                </p>
                            </div>

                            <div className="p-10 bg-slate-50 dark:bg-slate-950 flex justify-center">
                                <div className={cn(
                                    "w-full max-w-sm rounded-[32px] overflow-hidden border shadow-xl",
                                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                                )}>
                                    {/* Header Part of Card */}
                                    <div className={cn("p-6 flex items-center gap-4", isDark ? "bg-slate-800" : "bg-blue-50")}>
                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-white shadow-md")}>🧑‍🤝‍🧑</div>
                                        <div>
                                            <h3 className={cn("text-lg font-black", isDark ? "text-white" : "text-slate-900")}>신체활동 지원</h3>
                                            <p className={cn("text-[10px] font-bold", isDark ? "text-slate-400" : "text-slate-600")}>일상생활 기본 동작 지원</p>
                                        </div>
                                    </div>
                                    {/* Features Part of Card */}
                                    <div className="p-6">
                                        <ul className="space-y-3">
                                            {["식사 도움", "세면/목욕 도움", "배설 도움"].map((f, i) => (
                                                <li key={i} className="flex items-center gap-3">
                                                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-500 shrink-0">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                                    </div>
                                                    <span className={cn("text-xs font-medium", isDark ? "text-slate-300" : "text-slate-700")}>{f}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <SectionCard title="서비스 리스트 에디터" icon={<BookOpen className="text-emerald-500" />}>
                            <SaveableTextArea label="페이지 상세 안내" initialValue={getSetting('programs_intro_text')} placeholder="어르신들을 위한 다양한 케어 서비스를 소개해 보세요." onSave={(v) => handleSave('programs_intro_text', v)} saving={saving} rows={2} />
                            <div className="mt-8 border-t dark:border-slate-800 pt-8">
                                <ProgramListEditor initialList={programsList} onSave={handleSavePrograms} />
                            </div>
                        </SectionCard>
                    </div>
                )}

                {activeTab === 'therapists' && (
                    <div className="space-y-10">
                        {/* ✨ Actual TherapistsPage Header & Profile Preview */}
                        <div className={cn(
                            "rounded-[40px] overflow-hidden shadow-2xl border bg-white dark:bg-slate-950",
                            isDark ? "border-slate-800" : "border-slate-200"
                        )}>
                            <div className={cn(
                                "p-12 border-b text-center",
                                isDark ? "bg-slate-900 border-slate-800" : "bg-gradient-to-b from-emerald-50 to-white border-slate-100"
                            )}>
                                <span className="text-emerald-600 font-bold text-[10px] tracking-widest uppercase mb-3 block">Our Caregivers</span>
                                <h1 className={cn("text-3xl font-black mb-4", isDark ? "text-white" : "text-slate-900")}>
                                    <span className="text-emerald-600">전문</span> 요양보호사
                                </h1>
                                <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-600")}>
                                    국가공인 자격을 갖춘 요양보호사가 어르신을 가족처럼 정성껏 돌봅니다.
                                </p>
                            </div>

                            <div className="p-10 flex justify-center bg-slate-50 dark:bg-slate-900">
                                <div className={cn(
                                    "w-full max-w-sm rounded-[32px] overflow-hidden shadow-xl",
                                    isDark ? "bg-slate-800" : "bg-white"
                                )}>
                                    <div className="aspect-[4/3] bg-slate-200 relative flex items-center justify-center">
                                        <span className="text-6xl opacity-20">👤</span>
                                        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                                            <span className="px-2 py-1 bg-emerald-500 text-white text-[9px] font-black rounded-lg">요양보호사</span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className={cn("font-black text-lg mb-2", isDark ? "text-white" : "text-slate-900")}>홍길동 보호사</h3>
                                        <p className={cn("text-xs mb-4", isDark ? "text-slate-400" : "text-slate-500")}>"부모님 모시듯 정성을 다하겠습니다."</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['치매케어', '방문목욕'].map(s => (
                                                <span key={s} className={cn("px-2 py-1 rounded-md text-[9px] font-black", isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600")}>{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <SectionCard title="요양보호사 소개 관리" icon={<Heart className="text-rose-500" />}>
                            <SaveableTextArea label="페이지 인트로 문구" initialValue={getSetting('therapists_intro_text')} placeholder="전문성을 갖춘 요양보호사 선생님들을 소개해 보세요." onSave={(v) => handleSave('therapists_intro_text', v)} saving={saving} rows={2} />
                            <div className="pt-6 border-t dark:border-slate-800 mt-6 space-y-4">
                                <div className="pt-6 space-y-8">
                                    <TherapistProfilesManager centerId={centerId} />
                                </div>
                            </div>
                        </SectionCard>
                    </div>
                )}

                {activeTab === 'branding' && (
                    <div className="space-y-10">
                        <SectionCard title="사이트 정체성 설정" icon={<Palette className="text-indigo-500" />}>
                            <div className="space-y-10">
                                {/* 🎨 Color Selection */}
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 ml-1">브랜드 메인 컬러</label>
                                            <p className="text-xs text-slate-400 font-medium ml-1">헤더, 버튼, 강조 문구 등에 적용됩니다.</p>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getSetting('brand_color') || '#8B5A2B' }} />
                                            <span className="text-[10px] font-black text-slate-500 uppercase">{getSetting('brand_color') || '#8B5A2B'}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 justify-center">
                                        {/* 🌿 재가요양 케어 테마 컬러 */}
                                        {[
                                            { name: 'Warm Brown', hex: '#8B5A2B', desc: '따뜻함' },
                                            { name: 'Sage Green', hex: '#6B8E6B', desc: '안정감' },
                                            { name: 'Ocean Blue', hex: '#4A7C8E', desc: '신뢰' },
                                            { name: 'Lavender', hex: '#7B6B8E', desc: '편안함' },
                                            { name: 'Soft Gold', hex: '#D4A574', desc: '품격' },
                                            { name: 'Forest', hex: '#5D7052', desc: '자연' },
                                            { name: 'Burgundy', hex: '#8B4555', desc: '격조' },
                                            { name: 'Deep Teal', hex: '#2F5D5A', desc: '차분함' },
                                        ].map((color) => (
                                            <button
                                                key={color.hex}
                                                onClick={() => handleSave('brand_color', color.hex)}
                                                className={cn(
                                                    "group relative flex flex-col items-center gap-2 p-2 rounded-2xl transition-all hover:bg-white dark:hover:bg-slate-700",
                                                    (getSetting('brand_color') || '#8B5A2B') === color.hex && "bg-white dark:bg-slate-700 shadow-lg ring-1 ring-black/5"
                                                )}
                                            >
                                                <div
                                                    className="w-12 h-12 rounded-xl shadow-inner transition-transform group-hover:scale-110"
                                                    style={{ backgroundColor: color.hex }}
                                                />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{color.desc}</span>
                                                {(getSetting('brand_color') || '#8B5A2B') === color.hex && (
                                                    <div className="absolute -top-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow-sm">
                                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}

                                        {/* Custom Color Input */}
                                        <div className="flex flex-col items-center gap-2 p-2">
                                            <input
                                                type="color"
                                                value={getSetting('brand_color') || '#8B5A2B'}
                                                onChange={(e) => handleSave('brand_color', e.target.value)}
                                                className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none p-0 overflow-hidden"
                                            />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">CUSTOM</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                {/* 🔍 SEO Keywords */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 ml-1">SEO 키워드 (검색 최적화)</label>
                                        <p className="text-xs text-slate-400 font-medium ml-1">네이버, 구글 검색 시 노출될 주요 키워드를 쉼표(,)로 구분하여 입력하세요.</p>
                                    </div>
                                    <SaveableTextArea
                                        label="주요 키워드"
                                        placeholder="예: 재가요양, 방문요양, 요양보호사, 장기요양, 노인돌봄"
                                        initialValue={getSetting('seo_keywords')}
                                        onSave={(v) => handleSave('seo_keywords', v)}
                                        saving={saving}
                                        rows={2}
                                    />
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                {/* 🖼️ Logo Selection */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 ml-1">센터 공식 로고</label>
                                        <p className="text-xs text-slate-400 font-medium ml-1">상단 헤더와 플랫폼 내부 곳곳에 사용됩니다. (권장: 배경이 없는 PNG/WebP)</p>
                                    </div>
                                    <ImageUploader
                                        bucketName="logos"
                                        currentImage={getSetting('center_logo')}
                                        onUploadComplete={(url) => handleSave('center_logo', url)}
                                    />
                                </div>
                            </div>
                        </SectionCard>

                        {/* 🛠️ Preview Card */}
                        {/* ✨ Actual Header Structure Preview */}
                        <div className={cn(
                            "rounded-[40px] overflow-hidden shadow-2xl relative border",
                            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                        )}>
                            {/* Mini Header Preview */}
                            <div className={cn(
                                "p-6 flex items-center justify-between border-b",
                                isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-50 shadow-sm"
                            )}>
                                <div className="flex items-center gap-2">
                                    {getSetting('center_logo') ? (
                                        <img src={getSetting('center_logo')} className="h-4 w-auto" alt="Logo" />
                                    ) : (
                                        <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center text-[8px] text-white font-black">S</div>
                                    )}
                                    <span className={cn("font-black text-xs", isDark ? "text-white" : "text-slate-900")}>
                                        {getSetting('center_name') || "Silver Care"}
                                    </span>
                                </div>
                                <div className="flex gap-3 text-[9px] font-bold text-slate-400">
                                    <span>센터소개</span>
                                    <span className="text-emerald-600 border-b border-emerald-600">케어서비스</span>
                                    <span>요양보호사</span>
                                </div>
                            </div>

                            {/* Branding Element Preview */}
                            <div className="p-10 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand UI Elements</h3>
                                </div>
                                <div className="space-y-4">
                                    <button
                                        className="w-full py-4 rounded-2xl text-white font-black text-sm shadow-xl transition-all"
                                        style={{ backgroundColor: getSetting('brand_color') || '#8B5A2B' }}
                                    >
                                        브랜드 컬러 적용 버튼
                                    </button>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 flex flex-col items-center text-center">
                                            <span className="text-emerald-600 font-black text-lg mb-1">Check!</span>
                                            <span className="text-[10px] text-slate-500 font-medium">테마 강조 컬러</span>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-950 flex flex-col items-center text-center text-white">
                                            <span className="text-emerald-400 font-black text-lg mb-1">Dark</span>
                                            <span className="text-[10px] text-slate-400 font-medium">다크모드 대응</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
                }

                {/* ✨ 정보/운영 탭 통합 섹션 - 프리뷰 추가 */}
                {activeTab === 'center_info' && (
                    <div className="space-y-10">
                        {/* 🏢 센터 정보 프리뷰 (Contact Card) */}
                        {/* ✨ Actual Footer Structure Preview */}
                        <div className={cn(
                            "rounded-[40px] overflow-hidden shadow-2xl border bg-gradient-to-b",
                            isDark ? "from-slate-900 to-slate-950 border-slate-800" : "from-slate-50 to-slate-100/50 border-slate-100"
                        )}>
                            <div className="p-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left: Contact Info */}
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">센터 정보</h3>
                                        <ul className="space-y-3 text-xs">
                                            <li className="flex items-start gap-3 text-slate-500">
                                                <MapPin size={14} className="mt-0.5 shrink-0" />
                                                <span>{getSetting('center_address') || center?.address || "서울특별시 송파구 가락동 123-45"}</span>
                                            </li>
                                            <li className="flex items-center gap-3 text-slate-500 font-bold">
                                                <Phone size={14} className="shrink-0" />
                                                <span className="text-emerald-600">{getSetting('center_phone') || center?.phone || "02-123-4567"}</span>
                                            </li>
                                        </ul>
                                    </div>
                                    {/* Right: Hours */}
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">운영 시간</h3>
                                        <div className="space-y-2 text-[11px]">
                                            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                                                <span className="text-slate-500">평일</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{getSetting('weekday_hours') || "09:00 - 18:00"}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                                                <span className="text-slate-500">토요일</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{getSetting('saturday_hours') || "09:00 - 13:00"}</span>
                                            </div>
                                            <div className="flex justify-between text-rose-500 font-bold">
                                                <span>휴무</span>
                                                <span>{getSetting('holiday_text') || "일요일 및 공휴일"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center opacity-50">
                                    <span className="text-[10px] font-medium text-slate-400">&copy; 2026 {center?.name}. All rights reserved.</span>
                                    <span className="text-[10px] font-black text-slate-300">Zarada</span>
                                </div>
                            </div>
                        </div>

                        <CenterInfoSection />
                    </div>
                )}



                {/* ✨ 계정 관리 탭 */}
                {
                    activeTab === 'account' && (
                        <>
                            <SectionCard title="계정 정보" icon={<UserX className="text-rose-500" />}>
                                <div className="space-y-4">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">로그인 이메일</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{user?.email}</p>
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard title="회원 탈퇴" icon={<UserX className="text-rose-500" />}>
                                <div className="space-y-4">
                                    <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-2xl border border-rose-100 dark:border-rose-900/50">
                                        <p className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-2">⚠️ 주의: 회원 탈퇴 시 모든 데이터가 삭제됩니다.</p>
                                        <ul className="text-xs text-rose-600 dark:text-rose-400/80 space-y-1 list-disc list-inside">
                                            <li>개인정보 및 계정 정보가 삭제됩니다.</li>
                                            <li>연결된 자녀 정보와의 연결이 해제됩니다.</li>
                                            <li>이 작업은 되돌릴 수 없습니다.</li>
                                        </ul>
                                    </div>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black hover:bg-rose-700 transition-colors"
                                    >
                                        회원 탈퇴 신청
                                    </button>
                                </div>
                            </SectionCard>

                            {/* 회원 탈퇴 모달 */}
                            <AccountDeletionModal
                                isOpen={showDeleteModal}
                                onClose={() => setShowDeleteModal(false)}
                                userId={user?.id || ''}
                                userEmail={user?.email || ''}
                            />
                        </>
                    )
                }
            </div >
        </div >
    );
}

// --- ✨ [SaaS Fix] 센터 행정 및 운영시간 수정 섹션 ---
function CenterInfoSection() {
    const { center } = useCenter(); // ✨ Use Center Context
    const centerId = center?.id;
    const [info, setInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchCenter = async () => {
        if (!centerId) return;
        setLoading(true);
        try {
            const { data } = await supabase
                .from('centers')
                .select('*')
                .eq('id', centerId) // ✨ [Security] Isolation
                .maybeSingle();
            if (data) setInfo(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchCenter(); }, [centerId]);

    const handleInfoSave = async (key: string, value: string) => {
        if (!info?.id) return;
        setSaving(true);
        try {
            const finalValue = value === "" ? null : value;
            let centersUpdateSuccess = false;

            // 1. Update 'centers' table (Main Schema)
            const { error: centersError } = await supabase
                .from('centers')
                .update({ [key]: finalValue })
                .eq('id', info.id);

            if (!centersError) {
                centersUpdateSuccess = true;
            } else {
                console.warn(`Centers table update skipped/failed for ${key}:`, centersError.message);
                // Column not found (PGRST301) is expected if migration hasn't run yet
            }

            // 2. Update 'admin_settings' table (Fallback & Global Sync)
            const settingKeyMap: Record<string, string> = {
                'name': 'center_name',
                'phone': 'center_phone',
                'address': 'center_address',
                'email': 'center_email',
                'naver_map_url': 'center_map_url',
                'weekday_hours': 'center_weekday_hours',
                'saturday_hours': 'center_saturday_hours',
                'holiday_text': 'center_holiday_text'
            };

            const settingKey = settingKeyMap[key];
            if (settingKey) {
                const { error: settingsError } = await supabase.from('admin_settings').upsert({
                    center_id: info.id,
                    key: settingKey,
                    value: finalValue,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'center_id, key' });

                if (settingsError) throw settingsError;
            }

            // ✨ [Refresh UI]
            await fetchCenter();
            window.dispatchEvent(new Event('settings-updated'));

            if (centersUpdateSuccess) {
                alert('변경사항이 데이터베이스에 안전하게 저장되었습니다.');
            } else {
                alert('사이트 설정은 반영되었으나, 센터 기본 정보 동기화를 위해 마이그레이션이 필요할 수 있습니다.');
            }
        } catch (e) {
            console.error(e);
            alert('저장 중 오류가 발생했습니다: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline text-slate-300" /></div>;
    if (!info) return null;

    return (
        <div className="space-y-8 text-left">
            <SectionCard title="센터 행정 정보 (푸터/헤더 동기화)" icon={<Info className="text-blue-500" />}>
                <div className="space-y-6">
                    {/* ✨ 센터 이름 필드 명시 */}
                    <SaveableInput label="공식 센터 이름" initialValue={info.name} onSave={(v) => handleInfoSave('name', v)} saving={saving} />
                    <SaveableInput label="대표 연락처" initialValue={info.phone} onSave={(v) => handleInfoSave('phone', v)} saving={saving} />
                    <SaveableInput label="도로명 주소" initialValue={info.address} onSave={(v) => handleInfoSave('address', v)} saving={saving} />
                    <SaveableInput label="공식 이메일" initialValue={info.email} onSave={(v) => handleInfoSave('email', v)} saving={saving} />
                    <SaveableInput label="지도 공유 URL" initialValue={info.naver_map_url} onSave={(v) => handleInfoSave('naver_map_url', v)} saving={saving} />
                </div>
            </SectionCard>

            <SectionCard title="운영 시간 상세 설정" icon={<Clock className="text-emerald-500" />}>
                <div className="space-y-6 text-left">
                    {/* ✨ 평일, 주말, 휴무 필드 명시 */}
                    <SaveableInput label="평일 운영 시간" initialValue={info.weekday_hours} placeholder="예: 09:00 - 19:00" onSave={(v) => handleInfoSave('weekday_hours', v)} saving={saving} />
                    <SaveableInput label="토요일 운영 시간" initialValue={info.saturday_hours} placeholder="예: 09:00 - 16:00" onSave={(v) => handleInfoSave('saturday_hours', v)} saving={saving} />
                    <SaveableInput label="일요일/공휴일 휴무 문구" initialValue={info.holiday_text} placeholder="예: 매주 일요일 정기 휴무" onSave={(v) => handleInfoSave('holiday_text', v)} saving={saving} />
                </div>
            </SectionCard>

            {/* ✨ SNS 링크 설정 섹션 */}
            <SnsLinksSection />
        </div>
    );
}

// --- ❌ 원본 AI 블로그 버튼 및 공통 컴포넌트 로직 (수정 금지) ---


// --- ✨ SNS 링크 설정 섹션 ---
function SnsLinksSection() {
    const { getSetting, fetchSettings } = useAdminSettings();
    const { center } = useCenter(); // ✨ Get current center
    const centerId = center?.id;
    const [saving, setSaving] = useState(false);

    const handleSave = async (key: string, value: string) => {
        if (!key || !centerId) return;

        // ✨ [API Key Validation] Gemini 키 (sk- 검사 제거)
        if (key === 'openai_api_key' && value && value.startsWith('sk-')) {
            alert('⚠️ 구글 Gemini 키를 입력해주세요. (현재 OpenAI 키 형식이 입력되었습니다)');
        }

        setSaving(true);
        try {
            // ✨ [Persistence Fix] Enforce center_id
            await supabase.from('admin_settings').upsert(
                {
                    center_id: centerId,
                    key,
                    value,
                    updated_at: new Date().toISOString()
                },
                { onConflict: 'center_id, key' }
            );

            // ✨ [Sync Fix] Notify all listeners to refetch
            window.dispatchEvent(new Event('settings-updated'));

            if (fetchSettings) await fetchSettings();
            alert('저장되었습니다.');
        } catch (e) {
            alert('저장 실패');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SectionCard title="SNS 링크 (푸터 아이콘 연동)" icon={<Share2 className="text-pink-500" />}>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">입력한 URL이 있는 SNS만 푸터에 아이콘이 표시됩니다.</p>
            <div className="space-y-6">
                <SaveableInput
                    label="카카오톡 상담 URL"
                    initialValue={getSetting('kakao_url')}
                    placeholder="https://pf.kakao.com/_xxxx"
                    onSave={(v) => handleSave('kakao_url', v)}
                    saving={saving}
                />
                <SaveableInput
                    label="인스타그램 URL"
                    initialValue={getSetting('sns_instagram')}
                    placeholder="https://instagram.com/your_account"
                    onSave={(v) => handleSave('sns_instagram', v)}
                    saving={saving}
                />
                <SaveableInput
                    label="페이스북 URL"
                    initialValue={getSetting('sns_facebook')}
                    placeholder="https://facebook.com/your_page"
                    onSave={(v) => handleSave('sns_facebook', v)}
                    saving={saving}
                />
                <SaveableInput
                    label="유튜브 채널 URL"
                    initialValue={getSetting('sns_youtube')}
                    placeholder="https://youtube.com/@your_channel"
                    onSave={(v) => handleSave('sns_youtube', v)}
                    saving={saving}
                />
                <SaveableInput
                    label="블로그/네이버 블로그 URL"
                    initialValue={getSetting('sns_blog')}
                    placeholder="https://blog.naver.com/your_blog"
                    onSave={(v) => handleSave('sns_blog', v)}
                    saving={saving}
                />
            </div>
        </SectionCard>
    );
}

function HomeSettingsTab({ getSetting, handleSave, saving }) {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 text-left">
            {/* 1. Large Immersive Preview (Top) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Live Website Preview</h3>
                    </div>
                    <span className="text-[10px] font-black px-3 py-1.5 rounded-full border" style={{ color: getSetting('brand_color') || '#8B5A2B', backgroundColor: (getSetting('brand_color') || '#8B5A2B') + '10', borderColor: (getSetting('brand_color') || '#8B5A2B') + '20' }}>21:9 CINEMATIC VIEW</span>
                </div>

                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 rounded-[50px] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                    <HeroPreview
                        title={getSetting('home_title')}
                        subtitle={getSetting('home_subtitle')}
                        bgUrl={getSetting('main_banner_url')?.split(',')[0]}
                        getSetting={getSetting}
                    />
                </div>
            </div>

            {/* 2. Editor Sections (Bottom) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <SectionCard icon={<LayoutTemplate className="text-indigo-500" />} title="홈페이지 타이틀 및 설명">
                    <div className="space-y-10">
                        <SaveableTextArea
                            label="메인 타이틀 (강조 문구)"
                            initialValue={getSetting('home_title')}
                            placeholder="여러 줄로 입력하면 실제 화면에서도 줄바꿈이 적용됩니다."
                            onSave={(v) => handleSave('home_title', v)}
                            saving={saving}
                            rows={3}
                        />
                        <SaveableTextArea
                            label="서브 타이틀 (상세 설명)"
                            initialValue={getSetting('home_subtitle')}
                            placeholder="예: 부모님의 행복한 노후를 위한 정성 어린 케어 서비스를 확인하세요."
                            onSave={(v) => handleSave('home_subtitle', v)}
                            saving={saving}
                            rows={3}
                        />
                    </div>
                </SectionCard>

                <div className="space-y-8">
                    <SectionCard icon={<LayoutTemplate className="text-purple-500" />} title="배너 및 애니메이션">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">슬라이더 이미지</label>
                                <MultiImageUploader currentImages={getSetting('main_banner_url')} onUploadComplete={(url) => handleSave('main_banner_url', url)} />
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">전환 효과</label>
                                    <select
                                        value={getSetting('banner_animation') || 'fade'}
                                        onChange={(e) => handleSave('banner_animation', e.target.value)}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-700 dark:text-white"
                                    >
                                        <option value="fade">페이드 (Fade)</option>
                                        <option value="zoom">줌 (Zoom)</option>
                                        <option value="slide">슬라이드 (Slide)</option>
                                        <option value="kenburns">켄번즈 (Ken Burns)</option>
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">슬라이드 간격</label>
                                        <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded-md">{getSetting('banner_duration') || '6'}s</span>
                                    </div>
                                    <div className="pt-2">
                                        <input
                                            type="range"
                                            min="2"
                                            max="15"
                                            step="1"
                                            value={getSetting('banner_duration') || '6'}
                                            onChange={(e) => handleSave('banner_duration', e.target.value)}
                                            className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard icon={<Bell className="text-orange-500" />} title="유지보수 및 공지">
                        <SaveableTextArea
                            label="상단 알림바 공지 내용"
                            initialValue={getSetting('notice_text')}
                            placeholder="공지가 필요한 경우만 입력하세요."
                            onSave={(v) => handleSave('notice_text', v)}
                            saving={saving}
                            rows={1}
                        />
                    </SectionCard>
                </div>
            </div>
        </div>
    );
}

function SectionCard({ icon, title, children }) {
    return (
        <section
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[40px] p-10 border border-white/60 dark:border-slate-800/60 shadow-2xl shadow-slate-200/40 dark:shadow-black/40
                       transition-all duration-300 ease-out hover:shadow-indigo-500/10 text-left relative overflow-hidden group"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 mb-10 text-left">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-[22px] border border-slate-100 dark:border-slate-700 shadow-inner">
                    {icon}
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight text-left">{title}</h2>
            </div>
            {children}
        </section>
    );
}

function SaveableInput({ label, initialValue, onSave, saving, placeholder, onChange }) {
    const [value, setValue] = useState(initialValue || '');
    useEffect(() => { setValue(initialValue || ''); }, [initialValue]);
    const isChanged = value !== (initialValue || '');

    const handleChange = (e) => {
        const newVal = e.target.value;
        setValue(newVal);
        if (onChange) onChange(newVal);
    };

    return (
        <div className="w-full text-left group/input">
            <div className="flex items-center justify-between mb-3 px-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</label>
                {isChanged && <span className="text-[9px] font-black text-amber-500 uppercase animate-pulse">Unsaved Changes</span>}
            </div>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={value}
                        onChange={handleChange}
                        placeholder={placeholder}
                        className={cn(
                            "w-full py-6 px-8 bg-slate-50 dark:bg-slate-800/50 border rounded-[28px] outline-none font-bold text-lg text-slate-700 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all",
                            isChanged ? "border-amber-200 dark:border-amber-900/50 ring-4 ring-amber-500/5" : "border-slate-100 dark:border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5"
                        )}
                    />
                </div>
                <button
                    type="button"
                    onClick={() => onSave(value)}
                    disabled={!isChanged || saving}
                    className={cn(
                        "px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 active:scale-95 shadow-lg",
                        isChanged
                            ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-indigo-500/20"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-300 shadow-none cursor-not-allowed"
                    )}
                >
                    {saving ? <Loader2 className="animate-spin w-4 h-4" /> : '저장'}
                </button>
            </div>
        </div>
    );
}

function SaveableTextArea({ label, initialValue, onSave, saving, placeholder, rows = 3, onChange }) {
    const [value, setValue] = useState(initialValue || '');
    useEffect(() => { setValue(initialValue || ''); }, [initialValue]);
    const isChanged = value !== (initialValue || '');

    const handleChange = (e) => {
        const newVal = e.target.value;
        setValue(newVal);
        if (onChange) onChange(newVal);
    };

    return (
        <div className="w-full text-left group/input">
            <div className="flex items-center justify-between mb-3 px-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</label>
                {isChanged && <span className="text-[9px] font-black text-amber-500 uppercase animate-pulse">Unsaved Changes</span>}
            </div>
            <div className="space-y-3">
                <textarea
                    value={value}
                    onChange={handleChange}
                    rows={rows}
                    placeholder={placeholder}
                    className={cn(
                        "w-full p-6 bg-slate-50 dark:bg-slate-800/50 border rounded-[32px] outline-none font-bold text-lg text-slate-700 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all resize-none leading-relaxed",
                        isChanged ? "border-amber-200 dark:border-amber-900/50 ring-8 ring-amber-500/5" : "border-slate-100 dark:border-slate-800 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5"
                    )}
                />
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => onSave(value)}
                        disabled={!isChanged || saving}
                        className={cn(
                            "px-10 py-4 rounded-2xl font-black text-sm transition-all flex items-center gap-3 active:scale-95 shadow-xl",
                            isChanged
                                ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-indigo-500/20"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-300 shadow-none cursor-not-allowed"
                        )}
                    >
                        {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        {saving ? '저장 중...' : '변경사항 저장'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function HeroPreview({ title, subtitle, bgUrl, getSetting }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div
            className="relative w-full aspect-[21/9] rounded-2xl md:rounded-[50px] overflow-hidden shadow-2xl border border-white/10 bg-slate-900 group"
            style={{ containerType: 'inline-size' }}
        >
            {/* 1. Immersive Background Layer */}
            <div className="absolute inset-0">
                {bgUrl ? (
                    <img src={bgUrl} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" alt="Preview Background" />
                ) : (
                    <img
                        src="https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=2000"
                        className="w-full h-full object-cover"
                    />
                )}
                {/* Gradient Overlay matching HomePage.tsx */}
                <div className={cn(
                    "absolute inset-0",
                    isDark ? "bg-slate-950/80" : "bg-gradient-to-r from-white/95 via-white/80 to-transparent"
                )} />
            </div>

            {/* 2. Content Layer - Using cqw for relative scaling */}
            <div className="absolute inset-0 z-20 flex flex-col justify-center px-[8cqw] text-left">
                <div className="max-w-[55cqw] space-y-[2cqw] text-left">
                    {/* Badge */}
                    <span className="inline-flex items-center gap-[1cqw] px-[2.5cqw] py-[1.2cqw] rounded-full bg-emerald-100 text-emerald-700 font-bold" style={{ fontSize: '1.2cqw' }}>
                        <span className="w-[0.8cqw] h-[0.8cqw] bg-emerald-500 rounded-full animate-pulse" />
                        장기요양기관 지정 센터
                    </span>

                    {/* Main Title - Matches HomePage h1 style */}
                    <h1
                        className={cn(
                            "font-black leading-[1.2] whitespace-pre-line text-left",
                            isDark ? "text-white" : "text-slate-900"
                        )}
                        style={{
                            fontSize: '4.8cqw',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        {title || "부모님의 건강한 일상을\n함께 지켜드립니다"}
                    </h1>

                    {/* Subtitle */}
                    <p
                        className={cn(
                            "font-medium leading-relaxed whitespace-pre-line text-left",
                            isDark ? "text-slate-300" : "text-slate-600"
                        )}
                        style={{
                            fontSize: '1.6cqw',
                            opacity: 0.9
                        }}
                    >
                        {subtitle || "국가공인 요양보호사가 직접 가정을 방문하여\n어르신의 신체활동과 일상생활을 정성껏 돌봅니다."}
                    </p>

                    {/* CTA Buttons Mockup */}
                    <div className="flex gap-[1.5cqw] pt-[1cqw]">
                        <div className="px-[4cqw] py-[1.5cqw] bg-emerald-600 text-white rounded-[1.5cqw] font-bold shadow-xl" style={{ fontSize: '1.4cqw' }}>
                            📞 상담 예약
                        </div>
                        <div className={cn(
                            "px-[4cqw] py-[1.5cqw] rounded-[1.5cqw] font-bold border-2",
                            isDark ? "border-white/30 text-white" : "border-slate-300 text-slate-700"
                        )} style={{ fontSize: '1.4cqw' }}>
                            무료 상담 신청
                        </div>
                    </div>
                </div>
            </div>

            {/* Scale Indicator */}
            <div className="absolute top-[3cqw] right-[4cqw] z-30 px-[1.5cqw] py-[0.5cqw] bg-black/50 backdrop-blur-md rounded-full border border-white/20">
                <span className="text-white font-black uppercase tracking-widest" style={{ fontSize: '0.8cqw' }}>21:9 Live View</span>
            </div>
        </div>
    );
}
// --- ✨ [New] Therapist Public Profile Manager ---
function TherapistProfilesManager({ centerId }: { centerId: string }) {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        specialties: '',
        career: '',
        profile_image: '',
        website_visible: true
    });

    const fetchProfiles = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('therapists')
            .select('*')
            .eq('center_id', centerId)
            // .eq('system_status', 'active') // Show all for management, but visually distinguish
            .order('created_at', { ascending: true });
        setProfiles(data || []);
        setLoading(false);
    };

    useEffect(() => {
        if (centerId) fetchProfiles();
    }, [centerId]);

    const handleOpenModal = (profile: any = null) => {
        if (profile) {
            setEditingProfile(profile);
            setFormData({
                name: profile.name,
                bio: profile.bio || '',
                specialties: profile.specialties || '',
                career: profile.career || '',
                profile_image: profile.profile_image || '',
                website_visible: profile.website_visible
            });
        } else {
            setEditingProfile(null);
            setFormData({
                name: '',
                bio: '',
                specialties: '',
                career: '',
                profile_image: '',
                website_visible: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) return alert('이름을 입력해주세요.');

        try {
            const payload: any = {
                name: formData.name,
                bio: formData.bio,
                specialties: formData.specialties,
                career: formData.career,
                profile_image: formData.profile_image,
                website_visible: formData.website_visible,
                center_id: centerId,
                // Ensure defaults for required fields if new
                system_status: 'active',
                hire_type: 'freelancer', // Default for display profiles
                system_role: 'therapist'
            };

            if (editingProfile) {
                // Update
                const { error } = await supabase
                    .from('therapists')
                    .update(payload)
                    .eq('id', editingProfile.id);
                if (error) throw error;
            } else {
                // Insert New
                // ✨ Generate a placeholder email for "Display Only" profiles to satisfy unique constraints & separate from auth
                // Format: display+[random]@[center_slug].local
                const randomId = Math.random().toString(36).substring(2, 10);
                payload.email = `display+${randomId}@zarada.local`;

                const { error } = await supabase
                    .from('therapists')
                    .insert(payload);

                if (error) throw error;
            }

            setIsModalOpen(false);
            fetchProfiles();
            // ✨ [Sync] Notify visual components
            window.dispatchEvent(new Event('settings-updated'));
        } catch (error: any) {
            console.error(error);
            alert('저장 실패: ' + error.message);
        }
    };

    const handleDelete = async (id: string, isRealUser: boolean) => {
        if (!confirm(isRealUser
            ? '⚠️ 이 프로필은 실제 직원 계정과 연결되어 있을 수 있습니다.\n삭제 시 급여/일정 데이터에 영향이 갈 수 있습니다.\n정말 삭제하시겠습니까? (권장: "숨김" 처리)'
            : '정말 삭제하시겠습니까?')) return;

        try {
            const { error } = await supabase.from('therapists').delete().eq('id', id);
            if (error) throw error;
            fetchProfiles();
        } catch (error) {
            alert('삭제 실패. 데이터가 연결되어 있을 수 있습니다. 대신 숨김 처리를 권장합니다.');
        }
    };

    const toggleVisibility = async (profile: any) => {
        const newValue = !profile.website_visible;
        try {
            await supabase.from('therapists').update({ website_visible: newValue }).eq('id', profile.id);
            // Optimistic update
            setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, website_visible: newValue } : p));
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="text-center py-10"><Loader2 className="animate-spin inline text-slate-300" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white">요양보호사 목록</h3>
                    <p className="text-xs text-slate-500 font-medium">홈페이지 '요양보호사 소개' 란에 표시될 프로필을 관리합니다.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" /> 프로필 추가
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profiles.map(profile => {
                    const isDisplayOnly = profile.email?.includes('@zarada.local');
                    return (
                        <div key={profile.id} className={cn(
                            "flex gap-4 p-4 rounded-3xl border transition-all group relative overflow-hidden",
                            profile.website_visible
                                ? "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm"
                                : "bg-slate-50 dark:bg-slate-900 border-slate-100 opacity-60"
                        )}>
                            <div className="w-20 h-24 shrink-0 bg-slate-100 rounded-2xl overflow-hidden relative">
                                {profile.profile_image ? (
                                    <img src={profile.profile_image} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300"><Globe className="w-8 h-8" /></div>
                                )}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-black text-slate-900 dark:text-white truncate">{profile.name}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                                            {isDisplayOnly ? 'Display Profile' : 'System User'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => toggleVisibility(profile)}
                                        className={cn("p-1.5 rounded-lg transition-colors", profile.website_visible ? "bg-emerald-50 text-emerald-600" : "bg-slate-200 text-slate-500")}
                                        title="홈페이지 노출 여부"
                                    >
                                        {profile.website_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                                <div className="mt-auto flex gap-2">
                                    <button onClick={() => handleOpenModal(profile)} className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600">수정</button>
                                    <button onClick={() => handleDelete(profile.id, !isDisplayOnly)} className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg hover:bg-rose-100">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl p-8 rounded-[40px] shadow-2xl relative max-h-[90vh] flex flex-col">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 shrink-0">
                            {editingProfile ? '프로필 수정' : '새 프로필 등록'}
                        </h2>

                        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">이름</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="표시될 이름"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">프로필 이미지</label>
                                <div className="flex gap-2">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                                        {formData.profile_image && <img src={formData.profile_image} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1">
                                        <ImageUploader
                                            bucketName="profiles"
                                            currentImage={formData.profile_image}
                                            onUploadComplete={url => setFormData({ ...formData, profile_image: url })}
                                            label=""
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">한줄 소개 (Bio)</label>
                                <input
                                    type="text"
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="예: 부모님을 모시는 정성 어린 마음으로 돌보겠습니다."
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">전문 분야 (쉼표로 구분)</label>
                                <input
                                    type="text"
                                    value={formData.specialties}
                                    onChange={e => setFormData({ ...formData, specialties: e.target.value })}
                                    placeholder="방문요양, 치매케어, 목욕보조"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">상세 약력 (줄바꿈 구분)</label>
                                <textarea
                                    value={formData.career}
                                    onChange={e => setFormData({ ...formData, career: e.target.value })}
                                    rows={4}
                                    placeholder="- OO대학교 졸업&#13;&#10;- OO센터 근무"
                                    className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-sm text-slate-700 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all resize-none leading-relaxed focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                <span className="font-bold text-sm text-slate-700 dark:text-slate-300">홈페이지 노출</span>
                                <button
                                    onClick={() => setFormData({ ...formData, website_visible: !formData.website_visible })}
                                    className={cn("w-12 h-6 rounded-full transition-colors relative", formData.website_visible ? "bg-indigo-500" : "bg-slate-300")}
                                >
                                    <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", formData.website_visible ? "left-7" : "left-1")} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3 shrink-0">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-2xl hover:bg-slate-200">취소</button>
                            <button onClick={handleSave} className="flex-1 py-4 bg-slate-900 dark:bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-transform">저장하기</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
