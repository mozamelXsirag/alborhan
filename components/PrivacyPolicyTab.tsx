
import React from 'react';

interface PrivacyPolicyTabProps {
  onBack: () => void;
}

const PrivacyPolicyTab: React.FC<PrivacyPolicyTabProps> = ({ onBack }) => {
  return (
    <main className="container mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto bg-white dark:bg-[#181818] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
        
        {/* Header Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#4a3856]/5 dark:bg-[#e8654f]/5 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none"></div>

        <div className="p-8 md:p-12 relative z-10">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2">سياسة الخصوصية</h2>
                <p className="text-slate-500 dark:text-slate-400">آخر تحديث: فبراير 2025</p>
            </div>
            <button 
              onClick={onBack}
              className="px-6 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              رجوع
            </button>
          </div>

          <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed">
            <section>
              <h3 className="text-lg md:text-xl font-bold text-[#4a3856] dark:text-[#e8654f] mb-3">1. مقدمة</h3>
              <p className="text-sm md:text-base">
                نرحب بكم في "مقياس البرهان التقني". نحن ندرك أهمية الخصوصية وحماية البيانات، ونلتزم بالحفاظ على سرية المعلومات التي تشاركونها معنا أثناء استخدام أداة التقييم. توضح هذه السياسة كيفية جمعنا واستخدامنا وحمايتنا لبياناتكم.
              </p>
            </section>

            <section>
              <h3 className="text-lg md:text-xl font-bold text-[#4a3856] dark:text-[#e8654f] mb-3">2. البيانات التي نجمعها</h3>
              <ul className="list-disc list-inside space-y-2 text-sm md:text-base marker:text-blue-500">
                <li><strong>بيانات المشروع:</strong> تشمل اسم المشروع، الجهة المالكة، واسم طالب التقييم.</li>
                <li><strong>معلومات الاتصال:</strong> مثل البريد الإلكتروني أو رقم الهاتف (لغرض التواصل بشأن النتائج فقط).</li>
                <li><strong>بيانات التقييم:</strong> الإجابات التي تقدمونها على معايير المقياس والنتائج المترتبة عليها.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg md:text-xl font-bold text-[#4a3856] dark:text-[#e8654f] mb-3">3. كيفية استخدام البيانات</h3>
              <p className="text-sm md:text-base">
                تُستخدم البيانات المدخلة حصرياً للأغراض التالية:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-2 text-sm md:text-base marker:text-blue-500">
                <li>إصدار تقرير النضج التقني الخاص بمشروعكم.</li>
                <li>تحسين معايير المقياس بناءً على تحليل البيانات المجمعة (بشكل مجهول).</li>
                <li>التواصل معكم لتقديم الدعم أو الاستشارات التقنية إذا لزم الأمر.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg md:text-xl font-bold text-[#4a3856] dark:text-[#e8654f] mb-3">4. تخزين وحماية البيانات</h3>
              <p className="text-sm md:text-base mb-2">
                نحن نستخدم خدمات سحابية آمنة (مثل Firebase) لتخزين البيانات. يتم تطبيق معايير أمان صارمة لحماية البيانات من الوصول غير المصرح به.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 p-4 rounded-xl">
                 <p className="text-xs font-bold text-yellow-700 dark:text-yellow-500">
                    تنبيه: البيانات الحساسة المتعلقة بتفاصيل البنية التحتية الدقيقة لا يتم طلبها في هذا المقياس، وننصح بعدم مشاركة أي أسرار تجارية أو كلمات مرور في حقول النصوص الحرة.
                 </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg md:text-xl font-bold text-[#4a3856] dark:text-[#e8654f] mb-3">5. حقوق المستخدم</h3>
              <p className="text-sm md:text-base">
                يحق لكم في أي وقت طلب نسخة من بيانات تقييمكم، أو طلب تعديلها، أو حذفها نهائياً من سجلاتنا عبر التواصل مع إدارة البرهان.
              </p>
            </section>

            <section>
              <h3 className="text-lg md:text-xl font-bold text-[#4a3856] dark:text-[#e8654f] mb-3">6. التعديلات على السياسة</h3>
              <p className="text-sm md:text-base">
                قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سيتم نشر أي تغييرات في هذه الصفحة، ويكون استمراركم في استخدام المقياس بمثابة موافقة على هذه التغييرات.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-sm font-bold text-slate-500">
                لديك استفسار؟ تواصل معنا عبر <a href="https://alborhan.sa" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">موقع البرهان</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PrivacyPolicyTab;
