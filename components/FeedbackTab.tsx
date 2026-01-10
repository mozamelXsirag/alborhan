
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import type { FeedbackMessage, UserSession } from '../types';
import { useToast } from '../contexts/ToastContext';

interface FeedbackTabProps {
    session: UserSession;
}

const FeedbackTab: React.FC<FeedbackTabProps> = ({ session }) => {
    const [messages, setMessages] = useState<FeedbackMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [guestName, setGuestName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const { showToast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Subscribe to real-time updates
        const unsubscribe = api.subscribeToFeedback((data) => {
            setMessages(data);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newMessage.trim()) return;
        
        // Determine name: Use session name if logged in/admin, else use guest input
        const senderName = session.role !== 'guest' && session.name !== 'ضيف' ? session.name : guestName.trim();

        if (!senderName) {
            showToast("يرجى كتابة اسمك للمشاركة", "error");
            return;
        }

        setIsSending(true);
        try {
            await api.sendFeedback({
                name: senderName,
                message: newMessage.trim(),
                role: session.role
            });
            setNewMessage('');
            // Reset height of textarea
            const textarea = document.querySelector('textarea');
            if (textarea) textarea.style.height = 'auto';
        } catch (error) {
            showToast("فشل إرسال المشاركة", "error");
        } finally {
            setIsSending(false);
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);
        // Auto-expand
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    return (
        <main className="container mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[80vh] flex flex-col">
            
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-4 bg-[#4a3856]/10 dark:bg-[#e8654f]/10 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#4a3856] dark:text-[#e8654f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">رأيك يهمنا</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                    مساحة مفتوحة للجميع لمشاركة الأفكار، الاقتراحات، والملاحظات حول المقياس وتطوير العمل التقني.
                </p>
            </div>

            {/* Input Area */}
            <div className="bg-white dark:bg-[#181818] p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl mb-10 relative z-10">
                <form onSubmit={handleSend} className="space-y-6">
                    {/* Name Field (Vertical Layout) */}
                    <div className="w-full">
                        {(session.role === 'guest' || session.name === 'ضيف') ? (
                            <div className="relative max-w-md">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    placeholder="الاسم الكريم..."
                                    className="block w-full pr-10 pl-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4a3856] dark:focus:ring-[#e8654f] focus:border-transparent transition-all font-bold"
                                    maxLength={30}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
                                <div className={`w-2 h-2 rounded-full ${session.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                <span className="font-bold text-slate-700 dark:text-slate-300">{session.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Message Area (Vertical & Expandable) */}
                    <div className="w-full relative">
                        <textarea
                            value={newMessage}
                            onChange={handleTextareaChange}
                            placeholder="اكتب رسالتك، اقتراحك، أو ملاحظتك هنا..."
                            rows={4}
                            className="block w-full px-5 py-4 pl-32 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4a3856] dark:focus:ring-[#e8654f] focus:border-transparent transition-all resize-none overflow-hidden min-h-[120px] leading-relaxed"
                        />
                        <button
                            type="submit"
                            disabled={isSending || !newMessage.trim()}
                            className="absolute left-3 bottom-3 px-6 py-2.5 bg-[#4a3856] dark:bg-[#e8654f] text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg active:scale-95"
                        >
                            {isSending ? '...' : (
                                <>
                                    إرسال
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-4 h-4 rtl:-scale-x-100" viewBox="0 0 16 16">
                                        <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/>
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Messages List (Forum Style) */}
            <div className="flex-grow space-y-4 pb-20">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-[#4a3856] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 italic bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        لا توجد مشاركات حتى الآن. كن أول من يبدأ النقاش!
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`flex gap-4 p-5 rounded-2xl border transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                                msg.role === 'admin' 
                                ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' 
                                : 'bg-white dark:bg-[#181818] border-slate-100 dark:border-slate-800'
                            }`}
                        >
                            <div className="flex-shrink-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${
                                    msg.role === 'admin' ? 'bg-red-500' : 'bg-gradient-to-br from-[#4a3856] to-purple-700 dark:from-[#e8654f] dark:to-orange-600'
                                }`}>
                                    {msg.name.charAt(0)}
                                </div>
                            </div>
                            <div className="flex-grow">
                                <div className="flex flex-wrap items-baseline justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className={`font-bold text-base ${msg.role === 'admin' ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                                            {msg.name}
                                        </h4>
                                        {msg.role === 'admin' && (
                                            <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold rounded border border-red-200 dark:border-red-800">مسؤول</span>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-400 font-mono" dir="ltr">{msg.dateLabel}</span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                    {msg.message}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
        </main>
    );
};

export default FeedbackTab;
