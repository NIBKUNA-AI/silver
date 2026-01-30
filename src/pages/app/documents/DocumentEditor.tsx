// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Silver Care - Document Editor
 * 전자 서류 작성 및 서명 컴포넌트
 */
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCenter } from '@/contexts/CenterContext';
import { useNavigate, useParams } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
    ArrowLeft, Save, Printer, Eraser, User, Calendar, FileText, CheckCircle2
} from 'lucide-react';

const DOC_TYPES = {
    contract: { label: '표준약관 (장기요양급여 계약서)', sections: ['contract_term', 'service_cost', 'rights_duties'] },
    care_plan: { label: '급여제공계획서', sections: ['goals', 'service_content', 'schedule'] },
    privacy_consent: { label: '개인정보 수집·이용 동의서', sections: ['purpose', 'items', 'retention'] },
    abuse_prevention: { label: '노인학대 예방 서약서', sections: ['pledge'] },
    needs_assessment: { label: '욕구사정기록지', sections: ['physical', 'cognitive', 'nursing'] },
};

export function DocumentEditor() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { center } = useCenter();
    const navigate = useNavigate();
    const { id, type } = useParams(); // id might be 'new'

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [docData, setDocData] = useState({
        type: type || 'contract',
        title: '',
        recipient_id: '',
        content: {},
        signatures: []
    });
    const [recipients, setRecipients] = useState([]);
    const signPadRef = useRef(null);

    // Initial Load
    useEffect(() => {
        if (!center?.id) return;
        fetchRecipients();
        if (id && id !== 'new') {
            fetchDocument(id);
        } else {
            setDocData(prev => ({
                ...prev,
                type: type || 'contract',
                title: DOC_TYPES[type || 'contract'].label
            }));
        }
    }, [center, id, type]);

    const fetchRecipients = async () => {
        const { data } = await supabase
            .from('children')
            .select('id, name, birth_date')
            .eq('center_id', center.id)
            .eq('status', 'attending');
        setRecipients(data || []);
    };

    const fetchDocument = async (docId) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('electronic_documents')
            .select('*')
            .eq('id', docId)
            .single();

        if (data) {
            setDocData(data);
            // Load signature if exists (Wait, canvas can't easily import base64 lines back to editable path, 
            // usually we just display the image if signed. For now, assume re-sign or view mode)
        }
        setLoading(false);
    };

    const handleSave = async (status = 'draft') => {
        if (!docData.recipient_id) {
            alert('대상 수급자를 선택해주세요.');
            return;
        }

        setSaving(true);
        try {
            // Capture Signature if not empty
            let sigs = docData.signatures || [];
            if (signPadRef.current && !signPadRef.current.isEmpty()) {
                const sigDataUrl = signPadRef.current.getTrimmedCanvas().toDataURL('image/png');
                // Check if guardian signature already exists, replace or add
                const existingIdx = sigs.findIndex(s => s.role === 'guardian');
                const newSig = {
                    role: 'guardian',
                    name: '보호자/수급자',
                    signature_url: sigDataUrl,
                    signed_at: new Date().toISOString()
                };

                if (existingIdx >= 0) sigs[existingIdx] = newSig;
                else sigs.push(newSig);
            }

            const payload = {
                center_id: center.id,
                recipient_id: docData.recipient_id,
                type: docData.type,
                title: docData.title,
                content: docData.content,
                signatures: sigs,
                status: status,
                updated_at: new Date().toISOString()
            };

            let result;
            if (id && id !== 'new') {
                result = await supabase.from('electronic_documents').update(payload).eq('id', id).select().single();
            } else {
                result = await supabase.from('electronic_documents').insert(payload).select().single();
            }

            if (result.error) throw result.error;

            alert('저장되었습니다.');
            if (!id || id === 'new') {
                navigate(`/app/documents/${result.data.id}`, { replace: true });
            }
        } catch (e) {
            console.error(e);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = async () => {
        const input = document.getElementById('print-area');
        if (!input) return;

        try {
            const canvas = await html2canvas(input, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${docData.title}_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (e) {
            console.error(e);
            alert('PDF 생성 실패');
        }
    };

    const clearSignature = () => {
        if (signPadRef.current) signPadRef.current.clear();
    };

    if (loading) return <div className="p-20 text-center">Loading...</div>;

    const recipient = recipients.find(r => r.id === docData.recipient_id);

    return (
        <div className={cn("min-h-screen transition-colors p-4 md:p-8", isDark ? "bg-slate-950" : "bg-slate-50")}>
            <Helmet><title>문서 편집 - 이지케어</title></Helmet>

            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 sticky top-0 z-10 p-4 rounded-2xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/app/documents')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft className={isDark ? "text-white" : "text-slate-900"} />
                    </button>
                    <div>
                        <h1 className={cn("text-xl font-black", isDark ? "text-white" : "text-slate-900")}>
                            {DOC_TYPES[docData.type]?.label || '문서 편집'}
                        </h1>
                        <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
                            {id === 'new' ? '새 문서 작성' : '문서 수정 중'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                        <Printer className="w-4 h-4" /> 출력/PDF
                    </button>
                    <button
                        onClick={() => handleSave('signed')}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? '저장 중...' : <><Save className="w-4 h-4" /> 저장</>}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {/* Left: Input Form */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Recipient Selector */}
                    <div className={cn("p-6 rounded-3xl border shadow-sm", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
                        <h3 className={cn("text-sm font-bold flex items-center gap-2 mb-4", isDark ? "text-slate-400" : "text-slate-500")}>
                            <User className="w-4 h-4" /> 수급자 선택
                        </h3>
                        <select
                            value={docData.recipient_id}
                            onChange={(e) => setDocData({ ...docData, recipient_id: e.target.value })}
                            className={cn("w-full p-3 rounded-xl font-bold outline-none border transition-all", isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500")}
                        >
                            <option value="">수급자를 선택하세요</option>
                            {recipients.map(r => (
                                <option key={r.id} value={r.id}>{r.name} ({r.birth_date})</option>
                            ))}
                        </select>
                    </div>

                    {/* Meta Input */}
                    <div className={cn("p-6 rounded-3xl border shadow-sm", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
                        <h3 className={cn("text-sm font-bold flex items-center gap-2 mb-4", isDark ? "text-slate-400" : "text-slate-500")}>
                            <FileText className="w-4 h-4" /> 기본 정보
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 mb-1 block">문서 제목</label>
                                <input
                                    type="text"
                                    value={docData.title}
                                    onChange={(e) => setDocData({ ...docData, title: e.target.value })}
                                    className={cn("w-full p-3 rounded-xl text-sm font-bold outline-none border", isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200")}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 mb-1 block">계약/작성일</label>
                                <input
                                    type="date"
                                    value={docData.content?.date || new Date().toISOString().slice(0, 10)}
                                    onChange={(e) => setDocData({ ...docData, content: { ...docData.content, date: e.target.value } })}
                                    className={cn("w-full p-3 rounded-xl text-sm font-bold outline-none border", isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200")}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Preview & Signature */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Paper Preview Start */}
                    <div id="print-area" className="bg-white text-black p-10 min-h-[800px] shadow-2xl mx-auto max-w-[210mm] relative" style={{ fontFamily: 'Pretendard, sans-serif' }}>
                        {/* Paper Content */}
                        <div className="text-center mb-12 border-b-2 border-black pb-8">
                            <h1 className="text-3xl font-black mb-4">{docData.title}</h1>
                            <p className="text-sm text-gray-500">본 문서는 전자적으로 작성 및 서명되었습니다.</p>
                        </div>

                        <div className="space-y-8 mb-16">
                            {/* Standard Clauses Example */}
                            <div className="space-y-2">
                                <h3 className="font-bold text-lg border-l-4 border-black pl-3">제 1 조 (목적)</h3>
                                <p className="text-sm leading-relaxed text-gray-700">
                                    본 계약은 장기요양기관 <b>{center?.name || '(기관명)'}</b>(이하 "갑")과 수급자 <b>{recipient?.name || '(수급자명)'}</b>(이하 "을") 간의 장기요양급여 이용에 관한 제반 사항을 규정함을 목적으로 한다.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-lg border-l-4 border-black pl-3">제 2 조 (계약기간)</h3>
                                <p className="text-sm leading-relaxed text-gray-700">
                                    계약 기간은 <b>{docData.content?.possibleStart || '2024-01-01'}</b> 부터 <b>{docData.content?.possibleEnd || '2024-12-31'}</b> 까지로 한다.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-lg border-l-4 border-black pl-3">제 3 조 (급여의 종류 및 비용)</h3>
                                <p className="text-sm leading-relaxed text-gray-700">
                                    "갑"은 "을"에게 <b>방문요양</b> 서비스를 제공하며, 비용은 장기요양급여 수가 기준에 따른다.
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 border rounded-lg text-sm text-gray-500 mt-8">
                                <p>※ 본 문서는 예시 서식이며, 실제 법적 효력을 위해서는 각 조항의 세부 내용을 정확히 기재해야 합니다.</p>
                            </div>
                        </div>

                        {/* Signature Section */}
                        <div className="grid grid-cols-2 gap-8 mt-20 pt-10 border-t border-dashed border-gray-300">
                            {/* Agency Signature */}
                            <div className="space-y-4">
                                <p className="font-bold text-sm text-gray-500 uppercase">기관장 (갑)</p>
                                <div className="h-32 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center relative bg-gray-50">
                                    <span className="text-2xl font-black text-gray-300 select-none">서명/직인</span>
                                    {/* Usually pre-stamped or signed by admin separately */}
                                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">{center?.name} 대표</div>
                                </div>
                            </div>

                            {/* Recipient/Guardian Signature */}
                            <div className="space-y-4">
                                <p className="font-bold text-sm text-gray-500 uppercase">수급자/보호자 (을)</p>
                                <div className="relative h-32 border-2 border-gray-300 rounded-xl overflow-hidden bg-white">
                                    {/* Show saved signature if exists, else show canvas */}
                                    {docData.signatures?.find(s => s.role === 'guardian') ? (
                                        <img
                                            src={docData.signatures.find(s => s.role === 'guardian').signature_url}
                                            alt="서명"
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full relative group">
                                            <SignatureCanvas
                                                ref={signPadRef}
                                                canvasProps={{ className: 'w-full h-full cursor-draw' }}
                                            />
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={clearSignature} className="p-1 bg-gray-100 rounded hover:bg-red-100 hover:text-red-500" title="지우기">
                                                    <Eraser className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="absolute bottom-2 left-0 w-full text-center pointer-events-none">
                                                <span className="text-[10px] text-gray-300">이곳에 서명하세요</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-right text-xs text-gray-500">
                                    서명일: {new Date().toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Paper Preview End */}
                </div>
            </div>
        </div>
    );
}
