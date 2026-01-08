import { Helmet } from 'react-helmet-async';
import { Award, Heart, Users, Clock } from 'lucide-react';
import { useAdminSettings } from '@/hooks/useAdminSettings';

export function AboutPage() {
    const { getSetting } = useAdminSettings();

    const introText = getSetting('about_intro_text') || "아이는 믿는 만큼 자라고, 사랑받는 만큼 행복해집니다.\n행복아동발달센터는 아이들의 건강한 성장을 위해 진심을 다합니다.";
    const mainImage = getSetting('about_main_image');
    const descTitle = getSetting('about_desc_title') || "따뜻한 시선으로\n아이의 잠재력을 발굴합니다";
    const descBody = getSetting('about_desc_body') || "행복아동발달센터는 각 분야별 석/박사 출신의 전문 치료진들이 협력하여 아동 개개인에게 최적화된 맞춤 치료 프로그램을 제공합니다.\n\n단순히 증상을 개선하는 것을 넘어, 아이가 스스로 긍정적인 자아를 형성하고 세상과 소통하며 행복하게 살아갈 수 있도록 돕는 것이 우리의 목표입니다.";

    return (
        <>
            <Helmet>
                <title>센터 소개 - 행복아동발달센터</title>
                <meta name="description" content="따뜻한 마음과 전문성을 갖춘 행복아동발달센터의 치료진을 소개합니다." />
            </Helmet>

            <div className="bg-orange-50/50 py-12 md:py-20">
                <div className="container mx-auto px-4 md:px-6 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">
                        센터 소개
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-slate-600 leading-relaxed whitespace-pre-line">
                        {introText}
                    </p>
                </div>
            </div>

            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid gap-12 lg:grid-cols-2 items-center">
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 shadow-lg group">
                            {mainImage ? (
                                <img src={mainImage} alt="Center View" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                    센터 전경 이미지
                                </div>
                            )}
                        </div>
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-slate-900 whitespace-pre-line">
                                {descTitle}
                            </h2>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                                {descBody}
                            </p>
                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="flex items-center gap-2 text-slate-700 font-medium">
                                    <Award className="w-5 h-5 text-primary" />
                                    <span>검증된 전문성</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-700 font-medium">
                                    <Heart className="w-5 h-5 text-primary" />
                                    <span>진정성 있는 치료</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-700 font-medium">
                                    <Users className="w-5 h-5 text-primary" />
                                    <span>체계적인 협진</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-700 font-medium">
                                    <Clock className="w-5 h-5 text-primary" />
                                    <span>충분한 상담</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
