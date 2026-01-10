
import React, { useState, useEffect } from 'react';
import { getActiveDomains, INITIAL_DOMAINS } from '../constants';
import type { Domain, Question, AssessmentHistoryItem } from '../types';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';

const AdminTab: React.FC = () => {
    const [subTab, setSubTab] = useState<'history' | 'questions'>('history');
    const [history, setHistory] = useState<AssessmentHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    
    // حالة لإدارة نافذة تأكيد الحذف
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [deleteMode, setDeleteMode] = useState<'single' | 'all'>('single');
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [domains, setDomains] = useState<Domain[]>(getActiveDomains());
    const [editingLevelsId, setEditingLevelsId] = useState<string | null>(null);
    const [expandedDomains, setExpandedDomains] = useState<string[]>([]);
    const [draggedItem, setDraggedItem] = useState<{ domainIdx: number, qIdx: number } | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        if (domains.length > 0) setExpandedDomains([domains[0].key]);
    }, []);

    useEffect(() => {
        if (subTab === 'history') {
            fetchHistory();
        }
    }, [subTab]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await api.getAllAssessments();
            setHistory(data);
        } catch (error) {
            showToast("خطأ في جلب البيانات", "error");
        } finally {
            setLoading(false);
        }
    };

    const saveToLocal = (newDomains: Domain[]) => {
        setDomains(newDomains);
        localStorage.setItem('burhan_custom_questions', JSON.stringify(newDomains));
    };

    const toggleDomain = (key: string) => {
        setExpandedDomains(prev => 
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const getColorClass = (classification: string): string => {
        switch(classification) {
            case 'ضعيف': return 'text-red-500'; 
            case 'تأسيسي': return 'text-orange-500'; 
            case 'مستقر': return 'text-lime-500'; 
            case 'متقدم': return 'text-cyan-500'; 
            case 'رائد': return 'text-purple-500'; 
            default: return 'text-slate-500';
        }
    };

    const handleUpdateDomainTitle = (domainIdx: number, title: string) => {
        const newDomains = [...domains];
        newDomains[domainIdx].title = title;
        saveToLocal(newDomains);
    };

    const handleAddDomain = () => {
        const newKey = `domain_${Date.now()}`;
        const newDomain: Domain = {
            key: newKey,
            title: "مسار تقييم جديد",
            questions: []
        };
        const updated = [...domains, newDomain];
        saveToLocal(updated);
        setExpandedDomains(prev => [...prev, newKey]);
        showToast("تم إضافة مسار تقييم جديد", 'success');
    };

    const handleDeleteDomain = (domainIdx: number) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا المسار بالكامل؟ سيتم حذف جميع الأسئلة المرتبطة به.")) return;
        const newDomains = [...domains];
        newDomains.splice(domainIdx, 1);
        saveToLocal(newDomains);
        showToast("تم حذف المسار بنجاح", 'info');
    };

    const handleUpdateQuestion = (domainIdx: number, qIdx: number, newText: string) => {
        const newDomains = [...domains];
        newDomains[domainIdx].questions[qIdx].text = newText;
        saveToLocal(newDomains);
    };

    const handleUpdateWeight = (domainIdx: number, qIdx: number, weight: number) => {
        const newDomains = [...domains];
        newDomains[domainIdx].questions[qIdx].weight = weight;
        saveToLocal(newDomains);
    };

    const handleUpdateLevel = (domainIdx: number, qIdx: number, levelIdx: number, text: string) => {
        const newDomains = [...domains];
        newDomains[domainIdx].questions[qIdx].levels[levelIdx] = text;
        saveToLocal(newDomains);
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
        saveToLocal(newDomains);
        showToast("تم إضافة معيار جديد", 'success');
        if (!expandedDomains.includes(newDomains[domainIdx].key)) {
            toggleDomain(newDomains[domainIdx].key);
        }
    };

    const handleDeleteQuestion = (domainIdx: number, qIdx: number) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا المعيار نهائياً؟")) return;
        const newDomains = [...domains];
        newDomains[domainIdx].questions.splice(qIdx, 1);
        saveToLocal(newDomains);
        showToast("تم حذف المعيار", 'info');
    };

    const moveQuestion = (domainIdx: number, fromIdx: number, toIdx: number) => {
        if (toIdx < 0 || toIdx >= domains[domainIdx].questions.length) return;
        const newDomains = [...domains];
        const [movedItem] = newDomains[domainIdx].questions.splice(fromIdx, 1);
        newDomains[domainIdx].questions.splice(toIdx, 0, movedItem);
        saveToLocal(newDomains);
    };

    const handleDragStart = (e: React.DragEvent, domainIdx: number, qIdx: number) => {
        setDraggedItem({ domainIdx, qIdx });
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, domainIdx: number, qIdx: number) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.domainIdx !== domainIdx || draggedItem.qIdx === qIdx) return;
        
        const newDomains = [...domains];
        const questions = [...newDomains[domainIdx].questions];
        const [movedItem] = questions.splice(draggedItem.qIdx, 1);
        questions.splice(qIdx, 0, movedItem);
        newDomains[domainIdx].questions = questions;
        
        setDomains(newDomains);
        setDraggedItem({ domainIdx, qIdx });
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        saveToLocal(domains);
    };

    const handleResetQuestions = () => {
        if (window.confirm("سيتم مسح كافة التعديلات والعودة للوضع الأصلي المدمج في النظام. هل أنت متأكد؟")) {
            setDomains(INITIAL_DOMAINS);
            localStorage.removeItem('burhan_custom_questions');
            showToast("تمت إعادة ضبط الأسئلة للوضع الافتراضي", 'info');
        }
    };

    // فتح نافذة الحذف الفردي
    const confirmDelete = (id: string) => {
        setItemToDelete(id);
        setDeleteMode('single');
        setDeleteModalOpen(true);
    };

    // فتح نافذة الحذف الجماعي
    const confirmDeleteAll = () => {
        if (history.length === 0) return;
        setDeleteMode('all');
        setDeleteModalOpen(true);
    };

    // تنفيذ الحذف الفعلي (مدمج)
    const executeDelete = async () => {
        setIsDeleting(true);
        try {
            if (deleteMode === 'single' && itemToDelete) {
                await api.deleteAssessment(itemToDelete);
                setHistory(prev => prev.filter(h => h.id !== itemToDelete));
                showToast("تم حذف سجل التقييم بنجاح", 'success');
            } else if (deleteMode === 'all') {
                await api.deleteAllAssessments();
                setHistory([]);
                showToast(`تم حذف ${history.length} سجل بنجاح`, 'success');
            }
            setDeleteModalOpen(false);
        } catch (error: any) {
            console.error("Delete Op Failed");
            const errorMsg = error.code === 'permission-denied' 
                ? "خطأ: ليس لديك صلاحية الحذف. يرجى التحقق من قواعد Firebase."
                : `فشل الحذف: ${error.message || "خطأ غير معروف"}`;
            
            showToast(errorMsg, 'error');
            // تنبيه احتياطي
            if (error.code === 'permission-denied') alert(errorMsg);
        } finally {
            setIsDeleting(false);
            setItemToDelete(null);
        }
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

    return (
        <main className="container mx-auto p-4 md:p-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex gap-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                    <button 
                        onClick={() => setSubTab('history')} 
                        className={`px-6 py-2 rounded-lg font-bold transition-all text-sm ${subTab === 'history' ? 'bg-[#4a3856] dark:bg-[#e8654f] text-white shadow-lg' : 'hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                    >
                        سجل التقييمات
                    </button>
                    <button 
                        onClick={() => setSubTab('questions')} 
                        className={`px-6 py-2 rounded-lg font-bold transition-all text-sm ${subTab === 'questions' ? 'bg-[#4a3856] dark:bg-[#e8654f] text-white shadow-lg' : 'hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                    >
                        محرر الأسئلة
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    {subTab === 'questions' && (
                        <>
                            <button onClick={exportQuestions} className="px-4 py-2 border border-blue-500/50 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg text-xs font-bold transition-all">
                                تصدير الأسئلة
                            </button>
                            <button onClick={handleResetQuestions} className="px-4 py-2 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold transition-all">
                                إعادة ضبط المصنع
                            </button>
                        </>
                    )}
                </div>
            </div>

            {subTab === 'history' ? (
                <div className="bg-white dark:bg-[#181818] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg">بنك بيانات التقييمات المنجزة</h3>
                            <span className="text-[10px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1 rounded-full font-bold">{history.length} سجلات</span>
                        </div>
                        {history.length > 0 && (
                            <button 
                                type="button"
                                onClick={confirmDeleteAll}
                                className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-2 relative z-10"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                حذف جميع المشاريع
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
                                        <th className="p-4 border-b border-slate-200 dark:border-slate-800">المشروع</th>
                                        <th className="p-4 border-b border-slate-200 dark:border-slate-800">صاحب التقييم</th>
                                        <th className="p-4 border-b border-slate-200 dark:border-slate-800">الجهة</th>
                                        <th className="p-4 border-b border-slate-200 dark:border-slate-800 text-center">النتيجة</th>
                                        <th className="p-4 border-b border-slate-200 dark:border-slate-800 text-left">التاريخ</th>
                                        <th className="p-4 border-b border-slate-200 dark:border-slate-800 text-center">إجراء</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-20 text-center text-slate-400 italic text-sm">لا توجد تقييمات مسجلة في النظام.</td>
                                        </tr>
                                    ) : history.map(item => (
                                        <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-blue-500/[0.02] transition-colors group">
                                            <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{item.projectInfo.projectName}</td>
                                            <td className="p-4 text-slate-600 dark:text-slate-400">{item.projectInfo.userName}</td>
                                            <td className="p-4 text-slate-600 dark:text-slate-400">{item.projectInfo.organization}</td>
                                            <td className="p-4">
                                                <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1 w-20 mx-auto">
                                                    <span className={`font-mono font-bold text-lg ${getColorClass(item.classification).replace('text-', 'text-opacity-80 text-')}`}>{item.percentage}%</span>
                                                    <span className={`text-[9px] uppercase font-bold ${getColorClass(item.classification)}`}>{item.classification}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs font-mono text-slate-400 text-left" dir="ltr">{item.date}</td>
                                            <td className="p-4 text-center">
                                                <button 
                                                    type="button"
                                                    onClick={() => confirmDelete(item.id)} 
                                                    className="relative z-10 p-2 text-slate-300 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                                                    title="حذف هذا المشروع"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-center">
                        <button 
                            onClick={handleAddDomain}
                            className="flex items-center gap-2 px-8 py-4 bg-[#4a3856] dark:bg-[#e8654f] hover:bg-[#4a3856]/90 dark:hover:bg-[#e8654f]/90 text-white rounded-2xl font-bold shadow-xl shadow-[#4a3856]/20 dark:shadow-[#e8654f]/20 transition-all active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                            إضافة مسار تقييم جديد
                        </button>
                    </div>

                    {domains.map((domain, dIdx) => (
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
                                        onClick={(e) => { e.stopPropagation(); handleDeleteDomain(dIdx); }}
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
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, dIdx, qIdx)}
                                            onDragOver={(e) => handleDragOver(e, dIdx, qIdx)}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <div className="flex gap-4 items-start">
                                                <div className="flex flex-col gap-1 items-center opacity-40 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 mt-3">
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
                                                                onClick={() => handleDeleteQuestion(dIdx, qIdx)} 
                                                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
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
                    ))}
                    
                    <div className="pt-8 text-center">
                        <p className="text-[11px] text-slate-400 font-medium">يتم مزامنة جميع التغييرات لحظياً مع الذاكرة المحلية للمتصفح.</p>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#181818] rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                                <svg className="h-6 w-6 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">تأكيد الحذف</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                {deleteMode === 'all' 
                                    ? `هل أنت متأكد من رغبتك في حذف جميع السجلات (${history.length} سجل)؟ هذا الإجراء خطير ولا يمكن التراجع عنه.`
                                    : "هل أنت متأكد من رغبتك في حذف هذا السجل نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
                                }
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
                                    {isDeleting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            جاري الحذف...
                                        </>
                                    ) : (deleteMode === 'all' ? 'نعم، احذف الكل' : 'نعم، احذف')}
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
