
import React from 'react';
import type { Domain, DomainScore } from '../types';

interface SidebarProps {
  domains: Domain[];
  scores: { [key: string]: DomainScore };
  completions: { [key: string]: number };
  activeDomainKey: string;
}

const DomainSidebar: React.FC<SidebarProps> = ({ domains, scores, completions, activeDomainKey }) => {
  return (
    <nav className="bg-white dark:bg-[#181818] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 px-2">الأقسام</h2>
      <ul className="space-y-1">
        {domains.map((domain, index) => {
          const isActive = domain.key === activeDomainKey;
          const completionPercentage = completions[domain.key] || 0;
          
          return (
            <li key={domain.key}>
              <a
                href={`#${domain.key}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(domain.key)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }}
                className={`block p-2 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-[#4a3856]/10 dark:bg-[#e8654f]/20'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3 overflow-hidden">
                       <span className={`flex items-center justify-center w-6 h-6 text-xs font-bold rounded-md flex-shrink-0 ${isActive ? 'bg-[#4a3856] dark:bg-[#e8654f] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                           {index + 1}
                       </span>
                       <span className={`font-semibold truncate ${isActive ? 'text-[#4a3856] dark:text-[#e8654f]' : 'text-slate-700 dark:text-slate-300'}`}>{domain.title}</span>
                    </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                    <div 
                        className={`h-1.5 rounded-full ${isActive ? 'bg-[#4a3856] dark:bg-[#e8654f]' : 'bg-cyan-500'}`} 
                        style={{ width: `${completionPercentage}%`, transition: 'width 0.5s ease-in-out' }}
                    ></div>
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default DomainSidebar;
