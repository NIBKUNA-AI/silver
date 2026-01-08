import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Eye, FileText, CheckCircle, Clock } from 'lucide-react';
import type { Database } from '@/types/database.types';

type BlogPost = Database['public']['Tables']['blog_posts']['Row'];

export default function BlogList() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('blog_posts')
            .select('id, title, slug, is_published, published_at, view_count, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching posts:', error);
        } else {
            setPosts(data || []);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;

        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', id);

        if (error) {
            alert('삭제 실패: ' + error.message);
        } else {
            setPosts(prev => prev.filter(p => p.id !== id));
        }
    };

    const togglePublish = async (id: string, currentStatus: boolean) => {
        const { error } = await (supabase
            .from('blog_posts') as any)
            .update({
                is_published: !currentStatus,
                published_at: !currentStatus ? new Date().toISOString() : null
            })
            .eq('id', id);

        if (!error) {
            fetchPosts();
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        블로그 관리
                        <span className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">New</span>
                    </h1>
                    <p className="text-slate-500 font-bold mt-2">SEO 최적화된 콘텐츠를 작성하고 관리하세요.</p>
                </div>
                <button
                    onClick={() => navigate('/app/blog/new')}
                    className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> 새 글 작성
                </button>
            </header>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                {posts.length === 0 ? (
                    <div className="p-20 text-center">
                        <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-400">등록된 게시글이 없습니다.</h3>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-6">제목 / URL</th>
                                    <th className="p-6">상태</th>
                                    <th className="p-6">조회수</th>
                                    <th className="p-6">작성일</th>
                                    <th className="p-6 text-right">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {posts.map(post => (
                                    <tr key={post.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-6">
                                            <div className="font-black text-slate-900 text-lg mb-1">{post.title}</div>
                                            <div className="text-xs font-medium text-slate-400 font-mono">/{post.slug}</div>
                                        </td>
                                        <td className="p-6">
                                            <button
                                                onClick={() => togglePublish(post.id, post.is_published ?? false)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${post.is_published
                                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                    }`}
                                            >
                                                {post.is_published ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                                {post.is_published ? '발행됨' : '임시저장'}
                                            </button>
                                        </td>
                                        <td className="p-6 font-bold text-slate-600">
                                            {(post.view_count || 0).toLocaleString()}
                                        </td>
                                        <td className="p-6 text-sm font-medium text-slate-400">
                                            {post.created_at ? new Date(post.created_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                    title="보기"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/app/blog/${post.id}`)}
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                                    title="수정"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(post.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                    title="삭제"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
