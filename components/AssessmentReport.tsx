
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
                    {/* Technical Excellence Center Logo */}
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127 108" className="w-full h-full">
                              <g>
                                <path className="fill-slate-700 dark:fill-slate-300" d="M126.22,54.9v-.02s0-.01,0-.01c-.03-.06-.06-.12-.09-.18L95.17.72s-.03-.06-.06-.09c-.01-.02-.02-.04-.04-.06-.04-.07-.1-.12-.16-.17-.03-.03-.07-.05-.09-.07-.03-.03-.06-.05-.1-.07-.05-.03-.1-.05-.15-.07-.06-.02-.1-.04-.16-.05-.11-.03-.22-.03-.32-.03L32.25,0s.04.01.07.02c-.06-.01-.12-.02-.18-.02-.01,0-.02,0-.02,0-.04,0-.07,0-.11,0t-.02,0c-.05,0-.1.01-.15.03-.02,0-.06.01-.08.03-.06.02-.13.04-.19.08-.2.11-.38.29-.49.51-.01.03-.03.06-.04.09,0-.02,0-.04.02-.05L.21,54.57c-.14.18-.21.41-.21.66,0,.05,0,.1.01.14,0,.04,0,.07.02.11.02.12.07.24.13.35l30.6,52.97s-.02-.04-.03-.07c.05.1.11.19.18.28.04.05.08.09.12.13.01.01.02.02.03.03s.02.02.03.02c.03.03.07.05.1.07.05.03.12.06.17.09.02,0,.04.02.05.02.06.02.12.04.19.04.03,0,.06.01.1.02.07,0,.14,0,.21,0h0s61.86.25,61.86.25c.04,0,.07,0,.12,0,.1,0,.19-.01.27-.04.03,0,.06-.01.08-.03.06-.02.13-.04.19-.08h.02s0-.02.01-.02c.06-.03.12-.09.18-.13.05-.04.1-.1.14-.15.05-.07.1-.13.13-.21l31.11-53.02h0c.24-.34.29-.74.17-1.09ZM96.96,8.59l16.96,29.57c1.71,2.99-1.86,6.19-4.65,4.17l-23.82-17.28c-1.31-.95-1.7-2.73-.91-4.14l6.86-12.29c1.21-2.17,4.32-2.19,5.56-.03ZM52.38,2.4l34.31.05c2.43,0,3.97,2.62,2.78,4.75l-6.92,12.43c-.81,1.45-2.6,2.04-4.11,1.35l-27.38-12.48c-3.13-1.42-2.11-6.1,1.33-6.1ZM82.46,61.16c.02-1.7,1.37-3.1,3.07-3.16l24.68-.96c3.19-.12,4.57,3.99,1.95,5.81l-24.83,17.31c-2.13,1.48-5.04-.05-5.02-2.65l.15-16.35ZM76.54,39.09v29.85c0,3.12-3.37,5.07-6.07,3.51l-25.85-14.93c-2.7-1.56-2.7-5.46,0-7.01l25.85-14.93c2.7-1.56,6.07.39,6.07,3.51ZM44.24,8l29.11,13.27c2.37,1.08,2.52,4.38.26,5.68l-15.96,9.15c-1.52.87-3.46.36-4.34-1.16l-13.14-22.42c-1.58-2.69,1.24-5.81,4.08-4.52ZM32,14.73c.3-3.08,4.37-3.97,5.93-1.3l13.28,22.65c.9,1.53.37,3.5-1.17,4.39l-16.41,9.41c-2.25,1.29-5.02-.5-4.77-3.08l3.13-32.06ZM5.99,49.24l17.03-29.73c1.71-2.99,6.29-1.53,5.95,1.9l-2.91,29.66c-.16,1.63-1.53,2.87-3.16,2.88l-14.12.07c-2.46.01-4.01-2.65-2.79-4.78ZM22.82,90.31L5.98,61.17c-1.23-2.12.3-4.78,2.75-4.79l14.11-.06c1.65,0,3.04,1.25,3.19,2.9l2.73,29.2c.32,3.41-4.23,4.86-5.94,1.9ZM31.83,95.72l-3.02-32.34c-.24-2.57,2.51-4.35,4.76-3.07l17.7,10.08c1.6.91,2.1,2.99,1.09,4.53l-14.68,22.26c-1.66,2.52-5.57,1.54-5.85-1.46ZM41.13,96.25l13.53-20.5c.93-1.4,2.78-1.85,4.25-1.02l14.09,8.02c2.27,1.29,2.11,4.61-.27,5.69l-27.62,12.48c-2.92,1.32-5.74-2-3.98-4.67ZM86.33,107.27l-34.39-.14c-3.43-.01-4.43-4.69-1.3-6.1l27.28-12.32c1.5-.68,3.27-.1,4.09,1.33l7.11,12.47c1.22,2.13-.33,4.79-2.79,4.78ZM113.97,71.91l-17.27,29.44c-1.24,2.12-4.31,2.1-5.53-.03l-7.11-12.45c-.82-1.44-.41-3.26.95-4.2l24.38-16.99c2.81-1.96,6.31,1.28,4.58,4.24ZM112.41,54.59l-26.55,1.03c-1.82.07-3.33-1.4-3.32-3.22l.18-20.15c.02-2.59,2.97-4.08,5.07-2.56l26.37,19.13c2.45,1.78,1.28,5.66-1.75,5.78Z"/>
                                <path className="fill-[#db6f44]" d="M68.71,41.12l-18.07,10.43c-1.73,1-1.73,3.49,0,4.49l18.07,10.43c1.73,1,3.89-.25,3.89-2.24v-20.86c0-1.99-2.16-3.24-3.89-2.24Z"/>
                              </g>
                            </svg>
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">مركز التميز التقني</span>
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
