
import React, { useState, useEffect } from 'react';
import { getActiveDomains, RECOMMENDATIONS } from '../constants';
import type { DomainScore, ProjectInfo } from '../types';
import ResultsChart from './RadarChart';

interface AssessmentReportProps {
  projectInfo: ProjectInfo;
  totals: { [key: string]: DomainScore };
  finalScore: number;
  percentage: number;
  classification: string;
  onReset: () => void;
}

interface PlanItem {
    title: string;
    recommendation: string;
    score: number;
    levelLabel: string;
    colorClass: string;
}

// Helper to determine Level Info based on domain score (out of 25)
const getLevelInfo = (score: number) => {
    // 0-5: Weak (0-20%)
    if (score <= 5) return { label: 'ضعيف', color: 'text-red-500 border-red-500/20 bg-red-500/10', recKey: 'weak' as const };
    // 5.25-10: Foundational (21-40%)
    if (score <= 10) return { label: 'تأسيسي', color: 'text-orange-500 border-orange-500/20 bg-orange-500/10', recKey: 'weak' as const };
    // 10.25-15: Stable (41-60%)
    if (score <= 15) return { label: 'مستقر', color: 'text-lime-500 border-lime-500/20 bg-lime-500/10', recKey: 'medium' as const };
    // 15.25-20: Advanced (61-80%)
    if (score <= 20) return { label: 'متقدم', color: 'text-cyan-500 border-cyan-500/20 bg-cyan-500/10', recKey: 'medium' as const };
    // 20.25-25: Pioneer (81-100%)
    return { label: 'رائد', color: 'text-purple-500 border-purple-500/20 bg-purple-500/10', recKey: 'advanced' as const };
};

const AssessmentReport: React.FC<AssessmentReportProps> = ({ 
    projectInfo, 
    totals, 
    finalScore, 
    percentage, 
    classification,
    onReset 
}) => {
    const [isExporting, setIsExporting] = useState(false);
    
    // Scroll to top on mount
    useEffect(() => {
        // محاولة التمرير لأعلى النافذة الرئيسية
        window.scrollTo(0, 0);
        
        // محاولة التمرير لأعلى عنصر الحاوية الرئيسية للتطبيق (حيث يوجد التمرير الفعلي)
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.scrollTo({ top: 0, behavior: 'auto' });
        }

        // تمرير العنصر نفسه للعرض كإجراء احتياطي
        const element = document.getElementById('assessment-report-container');
        if (element) {
            element.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
    }, []);
    
    const urgentItems: PlanItem[] = [];
    const nextPriorityItems: PlanItem[] = [];
    const sustainabilityItems: PlanItem[] = [];
    
    const activeDomains = getActiveDomains();

    activeDomains.forEach(domain => {
        const domainData = totals[domain.key];
        const score = domainData ? domainData.score : 0;
        
        const levelInfo = getLevelInfo(score);
        
        // Map 5 levels to existing recommendation structure keys (weak, medium, advanced)
        const domainRecs = RECOMMENDATIONS[domain.key as keyof typeof RECOMMENDATIONS];
        const recommendation = domainRecs ? domainRecs[levelInfo.recKey] : "لا توجد توصيات متاحة لهذا القسم.";
        
        const item: PlanItem = { 
            title: domain.title, 
            recommendation, 
            score, 
            levelLabel: levelInfo.label,
            colorClass: levelInfo.color
        };

        // Grouping Logic:
        // Weak (0-5) & Foundational (5-10) -> Urgent
        if (score <= 10) {
            urgentItems.push(item);
        } 
        // Stable (10-15) & Advanced (15-20) -> Improvements
        else if (score <= 20) {
            nextPriorityItems.push(item);
        } 
        // Pioneer (20-25) -> Strengths
        else {
            sustainabilityItems.push(item);
        }
    });

    const handleDownloadPNG = async () => {
        setIsExporting(true);
        // @ts-ignore
        if (typeof window.html2canvas === 'undefined') {
            alert('جاري تحميل المكتبة، يرجى المحاولة مرة أخرى...');
            setIsExporting(false);
            return;
        }

        const element = document.getElementById('assessment-report-container');
        if (element) {
            try {
                // @ts-ignore
                const canvas = await window.html2canvas(element, {
                    scale: 2, // High resolution
                    useCORS: true,
                    backgroundColor: null, // Transparent background if styled that way, or white default
                    ignoreElements: (element) => element.classList.contains('no-print'),
                    // Force Desktop View Settings
                    windowWidth: 1440, // Simulate a wide desktop screen
                    onclone: (clonedDoc) => {
                        const clonedElement = clonedDoc.getElementById('assessment-report-container');
                        if (clonedElement) {
                            // Force fixed width to trigger desktop layout in flex containers
                            clonedElement.style.width = '1200px'; 
                            clonedElement.style.maxWidth = 'none';
                            clonedElement.style.margin = '0 auto';
                            clonedElement.style.padding = '40px'; // Ensure nice padding
                            
                            // Ensure font sizes look proportional
                            clonedElement.style.fontSize = '16px';
                            
                            // 1. Force chart to be visible & static in export
                            // We remove absolute positioning and specific width used to hide it on mobile
                            const chartDiv = clonedElement.querySelector('.chart-container');
                            if (chartDiv) {
                                const el = chartDiv as HTMLElement;
                                el.style.display = 'block';
                                el.style.position = 'static'; // Return to flow
                                el.style.width = '100%'; // Ensure it fills the container width
                                el.classList.remove('absolute'); 
                                el.classList.remove('-left-[9999px]');
                                el.classList.remove('w-[1100px]'); // Remove fixed mobile width
                            }

                            // 2. Show Header and Footer ONLY in export (hidden normally)
                            const exportVisibleElements = clonedElement.querySelectorAll('.export-visible');
                            exportVisibleElements.forEach((el) => {
                                (el as HTMLElement).classList.remove('hidden');
                                (el as HTMLElement).style.display = 'flex';
                            });
                        }
                    }
                });
                
                const dataUrl = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = `burhan-report-${projectInfo.projectName}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } catch (err) {
                console.error("PNG export failed", err);
                alert("حدث خطأ أثناء تصدير الصورة");
            }
        }
        setIsExporting(false);
    };

    const ExportButtons = () => (
        <div className="flex gap-2 no-print">
            <button 
                onClick={handleDownloadPNG}
                disabled={isExporting}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all"
                title="حفظ كصورة (PNG)"
            >
                {isExporting ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                )}
                حفظ كصورة
            </button>
        </div>
    );

    const PlanColumn: React.FC<{ title: string; items: PlanItem[]; borderColor: string }> = ({ title, items, borderColor }) => (
        <div className={`flex-1 min-w-[300px] bg-white dark:bg-[#181818] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm`}>
            <h3 className={`text-lg font-bold mb-6 pb-3 border-b-2 ${borderColor}`}>{title}</h3>
            {items.length > 0 ? (
                <ul className="space-y-4">
                    {items.map((item, index) => (
                        <li key={index} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800/50 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.title}</h4>
                                <div className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${item.colorClass}`}>
                                    {/* Removed Score Display Here: Only Level Label */}
                                    {item.levelLabel}
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.recommendation}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="py-8 text-center text-slate-400 italic text-sm bg-slate-50 dark:bg-slate-900/30 rounded-xl">
                    لا توجد بنود ضمن هذه الفئة
                </div>
            )}
        </div>
    );

    return (
        <div id="assessment-report-container" className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 bg-slate-50 dark:bg-[#121212] p-4 md:p-8">
            
            {/* Report Header (Visible ONLY in PNG Export) */}
            <div className="hidden export-visible flex items-center justify-between mb-8 px-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 text-[#4a3856] dark:text-[#e8654f] fill-current">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 282.84 284.44" className="w-full h-full drop-shadow-sm">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path d="M131.09,284.44l72.83-102.67,50.58,35.98-.04,26.07-28.88,40.62h0c31.62,0,57.26-25.64,57.26-57.26v-26.88s-86.28-61.34-86.28-61.34l-74.36,104.59-62.76-44.62L178.43,31.59l104.41,74.24v-48.57c0-31.62-25.64-57.26-57.26-57.26H57.26C25.64,0,0,25.64,0,57.26v169.92c0,31.62,25.64,57.26,57.26,57.26h73.83Z"/>
                            </g>
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight">مقياس البرهان</h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">إصدار V2.0</p>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">تقرير النضج التقني</p>
                    <p className="text-xs text-slate-400 font-mono mt-1" dir="ltr">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            {/* Header / Score Card */}
            <header className="bg-white dark:bg-[#181818] p-8 md:p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl mb-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#4a3856]/5 dark:bg-[#e8654f]/5 blur-[80px] rounded-full -mr-20 -mt-20 no-print"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full -ml-20 -mb-20 no-print"></div>
                
                <div className="relative z-10">
                    <div className="flex flex-col-reverse md:flex-row justify-between items-start gap-6 mb-8">
                         <div>
                             <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2">{projectInfo.projectName}</h2>
                             <p className="text-slate-500 dark:text-slate-400 font-medium">تقرير النضج التقني النهائي</p>
                             <div className="flex flex-wrap gap-4 mt-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                                {projectInfo.phone && <span>📞 {projectInfo.phone}</span>}
                                {projectInfo.email && <span>✉️ {projectInfo.email}</span>}
                             </div>
                         </div>
                         <div className="self-end md:self-auto no-print">
                             <ExportButtons />
                         </div>
                    </div>
                    
                    <div className="space-y-8">
                        {/* Scores Section - Full Width Row */}
                        <div className="w-full">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                                    {/* Removed tracking-widest to fix Arabic scrambling in export */}
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">النتيجة النهائية</p>
                                    <div className="text-4xl md:text-5xl font-black text-[#4a3856] dark:text-[#e8654f] font-mono">{percentage}%</div>
                                 </div>
                                 
                                 <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center flex flex-col justify-center items-center">
                                    {/* Removed tracking-widest */}
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">مستوى النضج</p>
                                    <div className="px-4 py-1 bg-[#4a3856]/10 dark:bg-[#e8654f]/10 text-[#4a3856] dark:text-[#e8654f] rounded-full text-xl font-black border border-[#4a3856]/20 dark:border-[#e8654f]/20 inline-block">
                                        {classification}
                                    </div>
                                 </div>

                                 <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                                    {/* Removed tracking-widest */}
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">مجموع النقاط</p>
                                    <div className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white font-mono">{finalScore.toFixed(0)}<span className="text-lg text-slate-400">/175</span></div>
                                 </div>
                            </div>
                        </div>

                        {/* Chart Section - Full Width Row below Stats */}
                        {/* Modified: Use absolute positioning off-screen on mobile with LARGE width to ensure high resolution capture */}
                        <div className="h-[450px] mt-8 chart-container absolute -left-[9999px] w-[1100px] md:w-full md:static md:block">
                            <ResultsChart data={totals} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Improvement Plan */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-[#4a3856] dark:bg-[#e8654f] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#4a3856]/20 dark:shadow-[#e8654f]/20 no-print">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2h2a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">خطة التحسين والتطوير المقترحة</h2>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    <PlanColumn 
                        title="بنود التطوير العاجل (ضعيف / تأسيسي)" 
                        items={urgentItems} 
                        borderColor="border-red-500"
                    />
                    <PlanColumn 
                        title="بنود التحسين (مستقر / متقدم)" 
                        items={nextPriorityItems} 
                        borderColor="border-lime-500"
                    />
                    <PlanColumn 
                        title="نقاط القوة (رائد)" 
                        items={sustainabilityItems} 
                        borderColor="border-purple-500"
                    />
                </div>
            </section>

            {/* Report Footer (Visible ONLY in PNG Export) */}
            <div className="hidden export-visible mt-12 pt-8 border-t-2 border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 opacity-90">
                    {/* Al-Burhan Association Logo */}
                    <div className="w-10 h-10">
                        <svg xmlns="http://www.w3.org/2000/svg" id="Layer_2" data-name="Layer 2" viewBox="0 0 511.18 477.2" className="w-full h-full">
                          <g id="Layer_4" data-name="Layer 4">
                            <g>
                              <g>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M8.32,79.61l14.11.05v.03h57.21v-8.09h-22.59l-1.44-14.1-6.49,5.52.86,8.58h-30.33l-1.62-17.51-6.49,5.52.24,1.39c-.68-.1-1.33-.16-1.94-.16-1.24,0-2.37.26-3.4.79-1.03.52-2.02,1.34-2.98,2.43-.96,1.1-1.61,2.12-1.94,3.06-.31,1.05-.47,2.08-.47,3.11,0,2.37.82,4.53,2.46,6.47,1.64,1.94,3.25,2.91,4.82,2.91ZM8.37,69.11c.3-.42.72-.72,1.26-.91.35-.1.63-.16.84-.16.65,0,1.2.21,1.66.62.46.41.69.89.69,1.45,0,.38-.09.74-.26,1.07-.17.33-.42.62-.73.86-.68.51-1.26.76-1.73.76-.61,0-1.11-.23-1.5-.69-.39-.46-.59-1.02-.59-1.66.09-.61.21-1.05.37-1.33Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M4.03,50.22c.23.49.48.89.76,1.2.79.68,1.67,1.02,2.64,1.02.47,0,.94-.09,1.41-.26.47-.21.85-.46,1.15-.76.72-.71,1.07-1.6,1.07-2.64s-.36-1.9-1.07-2.56c-.35-.38-.74-.66-1.18-.81-.4-.18-.86-.26-1.39-.26-1.06,0-1.94.36-2.63,1.07-.69.71-1.03,1.57-1.03,2.56,0,.25.03.5.08.76.05.26.11.49.18.68Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M12.77,50.22c.23.49.48.89.76,1.2.79.68,1.66,1.02,2.62,1.02.47,0,.94-.09,1.41-.26.51-.23.9-.48,1.18-.76.72-.73,1.07-1.61,1.07-2.64s-.36-1.88-1.07-2.56c-.66-.72-1.53-1.07-2.59-1.07s-1.89.35-2.59,1.05c-.7.7-1.05,1.56-1.05,2.59,0,.25.03.5.08.76s.11.49.18.68Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M56.68,91.59c1.03,0,1.88-.36,2.56-1.07.72-.66,1.07-1.53,1.07-2.59s-.35-1.89-1.05-2.59c-.7-.7-1.56-1.05-2.59-1.05s-1.91.34-2.64,1.02c-.68.79-1.02,1.66-1.02,2.62,0,.47.09.94.26,1.42.23.51.48.9.76,1.18.73.71,1.61,1.07,2.64,1.07Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M50.51,90.52c.72-.66,1.07-1.53,1.07-2.59s-.35-1.89-1.05-2.59-1.56-1.05-2.59-1.05-1.91.34-2.64,1.02c-.66.73-.99,1.61-.99,2.62s.35,1.9,1.05,2.61c.7.71,1.56,1.06,2.59,1.06s1.9-.36,2.56-1.07Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M124.62,79.69h6.7c1.64,1.64,2.85,2.71,3.64,3.22.79.51,2.5.76,5.16.76,1.67,0,3.3-.34,4.88-1.02,1.58-.68,2.83-1.67,3.75-2.96h40.28v.08h30.12c3.33-3.63,5.44-5.77,6.33-6.44l1.99-1.49c-5.5,0-10.35-.97-14.58-2.9-4.27-2.01-7.44-3.93-9.5-5.78-1.15-1.01-2.22-2.02-3.19-3.04l-3.14-3.4c-.05.07-.17.2-.35.41-.18.2-.35.37-.51.51l-1.39,1.28-3.95,3.72,2.96,3.14c.65.71,1.6,1.59,2.87,2.62,1.27,1.03,2.74,2.1,4.41,3.22h-50.38c0-3.1-.83-5.42-2.5-6.95-1.67-1.53-3.29-2.29-4.88-2.29-.37-.03-.94-.1-1.73-.18-.79-.09-1.48-.13-2.09-.13-.07,0-.54-.02-1.41-.05s-1.49-.05-1.86-.05l-4.32-.13-2.25-.03v9.81h-40.17c.19-.89.44-1.47.76-1.72.14-.16.3-.3.47-.42.14-.14.38-.31.71-.5h7.62c1.15,0,2.21-.48,3.17-1.43.96-.95,1.44-2.47,1.44-4.56,0-.77-.11-1.72-.33-2.87-.22-1.14-.54-2.35-.95-3.62l-.81,2.46c-.28.68-.53,1.19-.76,1.52-.45.73-1.06,1.1-1.81,1.1l-.34-.03-.68-.1h-1.88c-.26,0-.62,0-1.07.03-.45.02-.78.03-.97.03h-1.81l-3.32.05c-1.43,0-2.7.91-3.81,2.72-1.11,1.81-1.66,4.27-1.66,7.35h-3.79v8.09h44.96ZM137.25,70.7c.04-.27.08-.46.12-.56.75,0,1.43.05,2.05.13.62.09,1.03.15,1.22.18.19.04.43.1.71.18,1.1.35,1.65.93,1.65,1.75,0,.64-.27,1.36-.81,2.14-.54.79-1.13,1.18-1.75,1.18-.84,0-1.59-.47-2.26-1.41-.67-.94-1.01-1.91-1.01-2.91.02-.19.05-.42.09-.69Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M204.89,91.67c1.06,0,1.94-.35,2.63-1.06.69-.71,1.03-1.57,1.03-2.6,0-.52-.09-1-.27-1.43-.18-.43-.45-.82-.8-1.19-.68-.68-1.54-1.02-2.59-1.02s-1.88.34-2.62,1.02c-.68.79-1.02,1.66-1.02,2.62,0,.47.09.94.26,1.41.23.51.48.9.76,1.18.73.71,1.61,1.07,2.62,1.07Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M4.65,171.12c1.43,1.23,2.93,2.14,4.49,2.72,1.56.58,3.22.88,4.98.88,1.05-.19,2.09-.46,3.14-.81,1.19-.42,2.26-.85,3.22-1.28,2.27-1.06,3.72-2.84,4.34-5.34.23-.73.4-1.36.52-1.87.12-.51.23-1.01.31-1.48.16-.92.24-1.72.24-2.38,0-.79-.05-1.47-.16-2.04l-.18-1.07-.24-1.13c-.19-1.05-.75-2.28-1.67-3.72-.52-.8-1.04-1.52-1.54-2.15l-1.49-1.8-2.33,2.51-2.77,3.22c.26.33.44.55.52.66.17.24.4.57.68.99.19.3.36.58.51.85.15.27.28.51.38.72.26.51.45,1.02.58,1.55.12.52.18,1.03.18,1.52,0,1.22-.5,2.28-1.51,3.18-1,.9-2.13,1.43-3.39,1.58-.17.03-.41.08-.72.12-.31.04-.58.07-.82.07l-1.07.08c-2.5,0-4.39-1.14-5.68-3.43-.66-1.17-1.15-2.4-1.47-3.69-.31-1.29-.47-2.69-.47-4.19l.08-1.78.29-1.65c-.59.91-1.1,1.8-1.52,2.68-.42.88-.75,1.69-.99,2.42-.17.47-.3.88-.38,1.22-.08.34-.14.73-.2,1.16-.12.75-.18,1.53-.18,2.33,0,1.9.36,3.63,1.09,5.18.72,1.55,1.8,2.94,3.23,4.17Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M10.65,142.74c-1.01,0-1.88.36-2.59,1.07-.72.71-1.07,1.57-1.07,2.56,0,.52.09,1.02.26,1.49.21.43.48.81.81,1.12.73.68,1.6,1.02,2.59,1.02,1.05,0,1.91-.34,2.6-1.03.69-.69,1.03-1.56,1.03-2.6s-.36-1.94-1.07-2.56c-.35-.38-.74-.65-1.18-.81-.4-.17-.86-.26-1.39-.26Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M117.66,165.33l8.11-8.09-10.47-16.3c-.58-.98-1.17-1.85-1.77-2.62-.6-.77-1.23-1.46-1.9-2.08-.66-.62-1.33-1.16-2-1.62-.67-.46-1.36-.82-2.05-1.06-.73-.35-1.47-.58-2.2-.71-.68-.14-1.45-.21-2.3-.21-2.5,0-4.71.74-6.65,2.23s-3.42,3.63-4.45,6.44c1.17-.98,2.26-1.63,3.27-1.96,1.15-.43,2.21-.65,3.17-.65,1.05,0,2,.16,2.87.47.86.31,1.66.77,2.39,1.36,1.59,1.31,2.82,2.61,3.69,3.9l8.22,12.82h-3.32l-9.4-14.63c-2.6.63-5.12,1.81-7.56,3.53-1.26.89-2.25,1.69-2.97,2.4-.72.71-1.22,1.34-1.48,1.9-.56,1.15-.93,2.01-1.13,2.57-.12.38-.18.66-.18.84l-.03.71c0,.54.1,1.07.31,1.57.31.54.65.91,1.02,1.12h-48.91l-3.32-33.6-6.39,6.7,3.38,34.99h82.05ZM98.27,154.55c.1-.56.24-.91.42-1.06s.41-.22.71-.22c.26,0,.46.05.6.16l.24.13.24.16,2.2,3.53h-2.85l-1.23-.91c-.23-.3-.34-.71-.34-1.23l.03-.55Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M136.16,165.43l-.42,2.09c-.24.99-.89,2.3-1.95,3.93-1.05,1.62-2.37,2.96-3.94,4,.52.1,1.02.16,1.49.16,1.33,0,2.61-.27,3.85-.8,1.24-.53,2.46-1.3,3.66-2.32,2.42-2.06,3.64-4.45,3.64-7.17h21.64v-.03h18.61v.03h24.31l8.09-8.9-3.17-32.79-6.25,7.07,2.41,26.53h-29.83l-1.44-14.13-6.49,5.52.86,8.61h-28.47l-1.49-12.98-6.54,6.34.71,4.08c.31,1.83.47,3.29.47,4.37.21,2.08.31,3.8.31,5.16l-.05.68v.55Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M176.95,176.15c.69-.71,1.03-1.57,1.03-2.6,0-.52-.09-1-.27-1.43-.18-.43-.45-.82-.8-1.19-.68-.68-1.54-1.02-2.59-1.02s-1.88.34-2.62,1.02c-.68.77-1.02,1.64-1.02,2.62,0,.56.09,1.05.26,1.47s.44.8.79,1.15c.72.7,1.58,1.05,2.59,1.05,1.06,0,1.94-.35,2.63-1.06Z"/>
                                <polygon className="fill-slate-700 dark:fill-slate-300" points="223.94 123.64 217.92 130.6 221.14 165.33 227.42 158.52 223.94 123.64"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M12.82,222.71c.79.68,1.66,1.02,2.62,1.02.47,0,.94-.09,1.41-.26.51-.23.9-.48,1.18-.76.72-.73,1.07-1.61,1.07-2.64s-.36-1.88-1.07-2.56c-.66-.72-1.53-1.07-2.59-1.07s-1.89.35-2.59,1.05c-.7.7-1.05,1.56-1.05,2.59,0,.25.03.5.08.76s.11.49.18.68c.23.49.48.89.76,1.2Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M4.08,222.71c.79.68,1.67,1.02,2.64,1.02.47,0,.94-.09,1.41-.26.47-.21.85-.46,1.15-.76.72-.71,1.07-1.6,1.07-2.64s-.36-1.9-1.07-2.56c-.35-.38-.74-.66-1.18-.81-.4-.18-.86-.26-1.39-.26-1.06,0-1.94.36-2.63,1.07-.69.71-1.03,1.57-1.03,2.56,0,.25.03.5.08.76.05.26.11.49.18.68.23.49.48.89.76,1.2Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M74.44,252.28c2.1-1.78,3.15-4.48,3.15-8.11s-.85-6.16-2.54-7.9c-1.69-1.75-3.31-2.62-4.84-2.62-.37-.03-.94-.1-1.73-.18-.79-.09-1.48-.13-2.09-.13-.07,0-.54-.02-1.41-.05-.87-.03-1.49-.05-1.86-.05l-4.32-.13-2.25-.03v9.81H18.94l-1.62-17.51-6.49,5.52.24,1.39c-.68-.1-1.33-.16-1.94-.16-1.24,0-2.37.26-3.4.79-1.03.52-2.02,1.34-2.98,2.43-.96,1.1-1.61,2.12-1.94,3.06-.31,1.05-.47,2.08-.47,3.11,0,2.37.82,4.53,2.46,6.47,1.64,1.94,3.25,2.91,4.82,2.91l14.11.05v.03h36.49c1.64,1.64,2.85,2.71,3.64,3.22.79.51,2.5.76,5.16.76,2.86,0,5.34-.89,7.45-2.67ZM11.85,242.46c-.17.33-.42.62-.73.86-.68.51-1.26.76-1.73.76-.61,0-1.11-.23-1.5-.69-.39-.46-.59-1.02-.59-1.66.09-.61.21-1.05.37-1.33.3-.42.72-.72,1.26-.91.35-.1.63-.16.84-.16.65,0,1.2.21,1.66.62.46.41.69.89.69,1.45,0,.38-.09.74-.26,1.07ZM65.05,245.58c-.67-.94-1.01-1.91-1.01-2.91.02-.19.05-.42.09-.69.04-.27.08-.46.12-.56.75,0,1.43.05,2.05.13.62.09,1.03.15,1.22.18.19.04.43.1.71.18,1.1.35,1.65.93,1.65,1.75,0,.64-.27,1.36-.81,2.14-.54.79-1.13,1.18-1.75,1.18-.84,0-1.59-.47-2.26-1.41Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M182.38,228.39c.47,0,.94-.09,1.41-.26.51-.23.9-.48,1.18-.76.37-.4.63-.8.8-1.2.16-.4.25-.87.25-1.41s-.09-1.05-.26-1.47c-.17-.42-.44-.8-.79-1.15-.7-.7-1.56-1.05-2.59-1.05-.52,0-1,.09-1.44.28-.44.18-.83.45-1.18.8-.68.68-1.02,1.55-1.02,2.59s.34,1.88,1.02,2.62c.77.68,1.64,1.02,2.62,1.02Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M221.5,242.88h-16.06c-.17.02-.65.04-1.44.05l-.81.13h-.6l-.94.05h-1.1c-4.97-.07-9.58-1.07-13.82-3.01-4.33-2.08-7.89-4.47-10.7-7.17l-4.53-5.05c-.05.07-.17.2-.35.41-.18.2-.35.37-.51.51l-1.39,1.28-3.95,3.72,2.96,3.14c.65.71,1.6,1.59,2.87,2.62,1.26,1.03,2.73,2.14,4.41,3.32h-57.13c0-3.4-.99-6.07-2.96-8.02-1.97-1.95-3.7-2.92-5.18-2.92l-12.17.05c-.89-.15-1.73-.5-2.51-1.02-.79-.63-1.18-2.22-1.18-4.76l-10.94,13.82h24.02l.99.37.76.39c.58.31.86.78.86,1.39,0,.21-.05.45-.16.71h-27.06v8.09h80.58v-.03l41.98.03h14.99l8.09-8.9-3.17-32.79-6.25,7.07,2.41,26.53Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M15.1,302.06c-1.03,0-1.89.35-2.59,1.05-.7.7-1.05,1.56-1.05,2.59,0,.25.03.5.08.76.05.26.11.49.18.68.23.49.48.89.76,1.2.79.68,1.66,1.02,2.62,1.02.47,0,.94-.09,1.41-.26.51-.23.9-.48,1.18-.76.72-.73,1.07-1.61,1.07-2.64s-.36-1.88-1.07-2.56c-.66-.72-1.53-1.07-2.59-1.07Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M6.39,302.06c-1.06,0-1.94.36-2.63,1.07-.69.71-1.03,1.57-1.03,2.56,0,.25.03.5.08.76s.11.49.18.68c.23.49.48.89.76,1.2.79.68,1.67,1.02,2.64,1.02.47,0,.94-.09,1.41-.26.47-.21.85-.46,1.15-.76.72-.71,1.07-1.6,1.07-2.64s-.36-1.9-1.07-2.56c-.35-.38-.74-.66-1.18-.81-.4-.18-.86-.26-1.39-.26Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M67.24,293.61c.32-.53.48-1.24.48-2.13l-.05-.76-.18-.92-.42.16c0,.44-.03.83-.08,1.16l-1.7.98c-.12-.18-.21-.38-.26-.6l-.13-.68-.31.1c-.2.85-.37,1.47-.52,1.87l-1.25.72c-.05.03-.09.06-.14.09-.09-.07-.16-.16-.2-.27-.08-.2-.13-.42-.14-.67-.02-.25-.03-.53-.03-.86l-.39.08-.18.6c-.12.26-.18.46-.18.6l-.03.57c0,.26.06.58.18.94l.03.05c-.04.18-.07.39-.07.63l.35-.2c.24.29.55.46.94.46s.77-.15,1.15-.44c.4-.35.63-.71.68-1.07l.5.34.6.03c.58,0,1.03-.26,1.35-.8Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M62.89,304.76c-.52,0-1,.09-1.44.28-.44.18-.83.45-1.18.8-.68.68-1.02,1.54-1.02,2.59s.34,1.88,1.02,2.62c.72.68,1.59,1.02,2.62,1.02.56,0,1.05-.09,1.47-.26s.8-.44,1.15-.79c.68-.71,1.02-1.58,1.02-2.59,0-1.06-.36-1.93-1.07-2.59-.66-.71-1.52-1.07-2.56-1.07Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M176.05,299.57l-.97.55.42.13.6.08c.52,0,1.11-.25,1.75-.76.44-.36,1-.95,1.7-1.75l.76.5.65.39.13-1.73-.26-.18-.42-.34.26-.66.18-.65.1-.31v-.42c0-1.03-.4-1.55-1.2-1.55-.28,0-.53.09-.76.26-.23.17-.44.42-.63.73-.42.82-.63,1.47-.63,1.93,0,.3.07.56.21.79l.84.78c-.94.87-1.58,1.42-1.91,1.65l-.84.55ZM178.64,294.73l.08-.26.24-.1c.31.09.55.22.69.39.15.18.22.4.22.68l-.1.6-.6-.42-.34-.31c-.12-.18-.18-.37-.18-.58Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M211.98,294.92l-6.25,7.07,2.41,26.53h-11.15l-11.65-18.08-6.96,4.92,8.43,13.14h-3.32l-7.35-11.8-6.65,5,4.4,6.8h-2.85l-3.79-5.84-7.51,5.86h-90.24l-1.44-14.1-6.49,5.52.86,8.58H18.61l-1.62-17.51-6.49,5.52.24,1.39c-.68-.1-1.33-.16-1.94-.16-1.24,0-2.37.26-3.4.79-1.03.52-2.02,1.34-2.98,2.43-.96,1.1-1.61,2.12-1.94,3.06-.31,1.05-.47,2.08-.47,3.11,0,2.37.82,4.53,2.46,6.47,1.64,1.94,3.25,2.91,4.82,2.91l14.11.05v.03h133.91v-.03h45.59v.03h6.18l8.09-8.9-3.17-32.79ZM11.51,328.1c-.17.33-.42.62-.73.86-.68.51-1.26.76-1.73.76-.61,0-1.11-.23-1.5-.69-.39-.46-.59-1.02-.59-1.66.09-.61.21-1.05.37-1.33.3-.42.72-.72,1.26-.91.35-.1.63-.16.84-.16.65,0,1.2.21,1.66.62.46.41.69.89.69,1.45,0,.38-.09.74-.26,1.07Z"/>
                                <polygon className="fill-slate-700 dark:fill-slate-300" points="221.14 336.61 227.42 329.8 223.94 294.92 217.92 301.88 221.14 336.61"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M26.16,415.37l-.24-1.13c-.19-1.05-.75-2.28-1.67-3.72-.52-.8-1.04-1.52-1.54-2.15l-1.49-1.8-2.33,2.51-2.77,3.22c.26.33.44.55.52.66.17.24.4.57.68.99.19.3.36.58.51.85.15.27.28.51.38.72.26.51.45,1.02.58,1.55.12.52.18,1.03.18,1.52,0,1.22-.5,2.28-1.51,3.18-1,.9-2.13,1.43-3.39,1.58-.17.03-.41.08-.72.12-.31.04-.58.07-.82.07l-1.07.08c-2.5,0-4.39-1.14-5.68-3.43-.66-1.17-1.15-2.4-1.47-3.69-.31-1.29-.47-2.69-.47-4.19l.08-1.78.29-1.65c-.59.91-1.1,1.8-1.52,2.68s-.75,1.69-.99,2.42c-.17.47-.3.88-.38,1.22-.08.34-.14.73-.2,1.16-.12.75-.18,1.53-.18,2.33,0,1.9.36,3.63,1.09,5.18.72,1.55,1.8,2.94,3.23,4.17,1.43,1.23,2.93,2.14,4.49,2.72,1.56.58,3.22.88,4.98.88,1.05-.19,2.09-.46,3.14-.81,1.19-.42,2.26-.85,3.22-1.28,2.27-1.06,3.72-2.84,4.34-5.34.23-.73.4-1.36.52-1.87.12-.51.23-1.01.31-1.48.16-.92.24-1.72.24-2.38,0-.79-.05-1.47-.16-2.04l-.18-1.07Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M11.25,406.94c1.05,0,1.91-.34,2.6-1.03.69-.69,1.03-1.56,1.03-2.6s-.36-1.94-1.07-2.56c-.35-.38-.74-.65-1.18-.81-.4-.17-.86-.26-1.39-.26-1.01,0-1.88.36-2.59,1.07-.72.71-1.07,1.57-1.07,2.56,0,.52.09,1.02.26,1.49.21.43.48.81.81,1.12.73.68,1.6,1.02,2.59,1.02Z"/>
                                <polygon className="fill-slate-700 dark:fill-slate-300" points="33.12 387.52 36.32 422.25 42.6 415.45 39.12 380.56 33.12 387.52"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M34.38,380.72c.47.1.8.15.99.15.7,0,1.37-.38,2.02-1.15.65-.77,1.36-2.28,2.15-4.53l-1.28-1.34c-.75,1.57-1.33,2.64-1.75,3.22-.52.59-.99.89-1.41.89-.3-.09-.69-.31-1.18-.68-.63-.47-1.04-.71-1.23-.71-.42.05-.76.24-1.02.55l-.42,1.07c-.28.66-.74,1.55-1.39,2.67l.84.408c.49-1.85.94-3.02,1.36-3.5.42-.59.9-.89,1.44-.89l.89.16Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M155.9,394.01c.79.68,1.67,1.02,2.64,1.02.47,0,.94-.09,1.41-.26.47-.21.85-.46,1.15-.76.72-.72,1.07-1.6,1.07-2.64s-.36-1.9-1.07-2.56c-.35-.38-.74-.65-1.18-.81-.4-.17-.86-.26-1.39-.26-1.06,0-1.94.36-2.63,1.07-.69.71-1.03,1.57-1.03,2.56,0,.24.03.5.08.76.05.26.11.49.18.68.23.49.48.89.76,1.21Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M164.64,394.01c.79.68,1.66,1.02,2.62,1.02.47,0,.94-.09,1.41-.26.51-.23.9-.48,1.18-.76.72-.73,1.07-1.62,1.07-2.64s-.36-1.88-1.07-2.56c-.66-.71-1.53-1.07-2.59-1.07s-1.89.35-2.59,1.05c-.7.7-1.05,1.56-1.05,2.59,0,.24.03.5.08.76.05.26.11.49.18.68.23.49.48.89.76,1.21Z"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M181.91,387.63l2.41,26.53h-11.59l-1.13-17.11-1.88,1.54-1.65,1.26-2.56,1.94c-.52-.1-1.05-.16-1.57-.16-2.62,0-5.13.86-7.54,2.59-2.41,1.73-3.61,4.33-3.61,7.8l.05.97.13,1.18H59.35l-1.49-12.98-6.54,6.34.71,4.08c.31,1.83.47,3.29.47,4.37.21,2.08.31,3.8.31,5.16l-.05.68v.55l-.42,2.09c-.24.99-.89,2.3-1.95,3.93-1.05,1.62-2.37,2.96-3.94,4,.52.1,1.02.16,1.49.16,1.33,0,2.61-.27,3.85-.8,1.24-.53,2.46-1.3,3.66-2.32,2.42-2.06,3.64-4.45,3.64-7.17h124.16l8.09-8.9-3.17-32.79-6.25,7.07ZM164.17,413.4c-.35.28-.68.48-.99.59-.31.11-.59.17-.84.17-.61,0-1.13-.23-1.54-.71-.3-.31-.47-.61-.52-.89l-.08-.81.13-.81.31-.66c.31-.45.74-.79,1.28-1.02.31-.1.58-.16.79-.16.79,0,1.4.22,1.86.67.45.45.68.97.68,1.58,0,.8-.36,1.48-1.07,2.04Z"/>
                                <polygon className="fill-slate-700 dark:fill-slate-300" points="194.11 387.52 197.32 422.25 203.61 415.45 200.12 380.56 194.11 387.52"/>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M227.26,415.81l-.42-5.89c-.37-4.21-.71-7.39-1.02-9.55l-5.89,5.42c-.63-.31-1.51-.47-2.64-.47-2.13,0-4.07.65-5.84,1.96-1.71,1.43-2.56,3.61-2.56,6.54,0,3.11,1.02,5.36,3.06,6.75,1.08.73,2.33,1.26,3.76,1.57,1.42.31,3.11.47,5.06.47.05.16.08.41.08.76,0,.68-.13,1.38-.38,2.09-.25.72-.6,1.43-1.03,2.15-.96,1.52-2.46,2.82-4.5,3.9.63.1,1.2.16,1.73.16,1.33,0,2.6-.23,3.81-.68,1.21-.45,2.38-1.13,3.52-2.04,2.29-1.87,3.43-4.42,3.43-7.67,0-.52-.03-1.39-.08-2.62-.05-1.22-.08-2.17-.08-2.85ZM218.88,415.55c-.64.45-1.15.68-1.53.68-.61,0-1.08-.22-1.41-.67-.33-.45-.5-.94-.5-1.48.09-.51.21-.9.37-1.18.16-.21.31-.36.47-.47.16-.14.38-.26.65-.37l.42-.13.39-.05c.68.1,1.18.29,1.49.55.4.35.6.79.6,1.33,0,.73-.32,1.33-.96,1.78Z"/>
                              </g>
                              <g>
                                <g>
                                  <rect className="fill-slate-700 dark:fill-slate-300" x="272.44" y="390.67" width="238.73" height="42.33"/>
                                  <rect className="fill-slate-700 dark:fill-slate-300" x="272.44" y="323.33" width="238.73" height="42.33"/>
                                  <rect className="fill-slate-700 dark:fill-slate-300" x="272.09" y="45.42" width="239.03" height="41.77"/>
                                  <polygon className="fill-slate-700 dark:fill-slate-300" points="272.09 298.32 272.09 112.2 313.87 112.2 313.87 256.55 385.22 256.55 424.87 200.66 452.4 220.25 452.38 234.44 436.66 256.55 469.14 256.55 469.14 211.69 420.86 177.36 380.38 234.29 346.23 210 410.99 118.92 510.91 189.96 510.91 298.12 510.63 298.12 510.63 298.32 272.09 298.32"/>
                                </g>
                                <rect className="fill-[#db6f44]" x="368.27" y="420.31" width="47.13" height="47.13" transform="translate(-199.1 407.08) rotate(-45)"/>
                                <rect className="fill-[#db6f44]" x="368.37" y="9.76" width="47.13" height="47.13" transform="translate(91.23 286.9) rotate(-45)"/>
                              </g>
                            </g>
                          </g>
                        </svg>
                    </div>

                    <div className="h-8 w-px bg-slate-300 dark:bg-slate-700"></div>

                    {/* Scale Logo + Text */}
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 282.84 284.44" className="w-5 h-5 text-[#4a3856] dark:text-[#e8654f] fill-current opacity-80">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path d="M131.09,284.44l72.83-102.67,50.58,35.98-.04,26.07-28.88,40.62h0c31.62,0,57.26-25.64,57.26-57.26v-26.88s-86.28-61.34-86.28-61.34l-74.36,104.59-62.76-44.62L178.43,31.59l104.41,74.24v-48.57c0-31.62-25.64-57.26-57.26-57.26H57.26C25.64,0,0,25.64,0,57.26v169.92c0,31.62,25.64,57.26,57.26,57.26h73.83Z"/>
                            </g>
                        </svg>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">مقياس البرهان التقني</span>
                    </div>
                </div>

                <div className="text-xs font-medium text-slate-400">
                    جميع الحقوق محفوظة © 2026
                </div>
            </div>

            <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-4 no-print">
                <ExportButtons />
                <button 
                    onClick={onReset}
                    className="px-8 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-all active:scale-95 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    إنهاء الجلسة والخروج
                </button>
            </div>
        </div>
    );
};

export default AssessmentReport;
