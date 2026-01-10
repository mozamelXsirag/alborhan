
import React, { useEffect, useState, useMemo } from 'react';
import type { AssessmentHistoryItem, UserSession, Domain, Answers, DomainScore } from '../types';
import { getActiveDomains } from '../constants';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import ResultsChart from './RadarChart';

interface DashboardTabProps {
  session: UserSession;
}

const getColorClass = (classification: string): string => {
    switch(classification) {
        case 'ضعيف': return 'text-red-500 font-bold'; // 0-20% Red
        case 'تأسيسي': return 'text-orange-500 font-bold'; // 21-40% Orange
        case 'مستقر': return 'text-lime-500 font-bold'; // 41-60% YellowGreen (Lime)
        case 'متقدم': return 'text-cyan-500 font-bold'; // 61-80% Cyan
        case 'رائد': return 'text-purple-500 font-bold animate-pulse'; // 81-100% Purple
        default: return 'text-slate-500';
    }
};

const getMultiplier = (weight: number): number => {
    if (weight >= 1.8) return 4; 
    if (weight >= 1.5) return 3; 
    if (weight >= 1.2) return 2; 
    return 1;
};
  
const getAnswerPoints = (answerValue: number | null): number => {
      if (answerValue === null || answerValue === 0) return 0;
      return answerValue - 1; 
};

const calculateScores = (answers: Answers, domains: Domain[]): { [key: string]: DomainScore } => {
    const scores: { [key: string]: DomainScore } = {};
    
    domains.forEach(domain => {
        let domainWeightedScore = 0;
        let domainMaxScore = 0;
        
        const domainAnswers = answers[domain.key];
        if (!domainAnswers) {
            scores[domain.key] = { title: domain.title, score: 0 };
            return;
        }

        domain.questions.forEach((q, index) => {
            const answer = domainAnswers[index];
            const multiplier = getMultiplier(q.weight);
            domainMaxScore += 4 * multiplier;
            if (answer !== null) {
                domainWeightedScore += getAnswerPoints(answer) * multiplier;
            }
        });

        const score = domainMaxScore > 0 ? (domainWeightedScore / domainMaxScore) * 25 : 0;
        scores[domain.key] = { title: domain.title, score: parseFloat(score.toFixed(1)) };
    });
    return scores;
};

const DashboardTab: React.FC<DashboardTabProps> = ({ session }) => {
  const [history, setHistory] = useState<AssessmentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<AssessmentHistoryItem | null>(null);
  const [domains] = useState<Domain[]>(getActiveDomains());
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
      const fetchData = async () => {
          setLoading(true);
          try {
              const data = await api.getAllAssessments();
              if (session.role === 'user') {
                setHistory(data.filter(item => item.projectInfo.userName === session.name));
              } else {
                setHistory(data);
              }
          } catch (e) {
              console.error("Failed to fetch history", e);
              showToast("فشل في جلب البيانات من الخادم", 'error');
          } finally {
              setLoading(false);
          }
      };

      fetchData();
  }, [session]);

  const latestAssessmentScores = useMemo(() => {
      if (history.length === 0) return null;
      return calculateScores(history[0].detailedAnswers, domains);
  }, [history, domains]);

  const selectedItemScores = useMemo(() => {
      if (!selectedItem) return null;
      return calculateScores(selectedItem.detailedAnswers, domains);
  }, [selectedItem, domains]);

  const getAnswerText = (domainKey: string, questionIndex: number, answerValue: number | null) => {
      if (answerValue === null || answerValue === 0) return "لم يتم الإجابة";
      const domain = domains.find(d => d.key === domainKey);
      if (!domain) return "غير معروف";
      const question = domain.questions[questionIndex];
      if (!question) return "غير معروف";
      return question.levels[answerValue - 1] || "غير معروف";
  };

  const handleDownloadJSON = (item: AssessmentHistoryItem) => {
    const data = {
        meta: {
            exportedBy: session.name,
            exportedAt: new Date().toISOString()
        },
        assessment: item
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `burhan-log-${item.projectInfo.projectName}-${item.date.replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = async (elementId: string, filename: string) => {
    setIsExporting(true);
    // @ts-ignore
    if (typeof window.html2canvas === 'undefined') {
        alert('مكتبة التصدير غير جاهزة');
        setIsExporting(false);
        return;
    }
    const element = document.getElementById(elementId);
    if (!element) {
        setIsExporting(false);
        return;
    }
    
    try {
        // @ts-ignore
        const canvas = await window.html2canvas(element, {
            scale: 2,
            useCORS: true,
            ignoreElements: (el) => el.classList.contains('no-print')
        });
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        a.click();
    } catch (err) {
        console.error("Export error", err);
        showToast("فشل في تصدير الصورة", "error");
    } finally {
        setIsExporting(false);
    }
  };

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <div className="w-12 h-12 border-4 border-[#4a3856] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 font-bold">جاري تحميل البيانات من الخادم...</p>
          </div>
      );
  }

  return (
    <main className="container mx-auto p-4 md:p-8 animate-in fade-in duration-500">
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                    {session.role === 'admin' ? 'سجل البيانات المركزي' : 'لوحة إنجازاتي التقنية'}
                </h2>
            </div>
            
            {session.role === 'user' && history.length > 0 && latestAssessmentScores && (
                <div className="bg-white dark:bg-[#181818] p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-stretch">
                        <div className="flex-1 space-y-4">
                             <div className="inline-block px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-bold border border-green-500/20 mb-2">
                                أحدث تقييم
                             </div>
                             <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                                 {history[0].projectInfo.projectName}
                             </h3>
                             <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
                                 تم إجراء التقييم بتاريخ {history[0].date}. حقق المشروع نسبة <span className="text-blue-500 font-bold">{history[0].percentage}%</span> وتصنيف <span className={`${getColorClass(history[0].classification)}`}>{history[0].classification}</span>.
                             </p>
                             <div className="pt-4">
                                <button 
                                    onClick={() => setSelectedItem(history[0])}
                                    className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-[#4a3856] dark:hover:bg-[#e8654f] hover:text-white text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all text-sm"
                                >
                                    عرض التفاصيل الكاملة
                                </button>
                             </div>
                        </div>
                        <div className="w-full md:w-[400px] h-[350px]">
                            <ResultsChart data={latestAssessmentScores} />
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-[#181818] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg md:text-xl font-bold mb-6 text-slate-900 dark:text-white">سجل التقييمات</h3>
                
                <div className="overflow-x-auto">
                    {history.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <p>لا توجد بيانات مسجلة في قاعدة البيانات حالياً.</p>
                        </div>
                    ) : (
                        <table className="w-full text-right border-collapse min-w-[600px]">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-400 uppercase">
                                <tr>
                                    <th className="px-4 py-3 md:px-6 md:py-4 rounded-r-xl">المشروع</th>
                                    {session.role === 'admin' && <th className="px-4 py-3 md:px-6 md:py-4">طالب التقييم</th>}
                                    <th className="px-4 py-3 md:px-6 md:py-4">التاريخ</th>
                                    <th className="px-4 py-3 md:px-6 md:py-4 text-center">النسبة</th>
                                    <th className="px-4 py-3 md:px-6 md:py-4 text-center">التصنيف</th>
                                    <th className="px-4 py-3 md:px-6 md:py-4 text-center rounded-l-xl">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs md:text-sm">
                                {history.map((res) => (
                                    <tr key={res.id} className="hover:bg-blue-500/[0.02] transition-colors group">
                                        <td className="px-4 py-3 md:px-6 md:py-4 font-bold text-slate-800 dark:text-slate-200">{res.projectInfo.projectName}</td>
                                        {session.role === 'admin' && <td className="px-4 py-3 md:px-6 md:py-4 text-slate-600 dark:text-slate-400">{res.projectInfo.userName}</td>}
                                        <td className="px-4 py-3 md:px-6 md:py-4 text-slate-500 text-left" dir="ltr">{res.date}</td>
                                        <td className="px-4 py-3 md:px-6 md:py-4 font-mono text-center text-blue-500 font-bold">{res.percentage}%</td>
                                        <td className={`px-4 py-3 md:px-6 md:py-4 text-center ${getColorClass(res.classification)}`}>{res.classification}</td>
                                        <td className="px-4 py-3 md:px-6 md:py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => setSelectedItem(res)}
                                                    className="inline-flex items-center justify-center p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-[#4a3856] dark:hover:bg-[#e8654f] hover:text-white transition-all shadow-sm"
                                                    title="عرض التفاصيل"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </button>
                                                <button 
                                                    onClick={() => handleDownloadJSON(res)}
                                                    className="inline-flex items-center justify-center p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
                                                    title="تحميل JSON"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>

        {/* Detail Modal */}
        {selectedItem && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-[#121212] w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
                    
                    {/* Modal Header */}
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">تفاصيل الطلب والنتائج</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1">ID: {selectedItem.id.split('-')[0]}</p>
                        </div>
                        <button 
                            onClick={() => setSelectedItem(null)}
                            className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Modal Content - Scrollable */}
                    <div id="modal-report-content" className="overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar bg-white dark:bg-[#121212]">
                        
                        {/* Project Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">اسم المشروع</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white block">{selectedItem.projectInfo.projectName}</span>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">طالب التقييم</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white block">{selectedItem.projectInfo.userName}</span>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">الجهة / المنظمة</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white block">{selectedItem.projectInfo.organization || '-'}</span>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">معلومات التواصل</span>
                                <div className="text-sm font-bold text-slate-900 dark:text-white space-y-1">
                                    {selectedItem.projectInfo.phone && (
                                        <div className="flex items-center gap-2 font-mono" dir="ltr">
                                            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            <span>{selectedItem.projectInfo.phone}</span>
                                        </div>
                                    )}
                                    {selectedItem.projectInfo.email && (
                                        <div className="flex items-center gap-2" dir="ltr">
                                            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            <span>{selectedItem.projectInfo.email}</span>
                                        </div>
                                    )}
                                    {!selectedItem.projectInfo.phone && !selectedItem.projectInfo.email && (
                                        <span className="text-slate-400 italic font-normal">غير متوفر</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Score Summary */}
                        <div className="space-y-6">
                             <div className="flex items-center justify-between p-8 bg-gradient-to-r from-[#4a3856]/10 to-transparent dark:from-[#e8654f]/10 rounded-3xl border border-[#4a3856]/10 dark:border-[#e8654f]/10">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">النتيجة النهائية</p>
                                    <div className="text-5xl font-black text-slate-900 dark:text-white font-mono">{selectedItem.percentage}%</div>
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">تصنيف النضج</p>
                                    <div className={`text-3xl ${getColorClass(selectedItem.classification)}`}>{selectedItem.classification}</div>
                                </div>
                            </div>
                            
                            {/* Chart in Modal */}
                            {selectedItemScores && (
                                <div className="h-[350px] w-full">
                                    <ResultsChart data={selectedItemScores} />
                                </div>
                            )}
                        </div>

                        {/* Detailed Q&A */}
                        <div className="space-y-6">
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">مراجعة الإجابات التفصيلية</h4>
                            
                            {domains.map((domain) => (
                                <div key={domain.key} className="space-y-4">
                                    <h5 className="font-bold text-[#4a3856] dark:text-[#e8654f] bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 inline-block text-sm md:text-base">
                                        {domain.title}
                                    </h5>
                                    <div className="grid gap-3">
                                        {domain.questions.map((q, qIndex) => {
                                            const answersForDomain = selectedItem.detailedAnswers[domain.key];
                                            const userVal = answersForDomain ? answersForDomain[qIndex] : null;
                                            
                                            return (
                                                <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                                    <div className="flex justify-between gap-4 mb-2">
                                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{q.text}</p>
                                                        <span className="text-xs font-mono font-bold text-slate-400 whitespace-nowrap">الوزن: {q.weight}</span>
                                                    </div>
                                                    <div className="text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                                                        <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${userVal ? 'bg-blue-500' : 'bg-slate-400'}`}>
                                                            {userVal || '?'}
                                                        </span>
                                                        <span>{getAnswerText(domain.key, qIndex, userVal)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Modal Footer */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                        <div className="flex gap-2 no-print">
                            <button 
                                onClick={() => window.print()}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors"
                            >
                                طباعة PDF
                            </button>
                            <button 
                                onClick={() => handleDownloadJSON(selectedItem)}
                                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg text-xs transition-colors"
                            >
                                حفظ JSON
                            </button>
                            <button 
                                onClick={() => handleDownloadPNG('modal-report-content', `report-${selectedItem.id}.png`)}
                                disabled={isExporting}
                                className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                            >
                                {isExporting && <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                صورة PNG
                            </button>
                        </div>
                        <button 
                            onClick={() => setSelectedItem(null)} 
                            className="px-6 py-2 bg-[#4a3856] dark:bg-[#e8654f] text-white font-bold rounded-xl hover:opacity-90 text-sm"
                        >
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>
        )}
    </main>
  );
};

export default DashboardTab;
