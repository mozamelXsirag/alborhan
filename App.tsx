
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import GuideTab from './components/GuideTab';
import AssessmentTab from './components/AssessmentTab';
import DashboardTab from './components/DashboardTab';
import AdminTab from './components/AdminTab';
import LandingTab from './components/LandingTab';
import ThemeSwitcher from './components/ThemeSwitcher';
import Footer from './components/Footer';
import PrivacyPolicyTab from './components/PrivacyPolicyTab';
import { useToast } from './contexts/ToastContext';
import type { UserSession } from './types';

type Tab = 'landing' | 'guide' | 'assessment' | 'dashboard' | 'admin' | 'privacy';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('landing');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  
  // تحديث الحالات لتشمل اسم المستخدم وكلمة المرور
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [isFloatingExpanded, setIsFloatingExpanded] = useState(false);
  const { showToast } = useToast();
  
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Scroll to top when activeTab changes
  useEffect(() => {
    if (mainContentRef.current) {
        mainContentRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  const [session, setSession] = useState<UserSession>(() => {
    const saved = sessionStorage.getItem('burhan_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // استعادة الجلسة فقط للمسؤولين، أما المستخدم العادي فيتم تسجيل خروجه عند التحديث
        if (parsed.role === 'admin') {
          return parsed;
        }
      } catch (e) {
        console.error("Session parse error", e);
      }
    }
    return { role: 'user', name: 'ضيف' };
  });

  const isUser = session.role === 'user';

  const handleAdminAuth = (e: React.FormEvent) => {
      e.preventDefault();
      // التحقق من اسم المستخدم وكلمة المرور
      if (adminUsername === 'admin' && adminPassword === '12345678') {
          const newSession: UserSession = { role: 'admin', name: 'المسؤول' };
          setSession(newSession);
          sessionStorage.setItem('burhan_session', JSON.stringify(newSession));
          setIsAdminModalOpen(false);
          setAdminUsername('');
          setAdminPassword('');
          setActiveTab('admin');
          showToast("تم تفعيل وضع الإدارة بنجاح", "success");
      } else {
          showToast("اسم المستخدم أو كلمة المرور غير صحيحة", "error");
          setAdminPassword(''); // مسح كلمة المرور فقط عند الخطأ
      }
  };

  const handleLogout = () => {
    const isEditing = activeTab === 'assessment';
    if (isEditing && !confirm("هل تريد تسجيل الخروج؟ قد تفقد البيانات غير المحفوظة.")) return;
    
    const guestSession: UserSession = { role: 'user', name: 'ضيف' };
    setSession(guestSession);
    sessionStorage.setItem('burhan_session', JSON.stringify(guestSession));
    setActiveTab('landing');
    showToast("تم تسجيل الخروج", "info");
  };

  const handleAssessmentExit = () => {
    const guestSession: UserSession = { role: 'user', name: 'ضيف' };
    setSession(guestSession);
    sessionStorage.setItem('burhan_session', JSON.stringify(guestSession));
    setActiveTab('landing');
    showToast("تم إنهاء الجلسة والعودة للرئيسية", "info");
  };

  const handleLogoClick = () => {
    // إذا كان في شاشة التقييم، يتم الخروج فوراً للرئيسية كما هو مطلوب
    if (activeTab === 'assessment') {
        handleAssessmentExit();
    } else {
        setActiveTab('landing');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'landing':
        // إذا كان المستخدم مسؤولاً، ينتقل للوحة التحكم أو الإدارة، وإلا للدليل
        return <LandingTab onEnter={() => setActiveTab(session.role === 'admin' ? 'admin' : 'guide')} />;
      case 'assessment':
        return <AssessmentTab onExit={handleAssessmentExit} />;
      case 'dashboard':
        return <DashboardTab session={session} />;
      case 'admin':
        return session.role === 'admin' ? <AdminTab /> : <GuideTab onStart={() => setActiveTab('assessment')} />;
      case 'privacy':
        return <PrivacyPolicyTab onBack={() => setActiveTab('landing')} />;
      case 'guide':
      default:
        return <GuideTab onStart={() => setActiveTab('assessment')} />;
    }
  };

  // If we are on landing page, we don't show the main layout shell
  if (activeTab === 'landing') {
    return (
      <>
        {renderContent()}
        {/* We can still show footer on landing page but styled specifically or just inside LandingTab if needed, 
            but usually LandingTab is full screen. Let's pass the footer inside App for non-landing tabs */}
      </>
    );
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0c0c0c] font-sans" dir="rtl">
        {/* Sidebar Navigation - Only shown for Admin */}
        {!isUser && (
          <Sidebar 
            activeTab={activeTab as any} 
            setActiveTab={(tab) => setActiveTab(tab as Tab)} 
            session={session} 
            onAdminClick={() => setIsAdminModalOpen(true)}
            onLogout={handleLogout}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Universal Top Header */}
          <header className="h-20 flex-shrink-0 bg-white/70 dark:bg-[#121212]/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-30">
             <div className="w-full h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    {isUser ? (
                        // Logo for Normal Users (Since sidebar is hidden)
                        <div 
                            onClick={handleLogoClick}
                            className="flex items-center gap-3 animate-in fade-in duration-500 cursor-pointer hover:opacity-80 transition-all group"
                            title="العودة للشاشة الرئيسية"
                        >
                            <div className="w-10 h-10 text-[#4a3856] dark:text-[#e8654f] fill-current group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 282.84 284.44" className="w-full h-full drop-shadow-md">
                                  <g id="Layer_1-2" data-name="Layer 1">
                                    <path d="M131.09,284.44l72.83-102.67,50.58,35.98-.04,26.07-28.88,40.62h0c31.62,0,57.26-25.64,57.26-57.26v-26.88s-86.28-61.34-86.28-61.34l-74.36,104.59-62.76-44.62L178.43,31.59l104.41,74.24v-48.57c0-31.62-25.64-57.26-57.26-57.26H57.26C25.64,0,0,25.64,0,57.26v169.92c0,31.62,25.64,57.26,57.26,57.26h73.83Z"/>
                                  </g>
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight">مقياس البرهان</h1>
                                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">إصدار V2.0</p>
                            </div>
                        </div>
                    ) : (
                        // Header for Admin (Sidebar visible)
                        <>
                            <div 
                                className="lg:hidden cursor-pointer"
                                onClick={handleLogoClick}
                            >
                               <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-white">مقياس البرهان</h1>
                            </div>
                            <div className="hidden lg:block">
                               <p className="text-[10px] md:text-xs font-black text-[#4a3856] dark:text-[#e8654f] uppercase tracking-[0.3em] mb-0.5">القسم الحالي</p>
                               <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                  {activeTab === 'guide' && 'الدليل الإرشادي'}
                                  {activeTab === 'assessment' && 'المقياس التقني'}
                                  {activeTab === 'dashboard' && 'لوحة النتائج'}
                                  {activeTab === 'admin' && 'لوحة التحكم المركزية'}
                                  {activeTab === 'privacy' && 'سياسة الخصوصية'}
                               </h2>
                            </div>
                        </>
                    )}
                 </div>

                 <div className="flex items-center gap-3">
                    <ThemeSwitcher />
                    
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2"></div>
                    
                    {session.role !== 'admin' ? (
                      <button 
                        onClick={() => setIsAdminModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800/50 hover:bg-[#4a3856] dark:hover:bg-[#e8654f] hover:text-white text-slate-600 dark:text-slate-400 font-bold text-sm rounded-xl transition-all group"
                      >
                        <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>دخول المسؤول</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="hidden sm:inline-block text-[10px] bg-red-500/10 text-red-500 px-3 py-1 rounded-full border border-red-500/20 font-black uppercase">ADMIN ACTIVE</span>
                        <button 
                          onClick={handleLogout}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          title="خروج من وضع المسؤول"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </button>
                      </div>
                    )}
                 </div>
             </div>
          </header>

          <main ref={mainContentRef} className="flex-1 overflow-y-auto scroll-smooth flex flex-col">
            <div className="flex-grow pb-12">
                <div className="w-full max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </div>
            <Footer 
                onPrivacyClick={() => setActiveTab('privacy')} 
                onAboutClick={() => setActiveTab('guide')}
                onHomeClick={handleLogoClick}
            />
          </main>

          {/* Background Decor */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4a3856]/[0.03] dark:bg-[#e8654f]/[0.03] blur-[150px] rounded-full pointer-events-none -mr-48 -mt-48"></div>
        </div>

        {/* Floating Side Button */}
        <a 
          href="https://tasks.moddaker.com/ar" 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => {
            const isTouchDevice = window.matchMedia('(hover: none)').matches;
            if (isTouchDevice && !isFloatingExpanded) {
                e.preventDefault();
                setIsFloatingExpanded(true);
            }
          }}
          onMouseLeave={() => setIsFloatingExpanded(false)}
          onBlur={() => setIsFloatingExpanded(false)}
          className={`fixed right-0 top-1/2 -translate-y-1/2 z-[90] flex items-center bg-orange-500 hover:bg-orange-600 text-white rounded-l-xl shadow-lg transition-all duration-300 ease-out group ${
            isFloatingExpanded ? 'pl-4 pr-3' : 'p-3 hover:pl-4 hover:pr-3'
          }`}
          title="نظام المهام"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chat-left-text-fill flex-shrink-0" viewBox="0 0 16 16">
              <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4.414a1 1 0 0 0-.707.293L.854 15.146A.5.5 0 0 1 0 14.793zm3.5 1a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1zm0 2.5a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1zm0 2.5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1z"/>
            </svg>
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 font-bold text-sm ${
                isFloatingExpanded ? 'max-w-[100px] opacity-100 mr-2' : 'max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 group-hover:mr-2'
            }`}>
                رأيك يهمنا
            </span>
        </a>

        {/* Admin Login Modal */}
        {isAdminModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-white dark:bg-[#181818] w-full max-w-sm rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.3)] dark:shadow-[0_0_50px_rgba(59,130,246,0.1)] overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="p-10 text-center">
                        <div className="flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 282.84 284.44" className="w-16 h-16 text-[#4a3856] dark:text-white fill-current drop-shadow-2xl">
                              <g id="Layer_1-2" data-name="Layer 1">
                                <path d="M131.09,284.44l72.83-102.67,50.58,35.98-.04,26.07-28.88,40.62h0c31.62,0,57.26-25.64,57.26-57.26v-26.88s-86.28-61.34-86.28-61.34l-74.36,104.59-62.76-44.62L178.43,31.59l104.41,74.24v-48.57c0-31.62-25.64-57.26-57.26-57.26H57.26C25.64,0,0,25.64,0,57.26v169.92c0,31.62,25.64,57.26,57.26,57.26h73.83Z"/>
                              </g>
                            </svg>
                        </div>
                        <h3 className="text-2xl font-black mb-1 tracking-tight text-slate-900 dark:text-white">بوابة الإدارة</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">تسجيل الدخول للوحة التحكم</p>
                        
                        <form onSubmit={handleAdminAuth} className="space-y-4 text-right">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-2">اسم المستخدم</label>
                                <input 
                                    type="text" 
                                    value={adminUsername}
                                    onChange={(e) => setAdminUsername(e.target.value)}
                                    className="w-full p-4 bg-slate-100 dark:bg-slate-900/80 border-2 border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-bold"
                                    autoFocus
                                    placeholder="اسم المستخدم"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-2">كلمة المرور</label>
                                <input 
                                    type="password" 
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    className="w-full p-4 bg-slate-100 dark:bg-slate-900/80 border-2 border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-bold tracking-widest"
                                    placeholder="كلمة المرور"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => { setIsAdminModalOpen(false); setAdminUsername(''); setAdminPassword(''); }}
                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-xl hover:bg-slate-200 transition-all active:scale-95 text-sm"
                                >
                                    إلغاء
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-3 bg-[#4a3856] dark:bg-[#e8654f] text-white font-black rounded-xl hover:bg-blue-500 transition-all shadow-xl shadow-[#4a3856]/20 dark:shadow-[#e8654f]/20 active:scale-95 text-sm"
                                >
                                    دخول
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}
      </div>
    </>
  );
};

export default App;
