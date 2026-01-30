// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Silver Care - Document List Page
 * 전자 서류 목록 및 관리 페이지
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCenter } from '@/contexts/CenterContext';
import { Link, useNavigate } from 'react-router-dom';
import {
    FileText, Plus, Clock, CheckCircle2, AlertCircle, Archive,
    User, Calendar, Search, Filter, ChevronRight, Loader2
} from 'lucide-react';

// Document Type Labels
const DOC_TYPES = {
    contract: { label: '표준약관', icon: FileText, color: 'blue' },
    care_plan: { label: '급여제공계획서', icon: FileText, color: 'emerald' },
    privacy_consent: { label: '개인정보동의서', icon: FileText, color: 'purple' },
    abuse_prevention: { label: '노인학대예방 서약서', icon: FileText, color: 'amber' },
    needs_assessment: { label: '욕구사정기록지', icon: FileText, color: 'rose' },
};

const STATUS_CONFIG = {
    draft: { label: '작성중', icon: Clock, color: 'slate' },
    pending_signature: { label: '서명대기', icon: AlertCircle, color: 'amber' },
    signed: { label: '서명완료', icon: CheckCircle2, color: 'emerald' },
    expired: { label: '만료', icon: AlertCircle, color: 'rose' },
    archived: { label: '보관', icon: Archive, color: 'slate' },
};

export function DocumentList() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { center } = useCenter();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [documents, setDocuments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        if (!center?.id) return;
        fetchDocuments();
    }, [center]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('electronic_documents')
                .select(`*, children(name)`)
                .eq('center_id', center.id)
                .order('created_at', { ascending: false });

            if (!error) setDocuments(data || []);
        } finally {
            setLoading(false);
        }
    };

    const filteredDocs = documents.filter(doc => {
        if (filterType !== 'all' && doc.type !== filterType) return false;
        if (filterStatus !== 'all' && doc.status !== filterStatus) return false;
        if (searchTerm) {
            const recipientName = doc.children?.name || '';
            const title = doc.title || '';
            if (!recipientName.includes(searchTerm) && !title.includes(searchTerm)) return false;
        }
        return true;
    });

    const handleNewDocument = () => {
        // TODO: Navigate to document editor with blank form
        alert('새 문서 작성 기능은 추후 구현됩니다.');
    };

    return (
        <div className={cn("p-8 space-y-6 min-h-screen transition-colors", isDark ? "bg-slate-950" : "bg-slate-50")}>
            <Helmet><title>전자 서류 - 이지케어</title></Helmet>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={cn("text-3xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>전자 서류</h1>
                    <p className={cn("text-sm mt-1", isDark ? "text-slate-500" : "text-slate-400")}>표준약관, 개인정보동의서, 급여제공계획서 등</p>
                </div>
                <button
                    onClick={handleNewDocument}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95",
                        isDark ? "bg-indigo-600 text-white hover:bg-indigo-500" : "bg-slate-900 text-white hover:bg-blue-600"
                    )}
                >
                    <Plus className="w-5 h-5" /> 새 문서 작성
                </button>
            </div>

            {/* Filters */}
            <div className={cn("rounded-2xl border p-4 flex flex-wrap gap-4 items-center", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className={cn("absolute left-3 top-3 w-5 h-5", isDark ? "text-slate-500" : "text-slate-400")} />
                    <input
                        type="text"
                        placeholder="수급자 또는 문서명 검색..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className={cn(
                            "w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all",
                            isDark ? "bg-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500" : "bg-slate-50 focus:ring-2 focus:ring-blue-100"
                        )}
                    />
                </div>

                {/* Type Filter */}
                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className={cn(
                        "px-4 py-2.5 rounded-xl text-sm font-bold outline-none",
                        isDark ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-900"
                    )}
                >
                    <option value="all">모든 유형</option>
                    {Object.entries(DOC_TYPES).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>

                {/* Status Filter */}
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className={cn(
                        "px-4 py-2.5 rounded-xl text-sm font-bold outline-none",
                        isDark ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-900"
                    )}
                >
                    <option value="all">모든 상태</option>
                    {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
            </div>

            {/* Document List */}
            <div className={cn("rounded-[32px] border shadow-xl overflow-hidden", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
                {loading ? (
                    <div className="p-20 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className={cn("p-20 text-center", isDark ? "text-slate-500" : "text-slate-400")}>
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="font-bold text-lg">등록된 전자 서류가 없습니다.</p>
                        <p className="text-sm mt-1">새 문서를 작성하여 시작하세요.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredDocs.map(doc => {
                            const typeConfig = DOC_TYPES[doc.type] || DOC_TYPES.contract;
                            const statusConfig = STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;
                            const TypeIcon = typeConfig.icon;
                            const StatusIcon = statusConfig.icon;

                            return (
                                <div
                                    key={doc.id}
                                    className={cn(
                                        "p-6 flex items-center gap-6 cursor-pointer transition-all group",
                                        isDark ? "hover:bg-slate-800/50" : "hover:bg-blue-50/30"
                                    )}
                                    onClick={() => navigate(`/app/documents/${doc.id}`)}
                                >
                                    {/* Icon */}
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                                        `bg-${typeConfig.color}-50 text-${typeConfig.color}-600`,
                                        isDark && `bg-${typeConfig.color}-900/30 text-${typeConfig.color}-400`
                                    )}>
                                        <TypeIcon className="w-7 h-7" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("font-bold text-lg truncate", isDark ? "text-white" : "text-slate-900")}>
                                            {doc.title || typeConfig.label}
                                        </p>
                                        <div className="flex items-center gap-4 mt-1">
                                            {doc.children?.name && (
                                                <span className={cn("text-sm flex items-center gap-1", isDark ? "text-slate-400" : "text-slate-500")}>
                                                    <User className="w-4 h-4" /> {doc.children.name}
                                                </span>
                                            )}
                                            <span className={cn("text-sm flex items-center gap-1", isDark ? "text-slate-500" : "text-slate-400")}>
                                                <Calendar className="w-4 h-4" /> {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className={cn(
                                        "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0",
                                        `bg-${statusConfig.color}-50 text-${statusConfig.color}-600`,
                                        isDark && `bg-${statusConfig.color}-900/30 text-${statusConfig.color}-400`
                                    )}>
                                        <StatusIcon className="w-4 h-4" />
                                        {statusConfig.label}
                                    </div>

                                    {/* Arrow */}
                                    <ChevronRight className={cn("w-6 h-6 shrink-0 transition-transform group-hover:translate-x-1", isDark ? "text-slate-600" : "text-slate-300")} />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
