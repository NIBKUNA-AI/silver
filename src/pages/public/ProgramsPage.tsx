import { Helmet } from 'react-helmet-async';
import { useAdminSettings } from '@/hooks/useAdminSettings';

import { PROGRAM_ICONS } from '@/constants/programIcons';
import { DEFAULT_PROGRAMS } from '@/constants/defaultPrograms';

export function ProgramsPage() {
    const { getSetting } = useAdminSettings();
    const introText = getSetting('programs_intro_text') || "아이의 고유한 특성을 존중하며,\n단계별 1:1 맞춤형 솔루션을 제공합니다.";

    const programsJson = getSetting('programs_list');
    const dynamicPrograms = programsJson ? JSON.parse(programsJson) : [];

    const programs = dynamicPrograms.length > 0 ? dynamicPrograms : DEFAULT_PROGRAMS;

    return (
        <>
            <Helmet>
                <title>치료 프로그램 - 행복아동발달센터</title>
                <meta name="description" content="언어치료, 놀이치료, 감각통합치료 등 전문적인 발달 지원 프로그램을 안내합니다." />
            </Helmet>

            <div className="bg-orange-50/50 py-12 md:py-20">
                <div className="container mx-auto px-4 md:px-6 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">
                        프로그램 안내
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-slate-600 leading-relaxed whitespace-pre-line">
                        {introText}
                    </p>
                </div>
            </div>

            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {programs.map((program: any) => {
                            const Icon = PROGRAM_ICONS[program.icon_name] || PROGRAM_ICONS['MessageCircle'];
                            return (
                                <div key={program.title} className="bg-white rounded-xl border p-8 hover:shadow-lg transition-all hover:-translate-y-1">
                                    <div className="mb-6 bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center">
                                        <Icon className="w-10 h-10 text-slate-900" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-1">{program.title}</h3>
                                    <p className="text-sm text-slate-500 mb-4">{program.eng}</p>
                                    <p className="text-slate-600 text-sm leading-relaxed mb-6 min-h-[80px]">
                                        {program.desc}
                                    </p>
                                    <div className="bg-slate-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-sm mb-2 text-slate-800">추천 대상</h4>
                                        <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                                            {program.targets.map((target: string, idx: number) => (
                                                <li key={idx}>{target}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </>
    );
}
