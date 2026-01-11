
import React from 'react';

interface FooterProps {
  onPrivacyClick?: () => void;
  onHomeClick?: () => void;
  onAboutClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onPrivacyClick, onHomeClick, onAboutClick }) => {
  return (
    <footer className="w-full mt-auto py-8 px-6 border-t border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-[#0c0c0c]/50 backdrop-blur-sm transition-colors duration-300 relative">
      <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right relative z-10">
        
        {/* Logos Section (Right) */}
        <div className="flex items-center gap-4">
            {/* Technical Excellence Center Logo */}
            <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 opacity-90">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127 108" className="w-full h-full">
                      <g>
                        <path className="fill-slate-700 dark:fill-slate-300" d="M126.22,54.9v-.02s0-.01,0-.01c-.03-.06-.06-.12-.09-.18L95.17.72s-.03-.06-.06-.09c-.01-.02-.02-.04-.04-.06-.04-.07-.1-.12-.16-.17-.03-.03-.07-.05-.09-.07-.03-.03-.06-.05-.1-.07-.05-.03-.1-.05-.15-.07-.06-.02-.1-.04-.16-.05-.11-.03-.22-.03-.32-.03L32.25,0s.04.01.07.02c-.06-.01-.12-.02-.18-.02-.01,0-.02,0-.02,0-.04,0-.07,0-.11,0t-.02,0c-.05,0-.1.01-.15.03-.02,0-.06.01-.08.03-.06.02-.13.04-.19.08-.2.11-.38.29-.49.51-.01.03-.03.06-.04.09,0-.02,0-.04.02-.05L.21,54.57c-.14.18-.21.41-.21.66,0,.05,0,.1.01.14,0,.04,0,.07.02.11.02.12.07.24.13.35l30.6,52.97s-.02-.04-.03-.07c.05.1.11.19.18.28.04.05.08.09.12.13.01.01.02.02.03.03s.02.02.03.02c.03.03.07.05.1.07.05.03.12.06.17.09.02,0,.04.02.05.02.06.02.12.04.19.04.03,0,.06.01.1.02.07,0,.14,0,.21,0h0s61.86.25,61.86.25c.04,0,.07,0,.12,0,.1,0,.19-.01.27-.04.03,0,.06-.01.08-.03.06-.02.13-.04.19-.08h.02s0-.02.01-.02c.06-.03.12-.09.18-.13.05-.04.1-.1.14-.15.05-.07.1-.13.13-.21l31.11-53.02h0c.24-.34.29-.74.17-1.09ZM96.96,8.59l16.96,29.57c1.71,2.99-1.86,6.19-4.65,4.17l-23.82-17.28c-1.31-.95-1.7-2.73-.91-4.14l6.86-12.29c1.21-2.17,4.32-2.19,5.56-.03ZM52.38,2.4l34.31.05c2.43,0,3.97,2.62,2.78,4.75l-6.92,12.43c-.81,1.45-2.6,2.04-4.11,1.35l-27.38-12.48c-3.13-1.42-2.11-6.1,1.33-6.1ZM82.46,61.16c.02-1.7,1.37-3.1,3.07-3.16l24.68-.96c3.19-.12,4.57,3.99,1.95,5.81l-24.83,17.31c-2.13,1.48-5.04-.05-5.02-2.65l.15-16.35ZM76.54,39.09v29.85c0,3.12-3.37,5.07-6.07,3.51l-25.85-14.93c-2.7-1.56-2.7-5.46,0-7.01l25.85-14.93c2.7-1.56,6.07.39,6.07,3.51ZM44.24,8l29.11,13.27c2.37,1.08,2.52,4.38.26,5.68l-15.96,9.15c-1.52.87-3.46.36-4.34-1.16l-13.14-22.42c-1.58-2.69,1.24-5.81,4.08-4.52ZM32,14.73c.3-3.08,4.37-3.97,5.93-1.3l13.28,22.65c.9,1.53.37,3.5-1.17,4.39l-16.41,9.41c-2.25,1.29-5.02-.5-4.77-3.08l3.13-32.06ZM5.99,49.24l17.03-29.73c1.71-2.99,6.29-1.53,5.95,1.9l-2.91,29.66c-.16,1.63-1.53,2.87-3.16,2.88l-14.12.07c-2.46.01-4.01-2.65-2.79-4.78ZM22.82,90.31L5.98,61.17c-1.23-2.12.3-4.78,2.75-4.79l14.11-.06c1.65,0,3.04,1.25,3.19,2.9l2.73,29.2c.32,3.41-4.23,4.86-5.94,1.9ZM31.83,95.72l-3.02-32.34c-.24-2.57,2.51-4.35,4.76-3.07l17.7,10.08c1.6.91,2.1,2.99,1.09,4.53l-14.68,22.26c-1.66,2.52-5.57,1.54-5.85-1.46ZM41.13,96.25l13.53-20.5c.93-1.4,2.78-1.85,4.25-1.02l14.09,8.02c2.27,1.29,2.11,4.61-.27,5.69l-27.62,12.48c-2.92,1.32-5.74-2-3.98-4.67ZM86.33,107.27l-34.39-.14c-3.43-.01-4.43-4.69-1.3-6.1l27.28-12.32c1.5-.68,3.27-.1,4.09,1.33l7.11,12.47c1.22,2.13-.33,4.79-2.79,4.78ZM113.97,71.91l-17.27,29.44c-1.24,2.12-4.31,2.1-5.53-.03l-7.11-12.45c-.82-1.44-.41-3.26.95-4.2l24.38-16.99c2.81-1.96,6.31,1.28,4.58,4.24ZM112.41,54.59l-26.55,1.03c-1.82.07-3.33-1.4-3.32-3.22l.18-20.15c.02-2.59,2.97-4.08,5.07-2.56l26.37,19.13c2.45,1.78,1.28,5.66-1.75,5.78Z"/>
                                <path className="fill-[#db6f44]" d="M68.71,41.12l-18.07,10.43c-1.73,1-1.73,3.49,0,4.49l18.07,10.43c1.73,1,3.89-.25,3.89-2.24v-20.86c0-1.99-2.16-3.24-3.89-2.24Z"/>
                              </g>
                            </svg>
                        </div>
                        <span className="text-[8px] font-medium text-slate-500 dark:text-slate-400">مركز التميز التقني</span>
                    </div>

                    {/* Separator */}
                    <div className="h-8 w-px bg-slate-300 dark:bg-slate-700"></div>

                    {/* Original Logo and Text */}
                    <div 
                      className={`flex items-center justify-center md:justify-start gap-2 ${onHomeClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                      onClick={onHomeClick}
                      title="العودة للشاشة الرئيسية"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 282.84 284.44" className="w-5 h-5 text-[#4a3856] dark:text-[#e8654f] fill-current opacity-80">
                          <g id="Layer_1-2" data-name="Layer 1">
                          <path d="M131.09,284.44l72.83-102.67,50.58,35.98-.04,26.07-28.88,40.62h0c31.62,0,57.26-25.64,57.26-57.26v-26.88s-86.28-61.34-86.28-61.34l-74.36,104.59-62.76-44.62L178.43,31.59l104.41,74.24v-48.57c0-31.62-25.64-57.26-57.26-57.26H57.26C25.64,0,0,25.64,0,57.26v169.92c0,31.62,25.64,57.26,57.26,57.26h73.83Z"/>
                          </g>
                      </svg>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        مقياس البرهان التقني
                      </p>
                    </div>
                </div>

                {/* Centered Copyright Text */}
                <p className="text-[11px] text-slate-500 dark:text-slate-500 font-medium md:absolute md:left-1/2 md:-translate-x-1/2 mt-4 md:mt-0 order-3 md:order-2">
                  جميع الحقوق محفوظة © 2026 | الإصدار 2.0
                </p>

                {/* Links Section */}
                <div className="flex items-center gap-6 text-xs font-bold text-slate-500 dark:text-slate-400 order-2 md:order-3">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        if (onAboutClick) onAboutClick();
                      }}
                      className="hover:text-[#4a3856] dark:hover:text-[#e8654f] transition-colors duration-200 bg-transparent border-none cursor-pointer"
                    >
                      عن المقياس
                    </button>
                    
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        if (onPrivacyClick) onPrivacyClick();
                      }}
                      className="hover:text-[#4a3856] dark:hover:text-[#e8654f] transition-colors duration-200 bg-transparent border-none cursor-pointer"
                    >
                      سياسة الخصوصية
                    </button>
                    
                    <a href="https://altamayouz.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-[#4a3856] dark:hover:text-[#e8654f] transition-colors duration-200">عن مركز التميز</a>
                </div>
            </div>
        </footer>
  );
};

export default Footer;
