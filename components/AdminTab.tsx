
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Domain, Question, AssessmentHistoryItem, DomainScore, Answers } from '../types';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import AssessmentReport from './AssessmentReport';

// Chart.js global variable
declare var Chart: any;

// Helper functions duplicated/imported from DashboardTab to make AdminTab standalone
const getColorClass = (classification: string): string => {
    switch(classification) {
        case 'ضعيف': return 'text-red-500 font-bold'; 
        case 'تأسيسي': return 'text-orange-500 font-bold'; 
        case 'مستقر': return 'text-lime-500 font-bold'; 
        case 'متقدم': return 'text-cyan-500 font-bold'; 
        case 'رائد': return 'text-purple-500 font-bold'; 
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

// Sort Configuration Types
type SortKey = 'projectName' | 'userName' | 'organization' | 'percentage' | 'date';
type SortDirection = 'asc' | 'desc';

// Delete Context Interface
interface DeleteContext {
    type: 'assessment' | 'all_assessments' | 'domain' | 'question';
    id?: string; // For assessment ID
    indices?: { dIdx: number, qIdx?: number }; // For domain/question indices
}

const AdminTab: React.FC = () => {
    const { theme } = useTheme();
    // subTab controls the main view: Overview (Dashboard), History (Table), Questions (Editor)
    const [subTab, setSubTab] = useState<'overview' | 'history' | 'questions'>('overview');
    
    const [history, setHistory] = useState<AssessmentHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Sorting State - Default: Date Descending (Newest First)
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'date', direction: 'desc' });

    // Modal & Delete States
    const [selectedItem, setSelectedItem] = useState<AssessmentHistoryItem | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteContext, setDeleteContext] = useState<DeleteContext | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [isSavingDomains, setIsSavingDomains] = useState(false);
    
    // Questions Editor States
    const [domains, setDomains] = useState<Domain[]>([]);
    const [isLoadingDomains, setIsLoadingDomains] = useState(false);
    const [editingLevelsId, setEditingLevelsId] = useState<string | null>(null);
    const [expandedDomains, setExpandedDomains] = useState<string[]>([]);
    const [draggedItem, setDraggedItem] = useState<{ domainIdx: number, qIdx: number } | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    // Chart Refs
    const barChartRef = useRef<HTMLCanvasElement>(null);
    const doughnutChartRef = useRef<HTMLCanvasElement>(null);
    const barChartInstance = useRef<any>(null);
    const doughnutChartInstance = useRef<any>(null);

    const { showToast } = useToast();

    // Init Data
    useEffect(() => {
        fetchHistory();
        fetchDomains();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await api.getAllAssessments();
            setHistory(data);
        } catch (error) {
            showToast("خطأ في جلب بيانات السجل", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchDomains = async () => {
        setIsLoadingDomains(true);
        try {
            const fetched = await api.getDomains();
            setDomains(fetched);
            if (fetched.length > 0) setExpandedDomains([fetched[0].key]);
        } catch (error) {
            showToast("خطأ في جلب بيانات الأسئلة", "error");
        } finally {
            setIsLoadingDomains(false);
        }
    };

    // --- Statistics for Dashboard ---
    const stats = useMemo(() => {
        const total = history.length;
        if (total === 0) return { total: 0, avgScore: 0, topClass: 'N/A', strongestDomain: 'N/A', weakestDomain: 'N/A', domainStats: {}, classCounts: {} };

        const sumScores = history.reduce((acc, curr) => acc + curr.percentage, 0);
        const avgScore = Math.round(sumScores / total);

        // Classification Counts
        const classCounts: {[key: string]: number} = {};
        history.forEach(h => { classCounts[h.classification] = (classCounts[h.classification] || 0) + 1; });
        const topClass = Object.keys(classCounts).reduce((a, b) => classCounts[a] > classCounts[b] ? a : b);

        // Domain Performance
        const domainStats: {[key: string]: {sum: number, count: number, title: string}} = {};
        
        // Initialize domain stats - use current domains loaded
        domains.forEach(d => {
            domainStats[d.key] = { sum: 0, count: 0, title: d.title };
        });

        // Calculate scores per domain for all history
        history.forEach(item => {
            // Need to recalculate scores for each item based on current domains (or assume structure matches)
            // Ideally history item has detailedAnswers. We approximate by calculating.
            const itemScores = calculateScores(item.detailedAnswers, domains);
            Object.keys(itemScores).forEach(key => {
                if (domainStats[key]) {
                    domainStats[key].sum += itemScores[key].score;
                    domainStats[key].count += 1;
                }
            });
        });

        // Find Strongest/Weakest
        let maxAvg = -1;
        let minAvg = 1000;
        let strongest = 'N/A';
        let weakest = 'N/A';

        Object.keys(domainStats).forEach(key => {
            const d = domainStats[key];
            if (d.count > 0) {
                const avg = d.sum / d.count;
                if (avg > maxAvg) { maxAvg = avg; strongest = d.title; }
                if (avg < minAvg) { minAvg = avg; weakest = d.title; }
                // Save avg back for chart
                // @ts-ignore
                d.avg = avg;
            }
        });

        return { total, avgScore, topClass, strongestDomain: strongest, weakestDomain: weakest, domainStats, classCounts };
    }, [history, domains]);

    // --- Chart Rendering Logic ---
    useEffect(() => {
        if (selectedItem) return; // Do not render dashboard charts if viewing a report
        if (subTab !== 'overview' || history.length === 0) return;

        // --- Render Bar Chart (Domain Performance) ---
        if (barChartRef.current) {
            if (barChartInstance.current) barChartInstance.current.destroy();
            const ctx = barChartRef.current.getContext('2d');
            if (ctx) {
                const labels = Object.values(stats.domainStats).map((d: any) => d.title.split(' ')[0]); // Shorten labels
                const data = Object.values(stats.domainStats).map((d: any) => d.avg?.toFixed(1) || 0);
                
                barChartInstance.current = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'متوسط الأداء (من 25)',
                            data: data,
                            backgroundColor: '#4a3856',
                            borderRadius: 6,
                            barThickness: 20,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: theme === 'dark' ? '#18181b' : '#fff',
                                titleColor: theme === 'dark' ? '#fff' : '#000',
                                bodyColor: theme === 'dark' ? '#a1a1aa' : '#52525b',
                                titleFont: { family: 'IBM Plex Sans Arabic' },
                                bodyFont: { family: 'IBM Plex Sans Arabic' },
                                borderColor: theme === 'dark' ? '#27272a' : '#e4e4e7',
                                borderWidth: 1,
                            }
                        },
                        scales: {
                            y: { beginAtZero: true, max: 25, grid: { color: theme === 'dark' ? '#27272a' : '#f4f4f5' }, ticks: { color: '#9ca3af', font: { family: 'IBM Plex Mono' } } },
                            x: { grid: { display: false }, ticks: { color: theme === 'dark' ? '#e4e4e7' : '#374151', font: { family: 'IBM Plex Sans Arabic', size: 10 } } }
                        }
                    }
                });
            }
        }

        // --- Render Doughnut Chart (Classifications) ---
        if (doughnutChartRef.current) {
            if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();
            const ctx = doughnutChartRef.current.getContext('2d');
            if (ctx) {
                const labels = Object.keys(stats.classCounts);
                const data = Object.values(stats.classCounts);
                const bgColors = labels.map(l => {
                    if (l === 'رائد') return '#8b5cf6'; // Purple
                    if (l === 'متقدم') return '#06b6d4'; // Cyan
                    if (l === 'مستقر') return '#84cc16'; // Lime
                    if (l === 'تأسيسي') return '#f97316'; // Orange
                    return '#ef4444'; // Red (Weak)
                });

                doughnutChartInstance.current = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: bgColors,
                            borderWidth: 0,
                            hoverOffset: 10
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '75%',
                        plugins: {
                            legend: { position: 'bottom', labels: { font: { family: 'IBM Plex Sans Arabic', size: 11 }, color: theme === 'dark' ? '#a1a1aa' : '#52525b', boxWidth: 10 } },
                            tooltip: {
                                backgroundColor: theme === 'dark' ? '#18181b' : '#fff',
                                bodyColor: theme === 'dark' ? '#fff' : '#000',
                                titleFont: { family: 'IBM Plex Sans Arabic' },
                                bodyFont: { family: 'IBM Plex Sans Arabic' },
                                callbacks: {
                                    label: function(context: any) {
                                        let label = context.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        let value = context.raw;
                                        let total = context.chart._metasets[context.datasetIndex].total;
                                        let percentage = Math.round((value / total) * 100) + '%';
                                        return label + value + ' (' + percentage + ')';
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }

        return () => {
            if (barChartInstance.current) barChartInstance.current.destroy();
            if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();
        };
    }, [subTab, history, theme, stats, selectedItem]);


    // --- Questions Editor Logic ---
    
    const updateDomainsState = (newDomains: Domain[]) => {
        setDomains(newDomains);
        setHasUnsavedChanges(true);
    };

    const handleSaveChangesToCloud = async () => {
        setIsSavingDomains(true);
        try {
            await api.saveDomains(domains);
            setHasUnsavedChanges(false);
            showToast("تم حفظ التعديلات في قاعدة البيانات بنجاح", "success");
        } catch (error) {
            showToast("حدث خطأ أثناء الحفظ", "error");
        } finally {
            setIsSavingDomains(false);
        }
    };

    const toggleDomain = (key: string) => {
        setExpandedDomains(prev => 
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const handleUpdateDomainTitle = (domainIdx: number, title: string) => {
        const newDomains = [...domains];
        newDomains[domainIdx].title = title;
        updateDomainsState(newDomains);
    };

    const handleAddDomain = () => {
        const newKey = `domain_${Date.now()}`;
        const newDomain: Domain = {
            key: newKey,
            title: "مسار تقييم جديد",
            questions: []
        };
        const updated = [...domains, newDomain];
        updateDomainsState(updated);
        setExpandedDomains(prev => [...prev, newKey]);
    };

    // Unified Delete Trigger for DOMAINS
    const triggerDeleteDomain = (domainIdx: number) => {
        setDeleteContext({
            type: 'domain',
            indices: { dIdx: domainIdx }
        });
        setDeleteModalOpen(true);
    };

    const handleUpdateQuestion = (domainIdx: number, qIdx: number, newText: string) => {
        const newDomains = [...domains];
        newDomains[domainIdx].questions[qIdx].text = newText;
        updateDomainsState(newDomains);
    };

    const handleUpdateWeight = (domainIdx: number, qIdx: number, weight: number) => {
        const newDomains = [...domains];
        newDomains[domainIdx].questions[qIdx].weight = weight;
        updateDomainsState(newDomains);
    };

    const handleUpdateLevel = (domainIdx: number, qIdx: number, levelIdx: number, text: string) => {
        const newDomains = [...domains];
        newDomains[domainIdx].questions[qIdx].levels[levelIdx] = text;
        updateDomainsState(newDomains);
    };

    const handleAddQuestion = (domainIdx: number) => {
        const newDomains = [...domains];
        const newQ: Question = {
            id: `q_custom_${Date.now()}`,
            text: "نص المعيار التقني الجديد هنا...",
            weight: 1.0,
            levels: [
                "وصف المستوى 1: (ضعيف)",
                "وصف المستوى 2: (تأسيسي)",
                "وصف المستوى 3: (مستقر)",
                "وصف المستوى 4: (متقدم)",
                "وصف المستوى 5: (رائد)"
            ]
        };
        newDomains[domainIdx].questions.push(newQ);
        updateDomainsState(newDomains);
        
        if (!expandedDomains.includes(newDomains[domainIdx].key)) {
            toggleDomain(newDomains[domainIdx].key);
        }
    };

    // Unified Delete Trigger for QUESTIONS
    const triggerDeleteQuestion = (domainIdx: number, qIdx: number) => {
        setDeleteContext({
            type: 'question',
            indices: { dIdx: domainIdx, qIdx: qIdx }
        });
        setDeleteModalOpen(true);
    };

    const moveQuestion = (domainIdx: number, fromIdx: number, toIdx: number) => {
        if (toIdx < 0 || toIdx >= domains[domainIdx].questions.length) return;
        const newDomains = domains.map(d => ({...d, questions: [...d.questions]}));
        const [movedItem] = newDomains[domainIdx].questions.splice(fromIdx, 1);
        newDomains[domainIdx].questions.splice(toIdx, 0, movedItem);
        updateDomainsState(newDomains);
    };

    const handleDragStart = (e: React.DragEvent, domainIdx: number, qIdx: number) => {
        // Prevent interactions with inputs/buttons from starting a drag
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('button')) {
            e.preventDefault();
            return;
        }

        setDraggedItem({ domainIdx, qIdx });
        e.dataTransfer.effectAllowed = "move";
        // Optional: Hide the drag ghost or style it
    };

    const handleDragOver = (e: React.DragEvent, domainIdx: number, qIdx: number) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.domainIdx !== domainIdx || draggedItem.qIdx === qIdx) return;
        
        // Reordering logic
        const newDomains = domains.map(d => ({...d, questions: [...d.questions]}));
        const questions = newDomains[domainIdx].questions;
        const [movedItem] = questions.splice(draggedItem.qIdx, 1);
        questions.splice(qIdx, 0, movedItem);
        
        setDomains(newDomains);
        setDraggedItem({ domainIdx, qIdx });
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setHasUnsavedChanges(true);
    };

    const exportQuestions = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(domains, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `burhan_questions_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        showToast("تم تصدير نسخة من الأسئلة", 'success');
    };

    // --- Unified Delete Logic ---
    const confirmDeleteAssessment = (id: string) => {
        setDeleteContext({
            type: 'assessment',
            id: id
        });
        setDeleteModalOpen(true);
    };

    const confirmDeleteAllAssessments = () => {
        if (history.length === 0) return;
        setDeleteContext({
            type: 'all_assessments'
        });
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteContext) return;
        setIsDeleting(true);
        try {
            // Case 1: Delete Single Assessment History
            if (deleteContext.type === 'assessment' && deleteContext.id) {
                await api.deleteAssessment(deleteContext.id);
                setHistory(prev => prev.filter(h => h.id !== deleteContext.id));
                showToast("تم حذف سجل التقييم بنجاح", 'success');
            } 
            // Case 2: Delete All Assessments
            else if (deleteContext.type === 'all_assessments') {
                await api.deleteAllAssessments();
                setHistory([]);
                showToast(`تم حذف ${history.length} سجل بنجاح`, 'success');
            }
            // Case 3: Delete Domain
            else if (deleteContext.type === 'domain' && deleteContext.indices) {
                const { dIdx } = deleteContext.indices;
                const newDomains = domains.filter((_, i) => i !== dIdx);
                updateDomainsState(newDomains);
                showToast("تم حذف المسار، يرجى حفظ التغييرات", 'info');
            }
            // Case 4: Delete Question
            else if (deleteContext.type === 'question' && deleteContext.indices) {
                const { dIdx, qIdx } = deleteContext.indices;
                const newDomains = domains.map((domain, i) => {
                    if (i === dIdx) {
                        return {
                            ...domain,
                            questions: domain.questions.filter((_, index) => index !== qIdx)
                        };
                    }
                    return domain;
                });
                updateDomainsState(newDomains);
                showToast("تم حذف المعيار", 'info');
            }

            setDeleteModalOpen(false);
        } catch (error: any) {
            console.error("Delete Op Failed");
            showToast(`فشل الحذف: ${error.message || "خطأ غير معروف"}`, 'error');
        } finally {
            setIsDeleting(false);
            setDeleteContext(null);
        }
    };

    const getDeleteMessage = () => {
        switch(deleteContext?.type) {
            case 'assessment': return "هل أنت متأكد من رغبتك في حذف هذا السجل نهائياً؟";
            case 'all_assessments': return `هل أنت متأكد من رغبتك في حذف جميع السجلات (${history.length} سجل)؟ هذا الإجراء خطير ولا يمكن التراجع عنه.`;
            case 'domain': return "هل أنت متأكد من حذف هذا المسار بالكامل؟ سيتم حذف جميع الأسئلة المرتبطة به.";
            case 'question': return "هل أنت متأكد من حذف هذا المعيار نهائياً؟";
            default: return "هل أنت متأكد؟";
        }
    };

    // --- Sorting Logic ---
    const handleSort = (key: SortKey) => {
        setSortConfig(current => {
            if (current.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            if (key === 'percentage' || key === 'date') {
                return { key, direction: 'desc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const sortedHistory = useMemo(() => {
        let sortableItems = [...history];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                switch (sortConfig.key) {
                    case 'projectName':
                        aValue = a.projectInfo.projectName;
                        bValue = b.projectInfo.projectName;
                        break;
                    case 'userName':
                        aValue = a.projectInfo.userName;
                        bValue = b.projectInfo.userName;
                        break;
                    case 'organization':
                        aValue = a.projectInfo.organization;
                        bValue = b.projectInfo.organization;
                        break;
                    case 'percentage':
                        aValue = a.percentage;
                        bValue = b.percentage;
                        break;
                    case 'date':
                        aValue = new Date(a.date).getTime();
                        bValue = new Date(b.date).getTime();
                        break;
                    default:
                        return 0;
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [history, sortConfig]);

    const getSortIcon = (columnKey: SortKey) => {
        if (sortConfig.key !== columnKey) {
            return (
                <svg className="w-3 h-3 text-slate-300 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            );
        }
        return sortConfig.direction === 'asc' ? (
            <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        );
    };

    // --- Detail View Logic ---
    const selectedItemScores = useMemo(() => {
        if (!selectedItem) return null;
        return calculateScores(selectedItem.detailedAnswers, domains);
    }, [selectedItem, domains]);

    if (selectedItem) {
        return (
            <main className="container mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                    <button 
                        onClick={() => setSelectedItem(null)}
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-[#181818] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
                    >
                        <svg className="w-5 h-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        العودة لسجل المشاريع
                    </button>
                    <div className="text-sm font-bold text-slate-400">
                        معاينة تقرير: {selectedItem.projectInfo.projectName}
                    </div>
                </div>

                {selectedItemScores && (
                    <AssessmentReport 
                        projectInfo={selectedItem.projectInfo}
                        totals={selectedItemScores}
                        finalScore={selectedItem.score}
                        percentage={selectedItem.percentage}
                        classification={selectedItem.classification}
                        onReset={() => setSelectedItem(null)}
                    />
                )}
            </main>
        );
    }

    return (
        <main className="container mx-auto p-4 md:p-8 relative">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex gap-1 bg-slate-200 dark:bg-slate-800 p-1.5 rounded-xl w-full md:w-auto overflow-x-auto">
                    <button onClick={() => setSubTab('overview')} className={`px-4 md:px-6 py-2 rounded-lg font-bold transition-all text-sm whitespace-nowrap ${subTab === 'overview' ? 'bg-[#4a3856] dark:bg-[#e8654f] text-white shadow-lg' : 'hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>نظرة عامة</button>
                    <button onClick={() => setSubTab('history')} className={`px-4 md:px-6 py-2 rounded-lg font-bold transition-all text-sm whitespace-nowrap ${subTab === 'history' ? 'bg-[#4a3856] dark:bg-[#e8654f] text-white shadow-lg' : 'hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>سجل المشاريع</button>
                    <button onClick={() => setSubTab('questions')} className={`px-4 md:px-6 py-2 rounded-lg font-bold transition-all text-sm whitespace-nowrap ${subTab === 'questions' ? 'bg-[#4a3856] dark:bg-[#e8654f] text-white shadow-lg' : 'hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>إعدادات المقياس</button>
                </div>
                
                <div className="flex items-center gap-2">
                    {subTab === 'questions' && (
                        <>
                            <button 
                                onClick={handleSaveChangesToCloud} 
                                disabled={isSavingDomains || !hasUnsavedChanges}
                                className={`px-4 py-2 border rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                    hasUnsavedChanges 
                                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-lg animate-pulse' 
                                    : 'border-slate-300 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                {isSavingDomains ? (
                                    <>جاري الحفظ...</>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                        حفظ التغييرات
                                    </>
                                )}
                            </button>
                            <button onClick={exportQuestions} className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-all">
                                تصدير الأسئلة
                            </button>
                        </>
                    )}
                    {subTab === 'history' && (
                        <button onClick={fetchHistory} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            تحديث
                        </button>
                    )}
                </div>
            </div>

            {/* TAB CONTENT: Overview (Same as before) */}
            {subTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-[#181818] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-[#4a3856]/50 transition-colors">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#4a3856] dark:bg-[#e8654f]"></div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي المشاريع</p>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.total}</h3>
                                </div>
                                <div className="p-2 bg-[#4a3856]/10 dark:bg-[#e8654f]/10 rounded-lg text-[#4a3856] dark:text-[#e8654f]">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#181818] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-[#4a3856]/50 transition-colors">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">متوسط النضج</p>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.avgScore}%</h3>
                                </div>
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-[#181818] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">متوسط الأداء حسب المجال</h3>
                                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">الدرجة من 25</span>
                            </div>
                            <div className="h-[250px] w-full relative">
                                <canvas ref={barChartRef}></canvas>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#181818] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">توزيع مستويات النضج</h3>
                            <div className="h-[250px] w-full relative flex items-center justify-center">
                                <canvas ref={doughnutChartRef}></canvas>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <span className="block text-2xl font-black text-slate-900 dark:text-white">{stats.total}</span>
                                        <span className="text-[10px] text-slate-400">مشروع</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: History Log */}
            {subTab === 'history' && (
                <div className="bg-white dark:bg-[#181818] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg">سجل البيانات المركزي</h3>
                            <span className="text-[10px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1 rounded-full font-bold">{history.length}</span>
                        </div>
                        {history.length > 0 && (
                            <button 
                                type="button"
                                onClick={confirmDeleteAllAssessments}
                                className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                حذف الكل
                            </button>
                        )}
                    </div>
                    {loading ? (
                        <div className="p-20 text-center">
                             <div className="inline-block w-8 h-8 border-4 border-[#4a3856] border-t-transparent rounded-full animate-spin"></div>
                             <p className="mt-4 text-slate-400 font-bold text-sm">جاري معالجة البيانات...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4 border-b border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none" onClick={() => handleSort('projectName')}><div className="flex items-center gap-1">المشروع {getSortIcon('projectName')}</div></th>
                                        <th className="p-4 border-b border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none" onClick={() => handleSort('userName')}><div className="flex items-center gap-1">صاحب التقييم {getSortIcon('userName')}</div></th>
                                        <th className="p-4 border-b border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none" onClick={() => handleSort('organization')}><div className="flex items-center gap-1">الجهة {getSortIcon('organization')}</div></th>
                                        <th className="p-4 border-b border-slate-200 dark:border-slate-800 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none" onClick={() => handleSort('percentage')}><div className="flex items-center justify-center gap-1">النتيجة {getSortIcon('percentage')}</div></th>
                                        <th className="p-4 border-b border-slate-200 dark:border-slate-800 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none" onClick={() => handleSort('date')}><div className="flex items-center gap-1 justify-end">التاريخ {getSortIcon('date')}</div></th>
                                        <th className="p-4 border-b border-slate-200 dark:border-slate-800 text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedHistory.length === 0 ? (
                                        <tr><td colSpan={6} className="p-20 text-center text-slate-400 italic text-sm">لا توجد تقييمات مسجلة في النظام.</td></tr>
                                    ) : sortedHistory.map(item => (
                                        <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-blue-500/[0.02] transition-colors group">
                                            <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{item.projectInfo.projectName}</td>
                                            <td className="p-4 text-slate-600 dark:text-slate-400">{item.projectInfo.userName}</td>
                                            <td className="p-4 text-slate-600 dark:text-slate-400">{item.projectInfo.organization}</td>
                                            <td className="p-4"><div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1 w-20 mx-auto"><span className={`font-mono font-bold text-lg ${getColorClass(item.classification).replace('text-', 'text-opacity-80 text-')}`}>{item.percentage}%</span><span className={`text-[9px] uppercase font-bold ${getColorClass(item.classification)}`}>{item.classification}</span></div></td>
                                            <td className="p-4 text-xs font-mono text-slate-400 text-left" dir="ltr">{item.date}</td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => setSelectedItem(item)} className="p-2 bg-blue-50 dark:bg-blue-900/10 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition-all" title="عرض التفاصيل"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                                                    <button onClick={() => confirmDeleteAssessment(item.id)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="حذف"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: Questions Editor */}
            {subTab === 'questions' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-center">
                        <button 
                            onClick={handleAddDomain}
                            className="flex items-center gap-2 px-8 py-4 bg-[#4a3856] dark:bg-[#e8654f] hover:bg-[#4a3856]/90 dark:hover:bg-[#e8654f]/90 text-white rounded-2xl font-bold shadow-xl shadow-[#4a3856]/20 dark:shadow-[#e8654f]/20 transition-all active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                            إضافة مسار تقييم جديد
                        </button>
                    </div>

                    {isLoadingDomains ? (
                        <div className="flex justify-center p-12">
                            <div className="w-10 h-10 border-4 border-slate-300 border-t-[#4a3856] rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        domains.map((domain, dIdx) => (
                            <div key={domain.key} className="bg-white dark:bg-[#181818] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div 
                                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${expandedDomains.includes(domain.key) ? 'bg-[#4a3856]/5 dark:bg-[#e8654f]/10 border-b border-slate-200 dark:border-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                    onClick={() => toggleDomain(domain.key)}
                                >
                                    <div className="flex items-center gap-4 flex-grow" onClick={e => e.stopPropagation()}>
                                        <div className="w-8 h-8 rounded-lg bg-[#4a3856] dark:bg-[#e8654f] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                            {dIdx + 1}
                                        </div>
                                        <input 
                                            type="text"
                                            className="bg-transparent border-none focus:ring-0 font-bold text-lg text-slate-800 dark:text-white flex-grow p-0"
                                            value={domain.title}
                                            onChange={e => handleUpdateDomainTitle(dIdx, e.target.value)}
                                            onClick={e => e.stopPropagation()}
                                            placeholder="اسم المسار..."
                                        />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 uppercase">
                                            {domain.questions.length} أسئلة
                                        </span>
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                triggerDeleteDomain(dIdx);
                                            }}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${expandedDomains.includes(domain.key) ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </div>
                                </div>
                                
                                {expandedDomains.includes(domain.key) && (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {domain.questions.length === 0 && (
                                            <div className="p-12 text-center text-slate-400 italic text-sm">لا توجد أسئلة مضافة لهذا المسار بعد. اضغط على الزر أدناه للبدء.</div>
                                        )}
                                        {domain.questions.map((q, qIdx) => (
                                            <div 
                                                key={q.id} 
                                                className={`p-6 hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors group relative ${draggedItem?.qIdx === qIdx && draggedItem?.domainIdx === dIdx ? 'opacity-30' : ''}`}
                                            >
                                                <div className="flex gap-4 items-start">
                                                    {/* Drag Handle - Explicitly Draggable */}
                                                    <div 
                                                        className="flex flex-col gap-1 items-center opacity-40 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 mt-3 touch-none"
                                                        draggable="true"
                                                        onDragStart={(e) => handleDragStart(e, dIdx, qIdx)}
                                                        onDragOver={(e) => handleDragOver(e, dIdx, qIdx)}
                                                        onDragEnd={handleDragEnd}
                                                    >
                                                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                                    </div>
                                                    
                                                    <div className="flex-grow space-y-4">
                                                        <div className="flex flex-col sm:flex-row gap-4">
                                                            <div className="flex-grow">
                                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">نص المعيار</label>
                                                                <textarea 
                                                                    className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 font-bold text-slate-800 dark:text-slate-100 resize-none transition-all"
                                                                    value={q.text}
                                                                    rows={2}
                                                                    onChange={e => handleUpdateQuestion(dIdx, qIdx, e.target.value)}
                                                                    placeholder="اكتب نص السؤال هنا..."
                                                                />
                                                            </div>
                                                            <div className="w-full sm:w-28">
                                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">الوزن التقني</label>
                                                                <input 
                                                                    type="number" 
                                                                    step="0.1" 
                                                                    min="0.1"
                                                                    max="5.0"
                                                                    className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono font-bold text-blue-500 focus:border-blue-500 outline-none transition-all h-[72px]" 
                                                                    value={q.weight} 
                                                                    onChange={e => handleUpdateWeight(dIdx, qIdx, parseFloat(e.target.value))}
                                                                />
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center justify-between gap-4">
                                                            <button 
                                                                onClick={() => setEditingLevelsId(editingLevelsId === q.id ? null : q.id)}
                                                                className={`flex items-center gap-2 text-[11px] font-bold px-5 py-2.5 rounded-xl border transition-all ${editingLevelsId === q.id ? 'bg-[#4a3856] dark:bg-[#e8654f] border-[#4a3856] dark:border-[#e8654f] text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#4a3856]/50 dark:hover:border-[#e8654f]/50'}`}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                                {editingLevelsId === q.id ? 'إغلاق محرر المستويات' : 'تعديل مستويات النضج الخمسة'}
                                                            </button>

                                                            <div className="flex items-center gap-1">
                                                                <button 
                                                                    onClick={() => moveQuestion(dIdx, qIdx, qIdx - 1)}
                                                                    disabled={qIdx === 0}
                                                                    className="p-2 text-slate-300 hover:text-blue-500 disabled:opacity-10 transition-colors"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                                                                </button>
                                                                <button 
                                                                    onClick={() => moveQuestion(dIdx, qIdx, qIdx + 1)}
                                                                    disabled={qIdx === domain.questions.length - 1}
                                                                    className="p-2 text-slate-300 hover:text-blue-500 disabled:opacity-10 transition-colors"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                                </button>
                                                                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2"></div>
                                                                <button 
                                                                    onClick={() => triggerDeleteQuestion(dIdx, qIdx)}
                                                                    type="button"
                                                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors relative z-10"
                                                                    title="حذف السؤال"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {editingLevelsId === q.id && (
                                                            <div className="mt-4 p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                                                                <h5 className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-2">تعريف مستويات النضج لهذا المعيار</h5>
                                                                {q.levels.map((levelText, lIdx) => (
                                                                    <div key={lIdx} className="flex gap-4">
                                                                        <div className="flex flex-col items-center flex-shrink-0 pt-2">
                                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${levelText ? 'bg-blue-600/10 border-blue-500/50 text-blue-500' : 'bg-slate-200 dark:bg-slate-800 border-transparent text-slate-400'}`}>
                                                                                {lIdx + 1}
                                                                            </div>
                                                                            <div className="w-0.5 flex-grow bg-slate-200 dark:bg-slate-800 my-1"></div>
                                                                        </div>
                                                                        <div className="flex-grow">
                                                                            <textarea 
                                                                                className="w-full p-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all hover:border-blue-500/30 min-h-[60px] resize-none"
                                                                                value={levelText}
                                                                                onChange={e => handleUpdateLevel(dIdx, qIdx, lIdx, e.target.value)}
                                                                                placeholder={`صف ما يمثله المستوى ${lIdx + 1} لهذا المعيار...`}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        <div className="p-8 bg-slate-50/20 dark:bg-slate-900/10 text-center">
                                            <button 
                                                onClick={() => handleAddQuestion(dIdx)} 
                                                className="group inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#4a3856] dark:text-[#e8654f] hover:bg-[#4a3856] dark:hover:bg-[#e8654f] hover:text-white hover:border-[#4a3856] dark:hover:border-[#e8654f] transition-all shadow-sm active:scale-95"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                                إضافة معيار تقني جديد لهذا القسم
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    
                    <div className="pt-8 text-center">
                        <p className="text-[11px] text-slate-400 font-medium">
                            {hasUnsavedChanges 
                                ? '⚠️ لديك تعديلات غير محفوظة. لا تنس الضغط على زر "حفظ التغييرات" في الأعلى.' 
                                : 'جميع البيانات متزامنة مع قاعدة البيانات السحابية.'}
                        </p>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#181818] rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                                <svg className="h-6 w-6 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">تأكيد الحذف</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                {getDeleteMessage()}
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setDeleteModalOpen(false)}
                                    disabled={isDeleting}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={executeDelete}
                                    disabled={isDeleting}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
                                >
                                    {isDeleting ? 'جاري الحذف...' : 'نعم، احذف'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default AdminTab;
