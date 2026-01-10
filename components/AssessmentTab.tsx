
import React, { useState, useMemo, useEffect } from 'react';
import { getActiveDomains } from '../constants';
import type { Answers, DomainScore, AssessmentHistoryItem, ProjectInfo, Domain } from '../types';
import QuestionBlock from './QuestionBlock';
import DomainSidebar from './DomainSidebar';
import AssessmentReport from './AssessmentReport';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';

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

// New Classification Logic (5 Levels)
const getClassification = (pct: number): string => {
    if (pct <= 20) return "ضعيف";       // 0-20%
    if (pct <= 40) return "تأسيسي";     // 21-40%
    if (pct <= 60) return "مستقر";      // 41-60%
    if (pct <= 80) return "متقدم";      // 61-80%
    return "رائد";                      // 81-100%
};

interface AssessmentTabProps {
    onExit?: () => void;
}

const AssessmentTab: React.FC<AssessmentTabProps> = ({ onExit }) => {
  const [domains, setDomains] = useState<Domain[]>(getActiveDomains());
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [tempInfo, setTempInfo] = useState<ProjectInfo>({ 
    userName: '', 
    projectName: '', 
    organization: '', 
    email: '',
    phone: ''
  });
  
  // State for form validation errors
  const [formErrors, setFormErrors] = useState<{ [key in keyof ProjectInfo]?: string }>({});

  // State for Cancel Modal
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { showToast } = useToast();
  
  const [answers, setAnswers] = useState<Answers>(() => {
    return domains.reduce((acc, domain) => {
      acc[domain.key] = Array(domain.questions.length).fill(null);
      return acc;
    }, {} as Answers);
  });

  const [activeDomainKey, setActiveDomainKey] = useState<string>(domains[0]?.key || "");
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { totals, completion, scorePercentage, rawScore, domainCompletions } = useMemo(() => {
    const perDomain: { [key: string]: DomainScore } = {};
    const localDomainCompletions: { [key: string]: number } = {};
    let totalNormalizedScore = 0;
    let answeredQuestions = 0;
    const totalQuestions = domains.reduce((sum, d) => sum + d.questions.length, 0);
    const maxPossibleScore = domains.length * 25; // 175 for 7 domains

    domains.forEach(domain => {
      let domainWeightedScore = 0;
      let domainMaxScore = 0;
      let domainAnsweredCount = 0;

      domain.questions.forEach((q, index) => {
        const answer = answers[domain.key][index];
        const multiplier = getMultiplier(q.weight);
        domainMaxScore += 4 * multiplier;
        if (answer !== null) {
          answeredQuestions++;
          domainAnsweredCount++;
          domainWeightedScore += getAnswerPoints(answer) * multiplier;
        }
      });
      
      // Calculate normalized score for this domain (out of 25)
      const score = domainMaxScore > 0 ? (domainWeightedScore / domainMaxScore) * 25 : 0;
      perDomain[domain.key] = { title: domain.title, score: parseFloat(score.toFixed(1)) };
      totalNormalizedScore += score;
      
      // Calculate completion percentage for this domain
      localDomainCompletions[domain.key] = domain.questions.length > 0 
          ? (domainAnsweredCount / domain.questions.length) * 100 
          : 0;
    });

    // Calculate percentage based on totalNormalizedScore out of 175
    const finalPercentage = maxPossibleScore > 0 ? (totalNormalizedScore / maxPossibleScore) * 100 : 0;
    
    return {
      totals: { perDomain },
      completion: { count: answeredQuestions, total: totalQuestions, pct: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0 },
      scorePercentage: Math.round(finalPercentage),
      rawScore: totalNormalizedScore, // This is now sum of normalized scores (max 175)
      domainCompletions: localDomainCompletions
    };
  }, [answers, domains]);

  const validateForm = () => {
      const errors: { [key in keyof ProjectInfo]?: string } = {};
      let isValid = true;

      // Required Fields
      if (!tempInfo.userName.trim()) {
          errors.userName = "يرجى إدخال اسم طالب التقييم";
          isValid = false;
      }
      
      if (!tempInfo.projectName.trim()) {
          errors.projectName = "يرجى إدخال اسم المشروع التقني";
          isValid = false;
      }

      // Organization Validation (Now Required)
      if (!tempInfo.organization.trim()) {
          errors.organization = "يرجى إدخال اسم الجهة / المؤسسة";
          isValid = false;
      }
      
      // Email Validation (Now Required)
      if (!tempInfo.email.trim()) {
          errors.email = "يرجى إدخال البريد الإلكتروني";
          isValid = false;
      } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(tempInfo.email.trim())) {
              errors.email = "صيغة البريد الإلكتروني غير صحيحة";
              isValid = false;
          }
      }

      // Phone Validation (Now Required & International)
      if (!tempInfo.phone.trim()) {
          errors.phone = "يرجى إدخال رقم الجوال";
          isValid = false;
      } else {
          // Allow international format: + (optional), followed by 7 to 15 digits
          const internationalPhoneRegex = /^\+?[0-9]{7,15}$/;
          if (!internationalPhoneRegex.test(tempInfo.phone.trim())) {
              errors.phone = "يرجى إدخال رقم هاتف صحيح (أرقام فقط، يمكن أن يبدأ بـ +)";
              isValid = false;
          }
      }

      setFormErrors(errors);
      return isValid;
  };

  const handleStart = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!validateForm()) {
          showToast("يرجى التحقق من البيانات المدخلة", 'error');
          return;
      }

      setProjectInfo(tempInfo);
      
      const currentSessionRaw = sessionStorage.getItem('burhan_session');
      const currentSession = currentSessionRaw ? JSON.parse(currentSessionRaw) : {};
      sessionStorage.setItem('burhan_session', JSON.stringify({...currentSession, name: tempInfo.userName}));
      
      showToast(`بدأ تقييم مشروع: ${tempInfo.projectName}`, 'info');
  };

  const handleCancelClick = () => {
      setShowCancelModal(true);
  };

  const confirmExit = () => {
      setShowCancelModal(false);
      // Reset internal state
      setProjectInfo(null);
      setTempInfo({ userName: '', projectName: '', organization: '', email: '', phone: '' });
      
      if (onExit) {
          onExit();
      } else {
          // Fallback: Reload page to force reset if onExit is missing
          window.location.reload();
      }
  };

  const handleSave = async () => {
      if (completion.pct < 100) {
          setValidationAttempted(true);
          showToast("يرجى الإجابة على جميع المعايير التقنية لحساب النتيجة النهائية", 'error');
          const firstError = document.querySelector('.border-red-500');
          if (firstError) {
              firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
      }
      
      setIsSaving(true);
      const classification = getClassification(scorePercentage);
      
      const historyItem: AssessmentHistoryItem = {
          id: crypto.randomUUID(),
          projectInfo: projectInfo!,
          // Change Date format to English (en-US)
          date: new Date().toLocaleString('en-US'),
          score: rawScore,
          maxScore: 175,
          classification: classification,
          percentage: scorePercentage,
          detailedAnswers: answers
      };
      
      try {
          await api.saveAssessment(historyItem);
          
          setIsSubmitted(true);
          showToast("تم مزامنة البيانات وحفظ النتيجة في قاعدة البيانات المركزية", 'success');
      } catch (error) {
          showToast("حدث خطأ أثناء الاتصال بقاعدة البيانات", 'error');
      } finally {
          setIsSaving(false);
      }
  };

  // Helper to clear error when user types
  const handleInputChange = (field: keyof ProjectInfo, value: string) => {
      // For phone, only allow numbers and + at start
      if (field === 'phone') {
          if (!/^\+?[0-9]*$/.test(value)) return;
      }

      setTempInfo(prev => ({ ...prev, [field]: value }));
      if (formErrors[field]) {
          setFormErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[field];
              return newErrors;
          });
      }
  };

  if (isSubmitted && projectInfo) {
      const classification = getClassification(scorePercentage);
      return (
          <div className="p-4 md:p-8 lg:px-12">
            <AssessmentReport 
                projectInfo={projectInfo}
                totals={totals.perDomain}
                finalScore={rawScore}
                percentage={scorePercentage}
                classification={classification}
                onReset={() => {
                    if (onExit) {
                        onExit();
                    } else {
                        sessionStorage.removeItem('burhan_session');
                        window.location.reload();
                    }
                }}
            />
          </div>
      );
  }

  if (!projectInfo) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-white dark:bg-[#181818] p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#4a3856]/5 dark:bg-[#e8654f]/5 blur-[80px] rounded-full -mr-32 -mt-32"></div>
          
          <div className="relative z-10">
            <header className="text-center mb-10">
              <h2 className="text-[20px] md:text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">إعداد جلسة تقييم جديدة</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base">أدخل بيانات المشروع للبدء في تطبيق معايير النضج</p>
            </header>

            <form onSubmit={handleStart} className="space-y-6">
              {/* Row 1: Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-widest mr-2">اسم طالب التقييم <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={tempInfo.userName} 
                    onChange={e => handleInputChange('userName', e.target.value)} 
                    className={`w-full p-4 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none transition-all font-bold text-sm md:text-base ${
                        formErrors.userName 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/10 focus:ring-4 focus:ring-red-500/10' 
                        : 'border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-[#4a3856]/10 dark:focus:ring-[#e8654f]/10 focus:border-[#4a3856] dark:focus:border-[#e8654f]'
                    }`}
                    placeholder="مثال: م. أحمد علي" 
                  />
                  {formErrors.userName && <p className="text-red-500 text-xs font-bold mr-2 mt-1">{formErrors.userName}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-widest mr-2">اسم المشروع التقني <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={tempInfo.projectName} 
                    onChange={e => handleInputChange('projectName', e.target.value)} 
                    className={`w-full p-4 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none transition-all font-bold text-sm md:text-base ${
                        formErrors.projectName 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/10 focus:ring-4 focus:ring-red-500/10' 
                        : 'border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-[#4a3856]/10 dark:focus:ring-[#e8654f]/10 focus:border-[#4a3856] dark:focus:border-[#e8654f]'
                    }`}
                    placeholder="مثال: منصة برهان الرقمية" 
                  />
                  {formErrors.projectName && <p className="text-red-500 text-xs font-bold mr-2 mt-1">{formErrors.projectName}</p>}
                </div>
              </div>

              {/* Row 2: Organization */}
              <div className="space-y-2">
                  <label className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-widest mr-2">الجهة / المؤسسة <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={tempInfo.organization} 
                    onChange={e => handleInputChange('organization', e.target.value)} 
                    className={`w-full p-4 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none transition-all font-bold text-sm md:text-base ${
                        formErrors.organization 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/10 focus:ring-4 focus:ring-red-500/10' 
                        : 'border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-[#4a3856]/10 dark:focus:ring-[#e8654f]/10 focus:border-[#4a3856] dark:focus:border-[#e8654f]'
                    }`}
                    placeholder="اسم الجهة المالكة للمشروع" 
                  />
                  {formErrors.organization && <p className="text-red-500 text-xs font-bold mr-2 mt-1">{formErrors.organization}</p>}
              </div>

              {/* Row 3: Contact Info (Split) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-widest mr-2">رقم الجوال <span className="text-red-500">*</span></label>
                  <input 
                    type="tel" 
                    value={tempInfo.phone} 
                    onChange={e => handleInputChange('phone', e.target.value)} 
                    className={`w-full p-4 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none transition-all font-bold font-mono text-left text-sm md:text-base ${
                        formErrors.phone 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/10 focus:ring-4 focus:ring-red-500/10' 
                        : 'border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-[#4a3856]/10 dark:focus:ring-[#e8654f]/10 focus:border-[#4a3856] dark:focus:border-[#e8654f]'
                    }`}
                    placeholder="+9665xxxxxxxx" 
                    dir="ltr"
                  />
                   {formErrors.phone && <p className="text-red-500 text-xs font-bold mr-2 mt-1">{formErrors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-widest mr-2">البريد الإلكتروني <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    value={tempInfo.email} 
                    onChange={e => handleInputChange('email', e.target.value)} 
                    className={`w-full p-4 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none transition-all font-bold text-left text-sm md:text-base ${
                        formErrors.email 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/10 focus:ring-4 focus:ring-red-500/10' 
                        : 'border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-[#4a3856]/10 dark:focus:ring-[#e8654f]/10 focus:border-[#4a3856] dark:focus:border-[#e8654f]'
                    }`}
                    placeholder="user@example.com" 
                    dir="ltr"
                  />
                   {formErrors.email && <p className="text-red-500 text-xs font-bold mr-2 mt-1">{formErrors.email}</p>}
                </div>
              </div>

              <div className="pt-6">
                <button 
                  type="submit" 
                  className="w-full py-5 bg-[#4a3856] dark:bg-[#e8654f] hover:bg-[#4a3856]/90 dark:hover:bg-[#e8654f]/90 text-white font-black rounded-[1.5rem] transition-all shadow-xl shadow-[#4a3856]/20 dark:shadow-[#e8654f]/20 flex items-center justify-center gap-3 active:scale-95 text-lg"
                >
                    البدء في تعبئة المعايير
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 lg:px-12 relative">
        <header className="mb-10 bg-white dark:bg-[#181818] p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-full bg-[#4a3856]/5 dark:bg-[#e8654f]/5 -mr-16 rotate-12"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                {/* Right Side: Project & Main Info */}
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-[#4a3856] dark:bg-[#e8654f] rounded-2xl flex items-center justify-center shadow-xl shadow-[#4a3856]/20 dark:shadow-[#e8654f]/20 flex-shrink-0">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight mb-1">{projectInfo.projectName}</h3>
                         <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                             <span>{projectInfo.userName}</span>
                         </div>
                    </div>
                </div>

                {/* Left Side: Additional Details */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {projectInfo.organization && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl">
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{projectInfo.organization}</span>
                        </div>
                    )}
                    
                    {projectInfo.phone && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl">
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono" dir="ltr">{projectInfo.phone}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl ml-auto md:ml-0">
                         <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                         <span className="text-xs font-black text-blue-600 dark:text-blue-400">مكتمل: {completion.pct}%</span>
                    </div>

                    <button
                        type="button"
                        onClick={handleCancelClick}
                        className="group flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all text-xs"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="hidden sm:inline">إلغاء وعودة</span>
                    </button>
                </div>
            </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="w-full lg:w-[320px] lg:sticky lg:top-8 order-2 lg:order-2">
            <DomainSidebar 
                domains={domains} 
                scores={totals.perDomain} 
                completions={domainCompletions}
                activeDomainKey={activeDomainKey} 
            />
          </aside>
          
          <div className="flex-1 min-w-0 order-1 lg:order-1 space-y-10 w-full">
            {domains.map((domain, domainIndex) => (
                <section 
                    key={domain.key} 
                    id={domain.key} 
                    className="bg-white dark:bg-[#181818] p-6 md:p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm scroll-mt-24"
                    onMouseEnter={() => setActiveDomainKey(domain.key)}
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-10">
                        <div className="flex items-center gap-5">
                            <span className="w-12 h-12 bg-[#4a3856] dark:bg-[#e8654f] text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-[#4a3856]/20 dark:shadow-[#e8654f]/20 transform -rotate-2">
                                {domainIndex + 1}
                            </span>
                            <div>
                               <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight">{domain.title}</h2>
                               <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">معايير هذا المسار التقني</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-8">
                        {domain.questions.map((q, qIndex) => (
                            <QuestionBlock
                                key={q.id}
                                id={`question-${domainIndex}-${qIndex}`} // Unique ID for scrolling
                                domainKey={domain.key} question={q} questionIndex={qIndex}
                                answer={answers[domain.key][qIndex]}
                                onAnswerChange={(dk, idx, val) => {
                                    setAnswers(prev => ({...prev, [dk]: prev[dk].map((a, i) => i === idx ? val : a)}));
                                    
                                    // Auto-scroll logic for small screens
                                    if (window.innerWidth < 768) {
                                        setTimeout(() => {
                                            // Try next question in the same domain
                                            let nextElement = document.getElementById(`question-${domainIndex}-${idx + 1}`);
                                            
                                            // If not found (end of domain), try first question of next domain
                                            if (!nextElement) {
                                                nextElement = document.getElementById(`question-${domainIndex + 1}-0`);
                                            }
                                            
                                            if (nextElement) {
                                                nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }
                                        }, 250); // Slight delay for better UX
                                    }
                                }}
                                validationAttempted={validationAttempted}
                            />
                        ))}
                    </div>
                </section>
            ))}

            <div className="bg-white dark:bg-[#181818] p-12 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#4a3856] dark:via-[#e8654f] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="max-w-md mx-auto relative z-10">
                    <h4 className="text-2xl font-black mb-3 text-slate-900 dark:text-white tracking-tight">اكتمال المقياس</h4>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">
                        بمجرد حفظ البيانات، سيتم تخزينها في قاعدة البيانات المركزية لتمكنك والادارة من العودة إليها وتحليلها في أي وقت.
                    </p>
                    
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className={`w-full py-6 bg-[#4a3856] dark:bg-[#e8654f] hover:bg-[#4a3856]/90 dark:hover:bg-[#e8654f]/90 text-white font-black text-xl rounded-[2rem] transition-all shadow-2xl shadow-[#4a3856]/30 dark:shadow-[#e8654f]/30 flex items-center justify-center gap-4 active:scale-[0.98] ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isSaving ? 'جاري المزامنة...' : 'تأكيد وحفظ التقييم النهائي'}
                        {!isSaving && <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>}
                    </button>
                </div>
            </div>
          </div>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-[#181818] rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                        <svg className="h-6 w-6 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">تأكيد الإلغاء</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        هل أنت متأكد من رغبتك في إلغاء التقييم والعودة للرئيسية؟ ستفقد جميع البيانات المدخلة في هذه الجلسة.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => setShowCancelModal(false)}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            تراجع
                        </button>
                        <button
                            onClick={confirmExit}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
                        >
                            نعم، إلغاء وعودة
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AssessmentTab;
