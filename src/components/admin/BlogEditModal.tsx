
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { ImageUploader } from '@/components/common/ImageUploader';

interface BlogEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: {
        id: string;
        title: string;
        content: string;
        cover_image_url: string | null;
        excerpt: string | null;
    };
    onUpdate: () => void;
}

export function BlogEditModal({ isOpen, onClose, post, onUpdate }: BlogEditModalProps) {
    const [title, setTitle] = useState(post.title);
    const [content, setContent] = useState(post.content);
    const [excerpt, setExcerpt] = useState(post.excerpt || '');
    const [coverImage, setCoverImage] = useState(post.cover_image_url);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle(post.title);
            setContent(post.content);
            setExcerpt(post.excerpt || '');
            setCoverImage(post.cover_image_url);
        }
    }, [isOpen, post]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await (supabase as any)
                .from('blog_posts')
                .update({
                    title,
                    content,
                    excerpt,
                    cover_image_url: coverImage,
                    updated_at: new Date().toISOString()
                })
                .eq('id', post.id);

            if (error) throw error;

            onUpdate();
            onClose();
            alert('블로그 글이 수정되었습니다.');
        } catch (error) {
            console.error('Error updating post:', error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        블로그 글 수정
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500">제목</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full text-xl font-bold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* Cover Image */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> 커버 이미지
                        </label>
                        <div className="flex gap-4 items-start">
                            {coverImage && (
                                <img src={coverImage} alt="Cover" className="w-32 h-20 object-cover rounded-lg border border-slate-200" />
                            )}
                            <div className="flex-1">
                                <ImageUploader
                                    currentImage={coverImage}
                                    onUploadComplete={setCoverImage}
                                    label="이미지 변경"
                                    bucketName="images"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Excerpt */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500">핵심 요약 (오늘의 핵심 요약)</label>
                        <textarea
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                        />
                    </div>

                    {/* Content (HTML) - Simple Textarea for now but ideally WYSIWYG */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500">본문 (HTML)</label>
                        <div className="bg-yellow-50 p-4 rounded-xl text-xs text-yellow-700 mb-2">
                            <b>주의:</b> HTML 태그를 직접 수정할 수 있습니다. `&lt;h2&gt;`, `&lt;p&gt;` 등의 태그를 유지해주세요.
                        </div>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={15}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            spellCheck={false}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-3xl">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        저장하기
                    </button>
                </div>
            </div>
        </div>
    );
}
