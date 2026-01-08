import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAdminSettings } from '@/hooks/useAdminSettings';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    cover_image_url: string | null;
    published_at: string | null;
}

export function BlogPage() {
    const { getSetting } = useAdminSettings();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        const { data, error } = await (supabase as any)
            .from('blog_posts')
            .select('id, title, slug, excerpt, cover_image_url, published_at')
            .eq('is_published', true)
            .order('published_at', { ascending: false });

        if (error) {
            console.error('Error fetching blog posts:', error);
        } else {
            setPosts(data || []);
        }
        setLoading(false);
    };

    const centerName = getSetting('center_name') || 'Center Blog';

    return (
        <div className="bg-white min-h-screen pb-24 font-sans text-slate-900">
            <Helmet>
                <title>Blog | {centerName}</title>
                <meta name="description" content="Professional insights for your child's growth." />
            </Helmet>

            {/* Spacious Centered Header */}
            <header className="pt-32 pb-20 px-6 text-center max-w-4xl mx-auto">
                <p className="text-indigo-600 font-bold tracking-widest text-sm mb-4">
                    아이와 함께 성장하는 이야기
                </p>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
                    마음 성장 칼럼
                </h1>
                <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed break-keep">
                    우리 아이의 건강한 발달을 위한 전문가들의 따뜻한 조언
                </p>
            </header>

            {/* Magazine Grid Layout */}
            <main className="max-w-7xl mx-auto px-6">
                {loading ? (
                    <div className="text-center py-32">
                        <p className="text-xl text-slate-400 font-medium animate-pulse">칼럼을 불러오는 중입니다...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-32 border-t border-slate-100">
                        <p className="text-xl font-bold text-slate-400">아직 등록된 칼럼이 없습니다.</p>
                        <p className="text-slate-400 mt-2">조금만 기다려주세요, 알찬 내용을 준비 중입니다.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14">
                        {posts.map((post) => (
                            <Link
                                key={post.id}
                                to={`/blog/${post.slug}`}
                                className="group block h-full flex flex-col"
                            >
                                {/* Thumbnail: 16:9 Aspect Ratio */}
                                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100 mb-6 shadow-sm group-hover:shadow-lg transition-all duration-300 ease-out">
                                    {post.cover_image_url ? (
                                        <img
                                            src={post.cover_image_url}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300 font-black text-2xl tracking-tight">
                                            NO IMAGE
                                        </div>
                                    )}
                                    {/* Overlay on hover */}
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col">
                                    {/* Minimal Date */}
                                    <div className="text-xs font-bold text-slate-400 tracking-wide uppercase mb-3">
                                        {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                                    </div>

                                    {/* Bold Title */}
                                    <h2 className="text-2xl font-black text-slate-900 leading-tight mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors duration-300">
                                        {post.title}
                                    </h2>

                                    {/* Excerpt */}
                                    <p className="text-slate-500 font-medium leading-relaxed line-clamp-3 text-base flex-1">
                                        {post.excerpt}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
