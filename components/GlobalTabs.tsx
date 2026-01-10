
import React from 'react';
import type { UserSession } from '../types';

type Tab = 'guide' | 'assessment' | 'dashboard' | 'admin';

interface GlobalTabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  session: UserSession;
}

const TABS: { id: Tab; label: string; roles: string[] }[] = [
  { id: 'guide', label: 'الدليل التعريفي', roles: ['user'] },
  { id: 'assessment', label: 'المقياس التقني', roles: ['user'] },
  { id: 'dashboard', label: 'لوحة التحكم', roles: ['admin', 'user'] },
  { id: 'admin', label: 'إدارة النظام', roles: ['admin'] },
];

const GlobalTabs: React.FC<GlobalTabsProps> = ({ activeTab, setActiveTab, session }) => {
  return (
    <div className="flex space-x-4 -mb-px overflow-x-auto scrollbar-hide">
      {TABS.map((tab) => {
        if (!tab.roles.includes(session.role)) return null;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative px-3 py-3 text-sm font-bold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t-md whitespace-nowrap"
            aria-pressed={activeTab === tab.id}
          >
            <span className={activeTab === tab.id ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-full dark:shadow-[0_0_8px_1px_#3b82f6]"></div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default GlobalTabs;
