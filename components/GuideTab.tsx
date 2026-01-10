
import React from 'react';

const weightBadges = [
    { text: 'أهمية أساسية', className: 'border-red-400 text-red-400', description: 'أسئلة حاسمة تتعلق بالأساسيات الأمنية، القانونية، أو الوظيفية للمشروع. الحصول على درجة منخفضة هنا يشير إلى مخاطر عالية.' },
    { text: 'أهمية عالية', className: 'border-orange-400 text-orange-400', description: 'أسئلة مهمة تؤثر بشكل كبير على جودة المنتج، قابليته للصيانة، وتجربة المستخدم. تمثل أفضل الممارسات في الصناعة.' },
    { text: 'أهمية متوسطة', className: 'border-yellow-300 text-yellow-300', description: 'أسئلة تتعلق بالكفاءة، التحسين، والنضج التقني. الإجابات الجيدة هنا تظهر وجود خطة واضحة للتطوير المستمر.' },
    { text: 'أهمية تنافسية', className: 'border-cyan-400 text-cyan-400', description: 'أسئلة تركز على الابتكار، الاستدامة، والأثر المستقبلي. الدرجات العالية هنا تشير إلى أن المشروع رائد في مجاله.' },
];

const definitions = [
    {
        title: 'الممارسة الموثقة',
        text: 'هي الإجراء المكتوب والمعتمد رسمياً في المشروع، وليس مجرد عرف يتداوله الفريق شفهياً.',
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    },
    {
        title: 'الإجراء اليدوي',
        text: 'هو النشاط الذي يتطلب تدخل بشري في كل مرة (مثل: نسخ البيانات يدوياً، أو طلب تحديث المحتوى عبر الإيميل).',
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0V12m-3-0.5a3 3 0 00-3 3v2.5m6-13a1.5 1.5 0 013 0V12m-3-8.5a3 3 0 013 3v12.5m3-13a1.5 1.5 0 013 0V15" /></svg>
    },
    {
        title: 'الإجراء المؤتمت (Automated)',
        text: 'هو النشاط الذي يتم من خلال النظام تقنياً دون تدخل بشري متكرر (مثل: النسخ الاحتياطي التلقائي).',
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    },
    {
        title: 'الجهة المرجعية/المعتبرة',
        text: 'هي المؤسسات العلمية أو التقنية المعترف بها رسمياً (مثل: مجمع الملك فهد، هيئات الأمن السيبراني الوطنية).',
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
    },
    {
        title: 'القياس والتتبع',
        text: 'تعني وجود أرقام وإحصائيات فعلية يتم رصدها دورياً، وليس مجرد انطباعات عامة.',
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    }
];

const SectionHeader: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-700/50 text-[#4a3856] dark:text-[#e8654f] rounded-xl border border-slate-200 dark:border-slate-600">
            {icon}
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{title}</h3>
    </div>
);

interface GuideTabProps {
  onStart: () => void;
}

const GuideTab: React.FC<GuideTabProps> = ({ onStart }) => {
  return (
    <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-12 pb-12">
            <section className="text-center bg-white dark:bg-[#181818] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#4a3856]/5 dark:bg-[#e8654f]/5 blur-3xl rounded-full"></div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-3 relative z-10">مرحباً بك في مقياس البرهان</h2>
                <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 relative z-10">
                    أداة متخصصة لتقييم نضج مشروعك التقني في خدمة القرآن والسنة، تهدف لتحديد مواطن القوة وفرص التحسين وفق معيار البرهان لضمان الجودة والاستدامة.
                </p>
            </section>

            {/* قسم المفاهيم الأساسية الجديد */}
            <section className="bg-white dark:bg-[#181818] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <SectionHeader 
                    title="مفاهيم أساسية للتقييم الدقيق"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                />
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                    لضمان دقة نتائج التقييم الذاتي، يرجى مراعاة التعريفات التالية عند اختيار الحالة التي تصف مشروعك:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {definitions.map((def, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-2 text-[#4a3856] dark:text-[#e8654f]">
                                {def.icon}
                                <h4 className="font-bold text-base">{def.title}</h4>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {def.text}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="p-5 bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-500 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-1">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <h4 className="font-black text-sm">نصيحة ذهبية:</h4>
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                        اختر دائماً الحالة التي تملك "دليلاً" عليها حالياً، وليس الحالة التي تطمح للوصول إليها مستقبلاً.
                    </p>
                </div>
            </section>

            <section className="bg-white dark:bg-[#181818] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <SectionHeader 
                    title="مفتاح الأوزان"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" /></svg>}
                />
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                    كل سؤال له "وزن" يعكس مدى أهميته في التقييم الشامل. مرر الفأرة فوق كل وسم لاكتشاف معناه وأهميته في سياق التقييم.
                </p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-8">
                    {weightBadges.map((badge, index) => (
                        <div key={index} className="relative group">
                            <span className={`text-sm font-bold px-3 py-1.5 border rounded-full whitespace-nowrap cursor-help ${badge.className}`}>
                                {badge.text}
                            </span>
                            <div 
                              role="tooltip"
                              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 p-3 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
                            >
                                {badge.description}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white dark:border-t-slate-700"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            
            <section className="bg-white dark:bg-[#181818] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <SectionHeader 
                    title="آلية احتساب النتيجة"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.223 48.223 0 0012 2.25z" /></svg>}
                />
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                    النتيجة النهائية (من 175) هي مجموع مرجح لإجاباتك. كل إجابة تُضرب في وزن السؤال الخاص بها. الأسئلة ذات الأوزان الأعلى لها تأثير أكبر على النتيجة النهائية. هذا يضمن أن التقييم يعكس بدقة الجوانب الأكثر أهمية في أي مشروع تقني.
                </p>
            </section>

            {/* CTA Section */}
            <section className="pt-8 text-center">
                <div className="bg-gradient-to-br from-[#4a3856] to-[#3b2d45] dark:from-[#e8654f] dark:to-[#d65a44] p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-[#4a3856]/20 dark:shadow-[#e8654f]/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 blur-3xl rounded-full group-hover:scale-125 transition-transform duration-700"></div>
                    
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h3 className="text-2xl md:text-3xl font-black text-white mb-4 tracking-tight">هل أنت مستعد لتقييم مشروعك؟</h3>
                        <p className="text-white/90 font-medium mb-10 text-base md:text-lg leading-relaxed">
                            ابدأ الآن في رحلة قياس النضج الرقمي والحصول على تقرير مفصل يوضح نقاط القوة وفرص التطوير التقني.
                        </p>
                        
                        <button 
                            onClick={onStart}
                            className="bg-white text-[#4a3856] dark:text-[#e8654f] hover:bg-slate-50 px-8 py-4 md:px-10 md:py-5 rounded-2xl font-black text-lg md:text-xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mx-auto group/btn"
                        >
                            البدء في المقياس التقني
                            <svg className="w-6 h-6 transform group-hover/btn:translate-x-[-4px] transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                    </div>
                </div>
            </section>
        </div>
    </main>
  );
};

export default GuideTab;
