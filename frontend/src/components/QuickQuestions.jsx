// components/QuickQuestions.jsx
import { ChevronRight } from 'lucide-react';

const QUESTIONS = [
  'What payment methods do you accept?',
  'Why is my payment pending?',
  'How do I request a refund?',
  'When will my refund arrive?',
  'How do I download my invoice?',
  'What is the tax rate on my invoice?',
  'How do I cancel my subscription?',
  'How is my payment data secured?',
];

export default function QuickQuestions({ onSelect }) {
  return (
    <section id="questions" className="max-content px-4 sm:px-6 pb-20 sm:pb-28">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Frequently asked questions
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Select any question below to immediately open the assistant and get an answer.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onSelect(question)}
            className="group flex items-center justify-between text-left p-4 bg-white dark:bg-neutral-800/80 border border-neutral-200/90 dark:border-neutral-700/80 rounded-xl hover:border-blue-400/80 dark:hover:border-blue-500/60 hover:shadow-xs transition-all duration-150 focus-visible:outline"
          >
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {question}
            </span>
            <ChevronRight size={16} strokeWidth={2} className="text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}
