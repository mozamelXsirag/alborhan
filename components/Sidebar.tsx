
import React from 'react';
import type { UserSession } from '../types';

type Tab = 'landing' | 'guide' | 'assessment' | 'dashboard' | 'admin';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  session: UserSession;
  onAdminClick: () => void;
  onLogout: () => void;
}

interface NavItem {
  id: Exclude<Tab, 'landing'>;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { 
    id: 'guide', 
    label: 'الدليل التعريفي', 
    roles: ['user'],
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
  },
  { 
    id: 'assessment', 
    label: 'المقياس التقني', 
    roles: ['user'],
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
  },
  { 
    id: 'dashboard', 
    label: 'لوحة التحكم', 
    roles: ['admin', 'user'],
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  },
  { 
    id: 'admin', 
    label: 'إدارة النظام', 
    roles: ['admin'],
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, session, onAdminClick, onLogout }) => {
  return (
    <aside className="hidden lg:flex flex-col w-[280px] h-screen bg-white dark:bg-[#121212] border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50">
      {/* Brand Header - Now Clickable */}
      <div className="p-8 pb-10">
        <div 
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-4 mb-2 cursor-pointer hover:opacity-80 transition-all group"
          title="العودة لشاشة الهبوط"
        >
            <div className="flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 282.84 284.44" className="w-12 h-12 text-[#4a3856] dark:text-white fill-current">
                  <g id="Layer_1-2" data-name="Layer 1">
                    <path d="M131.09,284.44l72.83-102.67,50.58,35.98-.04,26.07-28.88,40.62h0c31.62,0,57.26-25.64,57.26-57.26v-26.88s-86.28-61.34-86.28-61.34l-74.36,104.59-62.76-44.62L178.43,31.59l104.41,74.24v-48.57c0-31.62-25.64-57.26-57.26-57.26H57.26C25.64,0,0,25.64,0,57.26v169.92c0,31.62,25.64,57.26,57.26,57.26h73.83Z"/>
                  </g>
                </svg>
            </div>
            <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">مقياس البرهان</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">إصدار V2.0</p>
            </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isVisible = item.roles.includes(session.role);
          if (!isVisible) return null;

          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all group relative overflow-hidden ${
                isActive 
                ? 'bg-[#4a3856] dark:bg-[#e8654f] text-white shadow-xl shadow-[#4a3856]/20 dark:shadow-[#e8654f]/20' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span className="text-sm">{item.label}</span>
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-l-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-6 mt-auto space-y-4">
        <div className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest pb-2 opacity-30">
            Powered by Burhan
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
