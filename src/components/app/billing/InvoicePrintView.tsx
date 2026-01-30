// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Silver Care - Invoice Print View
 * 청구서 출력용 컴포넌트
 */
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InvoicePrintViewProps {
    recipientName: string;
    recipientGrade?: string | number;
    careNumber?: string; // 장기요양인정번호
    guardianName?: string;
    month: string; // YYYY-MM format
    sessions: Array<{
        date: string;
        serviceName: string;
        duration: number;
        price: number;
        status?: string;
    }>;
    totalFee: number;
    copayRate: number; // 15, 9, 6, 0
    alreadyPaid: number;
    centerName?: string;
    centerAddress?: string;
    centerPhone?: string;
}

export const InvoicePrintView = forwardRef<HTMLDivElement, InvoicePrintViewProps>(
    ({
        recipientName,
        recipientGrade,
        careNumber,
        guardianName,
        month,
        sessions,
        totalFee,
        copayRate,
        alreadyPaid,
        centerName = '이지케어 요양센터',
        centerAddress,
        centerPhone,
    }, ref) => {
        const [year, monthNum] = month.split('-');
        const copay = Math.floor(totalFee * (copayRate / 100));
        const governmentPay = totalFee - copay;
        const balance = copay - alreadyPaid;
        const completedSessions = sessions.filter(s => s.status === 'completed');

        return (
            <div ref={ref} className="p-8 bg-white text-slate-900 min-w-[700px] max-w-[800px] mx-auto print:p-0 print:shadow-none" style={{ fontFamily: 'Pretendard, Malgun Gothic, sans-serif' }}>
                {/* Header */}
                <div className="text-center border-b-4 border-slate-900 pb-6 mb-8">
                    <h1 className="text-3xl font-black tracking-tight mb-2">본인부담금 청구서</h1>
                    <p className="text-slate-500 text-sm">{year}년 {parseInt(monthNum)}월 장기요양 급여 이용 내역</p>
                </div>

                {/* Recipient Info */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="space-y-2">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">수급자 정보</h2>
                        <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                            <span className="text-slate-500">성함</span>
                            <span className="font-bold">{recipientName}</span>
                        </div>
                        {recipientGrade && (
                            <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                                <span className="text-slate-500">장기요양등급</span>
                                <span className="font-bold">{typeof recipientGrade === 'string' ? recipientGrade : `${recipientGrade}등급`}</span>
                            </div>
                        )}
                        {careNumber && (
                            <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                                <span className="text-slate-500">인정번호</span>
                                <span className="font-bold">{careNumber}</span>
                            </div>
                        )}
                        {guardianName && (
                            <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                                <span className="text-slate-500">보호자</span>
                                <span className="font-bold">{guardianName}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">기관 정보</h2>
                        <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                            <span className="text-slate-500">기관명</span>
                            <span className="font-bold">{centerName}</span>
                        </div>
                        {centerAddress && (
                            <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                                <span className="text-slate-500">주소</span>
                                <span className="font-bold text-sm">{centerAddress}</span>
                            </div>
                        )}
                        {centerPhone && (
                            <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                                <span className="text-slate-500">연락처</span>
                                <span className="font-bold">{centerPhone}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sessions Table */}
                <div className="mb-8">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">이용 내역</h2>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="p-3 text-left font-bold">일자</th>
                                <th className="p-3 text-left font-bold">서비스</th>
                                <th className="p-3 text-right font-bold">시간</th>
                                <th className="p-3 text-right font-bold">수가</th>
                            </tr>
                        </thead>
                        <tbody>
                            {completedSessions.map((session, idx) => (
                                <tr key={idx} className="border-b border-slate-100">
                                    <td className="p-3">{session.date}</td>
                                    <td className="p-3">{session.serviceName}</td>
                                    <td className="p-3 text-right">{session.duration}분</td>
                                    <td className="p-3 text-right font-bold">{session.price.toLocaleString()}원</td>
                                </tr>
                            ))}
                            {completedSessions.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-6 text-center text-slate-400">이용 내역이 없습니다.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Summary */}
                <div className="bg-slate-50 rounded-2xl p-6 mb-8">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-500">총 급여액</span>
                                <span className="font-bold">{totalFee.toLocaleString()}원</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">공단부담금 ({100 - copayRate}%)</span>
                                <span className="font-bold text-emerald-600">{governmentPay.toLocaleString()}원</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">본인부담금 ({copayRate}%)</span>
                                <span className="font-bold text-rose-600">{copay.toLocaleString()}원</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-500">기수납액</span>
                                <span className="font-bold">{alreadyPaid.toLocaleString()}원</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t-2 border-slate-200">
                                <span className="font-black text-lg">청구 금액</span>
                                <span className={cn("font-black text-2xl", balance > 0 ? "text-rose-600" : balance < 0 ? "text-indigo-600" : "text-emerald-600")}>
                                    {balance > 0 ? `${balance.toLocaleString()}원` : balance < 0 ? `과납 ${Math.abs(balance).toLocaleString()}원` : '완납'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-slate-400 mt-12 pt-6 border-t border-slate-100">
                    <p>본 청구서는 장기요양보험법에 따른 급여 이용요금 안내를 위해 발행되었습니다.</p>
                    <p className="mt-1">발행일: {new Date().toLocaleDateString('ko-KR')}</p>
                </div>
            </div>
        );
    }
);

InvoicePrintView.displayName = 'InvoicePrintView';
