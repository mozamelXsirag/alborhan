
import React, { useState } from 'react';
import { SCALE } from '../constants';
import type { Question } from '../types';

interface QuestionBlockProps {
  id?: string; // Added ID prop for scrolling
  domainKey: string;
  question: Question;
  questionIndex: number;
  answer: number | null;
  onAnswerChange: (domainKey: string, questionIndex: number, value: number) => void;
  validationAttempted: boolean;
}

// الترتيب الأبجدي (أبجد هوز)
const ABJAD_ORDER = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي', 'ك', 'ل', 'م', 'ن', 'س', 'ع', 'ف', 'ص', 'ق', 'ر', 'ش', 'ت', 'ث', 'خ', 'ذ', 'ض', 'ظ', 'غ'];

const getWeightBadge = (weight: number): { text: string; className: string } | null => {
  if (weight >= 1.8) {
    // Neon Red for 'Essential/Critical'
    return { text: 'أهمية قصوى', className: 'border-red-500 text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]' };
  }
  if (weight >= 1.5) {
    // Neon Orange for 'High Importance'
    return { text: 'أهمية عالية', className: 'border-orange-400 text-orange-400' };
  }
  if (weight >= 1.2) {
    // Neon Yellow for 'Medium Importance'
    return { text: 'أهمية متوسطة', className: 'border-yellow-300 text-yellow-300' };
  }
  if (weight >= 1.0) {
    // Neon Cyan for 'Competitive'
    return { text: 'أهمية أساسية', className: 'border-cyan-400 text-cyan-400' };
  }
  return null;
};

// دالة مساعدة لتحديد لون الزر بناءً على المستوى وحالة التحديد
const getButtonClasses = (value: number, isSelected: boolean) => {
    const baseClasses = "p-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex flex-col items-center justify-center gap-1 min-h-[50px]";
    
    if (!isSelected) {
        return `${baseClasses} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700`;
    }

    // تدرج الألوان عند التحديد
    let colorClasses = "";
    switch (value) {
        case 0: // لا ينطبق
            colorClasses = "bg-slate-500 text-white shadow-lg shadow-slate-500/30 transform scale-105 ring-2 ring-slate-500 ring-offset-2 dark:ring-offset-[#181818]";
            break;
        case 1: // مستوى 1 (ضعيف) - أحمر
            colorClasses = "bg-red-500 text-white shadow-lg shadow-red-500/30 transform scale-105 ring-2 ring-red-500 ring-offset-2 dark:ring-offset-[#181818]";
            break;
        case 2: // مستوى 2 (تأسيسي) - برتقالي
            colorClasses = "bg-orange-500 text-white shadow-lg shadow-orange-500/30 transform scale-105 ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-[#181818]";
            break;
        case 3: // مستوى 3 (مستقر) - أصفر/ليموني
            colorClasses = "bg-yellow-500 text-white shadow-lg shadow-yellow-500/30 transform scale-105 ring-2 ring-yellow-500 ring-offset-2 dark:ring-offset-[#181818]";
            break;
        case 4: // مستوى 4 (متقدم) - سماوي
            colorClasses = "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 transform scale-105 ring-2 ring-cyan-500 ring-offset-2 dark:ring-offset-[#181818]";
            break;
        case 5: // مستوى 5 (رائد) - لون الهوية (بنفسجي/برتقالي محروق)
            colorClasses = "bg-[#4a3856] dark:bg-[#e8654f] text-white shadow-lg shadow-[#4a3856]/30 dark:shadow-[#e8654f]/20 transform scale-105 ring-2 ring-[#4a3856] dark:ring-[#e8654f] ring-offset-2 dark:ring-offset-[#181818]";
            break;
        default:
            colorClasses = "bg-slate-500 text-white";
    }

    return `${baseClasses} ${colorClasses}`;
};

const QuestionBlock: React.FC<QuestionBlockProps> = ({ id, domainKey, question, questionIndex, answer, onAnswerChange, validationAttempted }) => {
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);
  const weightBadge = getWeightBadge(question.weight);
  
  // تحديد الحرف الأبجدي بناءً على الفهرس
  const questionLabel = ABJAD_ORDER[questionIndex] || (questionIndex + 1);

  // تحديد القيمة النشطة للعرض (الأولوية للتحويم ثم الاختيار)
  const displayValue = hoveredOption !== null ? hoveredOption : answer;

  const descriptionToShow = React.useMemo(() => {
      if (displayValue !== null && displayValue > 0) {
          return question.levels[displayValue - 1];
      }
      if (displayValue === 0) {
          return "الخيار (لا ينطبق): هذا المعيار لا يتناسب مع طبيعة المشروع ولن يؤثر سلباً على النتيجة.";
      }
      return 'مرر مؤشر الفأرة على الخيارات لمعاينة الوصف، ثم انقر للاختيار.';
  }, [displayValue, question.levels]);

  const isUnanswered = answer === null;
  const showError = validationAttempted && isUnanswered;

  return (
    <div id={id} className={`p-4 border rounded-lg bg-white dark:bg-slate-900/30 transition-all duration-300 group focus-within:shadow-lg focus-within:shadow-[#4a3856]/10 dark:focus-within:shadow-[#e8654f]/10 dark:focus-within:border-blue-800 ${
        showError
          ? 'border-red-500 animate-shake'
          : 'border-slate-200 dark:border-slate-800 focus-within:border-blue-300'
      }`}>
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="flex items-start gap-3 flex-grow min-w-0">
          <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full font-black text-sm border border-slate-200 dark:border-slate-700 mt-0.5">
              {questionLabel}
          </span>
          <p className="font-bold text-base md:text-lg text-slate-800 dark:text-slate-200 leading-relaxed pt-1">
            {question.text}
          </p>
        </div>
        {weightBadge && (
          <span className={`flex-shrink-0 whitespace-nowrap text-[10px] sm:text-xs font-bold font-sans px-2 py-0.5 border rounded-full ${weightBadge.className}`}>
            {weightBadge.text}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 my-4">
        {SCALE.map((option) => {
          const isSelected = answer === option.v;
          return (
            <button
              key={option.v}
              onClick={() => onAnswerChange(domainKey, questionIndex, option.v)}
              onMouseEnter={() => setHoveredOption(option.v)}
              onMouseLeave={() => setHoveredOption(null)}
              className={getButtonClasses(option.v, isSelected)}
            >
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      <p className={`p-3 text-sm transition-colors duration-300 rounded-md min-h-[60px] leading-relaxed flex items-center ${
          displayValue !== null && displayValue > 0
          ? 'text-slate-700 dark:text-slate-200 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30'
          : displayValue === 0 
            ? 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
            : 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 italic'
      }`}>
        {descriptionToShow}
      </p>
    </div>
  );
};

export default QuestionBlock;
