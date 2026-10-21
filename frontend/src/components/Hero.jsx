// components/Hero.jsx
import { MessageSquare, UserPlus } from 'lucide-react';

export default function Hero({ onOpenChat }) {
  function handleScrollToTopics() {
    const el = document.getElementById('topics');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <section className="pt-16 pb-16 sm:pt-20 sm:pb-20 px-4 sm:px-6 text-center max-w-4xl mx-auto">
      {/* Pill Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 mb-6 shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" aria-hidden="true" />
        <span>AI Billing &amp; CRM Sales Assistant</span>
      </div>

      {/* Main Title */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-5 leading-tight">
        Billing Support &amp; <br />
        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
          CRM Lead Assistant
        </span>
      </h1>

      {/* Description */}
      <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 mb-8 max-w-2xl mx-auto leading-relaxed">
        Resolve payment inquiries, manage invoices and refunds, or register new prospect leads and schedule sales consultations directly into Zoho CRM.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3.5">
        <button
          type="button"
          onClick={() => onOpenChat()}
          className="btn-primary"
        >
          <MessageSquare size={16} strokeWidth={2} aria-hidden="true" />
          <span>Chat with Assistant</span>
        </button>

        <button
          type="button"
          onClick={() =>
            onOpenChat(
              'I would like to register as a new lead in Zoho CRM. What details do you need?'
            )
          }
          className="btn-secondary"
        >
          <UserPlus size={16} strokeWidth={2} className="text-primary-600 dark:text-primary-400" aria-hidden="true" />
          <span>Register as Lead</span>
        </button>

        <button
          type="button"
          onClick={handleScrollToTopics}
          className="btn-secondary"
        >
          Browse Topics
        </button>
      </div>
    </section>
  );
}
