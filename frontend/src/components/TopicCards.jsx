// components/TopicCards.jsx
import {
  CreditCard,
  FileText,
  RotateCcw,
  Calendar,
  UserPlus,
  Briefcase,
  Building2,
  Sparkles,
} from 'lucide-react';

const BILLING_TOPICS = [
  {
    icon: CreditCard,
    title: 'Payment Methods',
    desc: 'Accepted debit cards, credit cards, bank transfers, and UPI.',
    starter: 'What payment methods do you accept?',
  },
  {
    icon: FileText,
    title: 'Invoices & Receipts',
    desc: 'Download past invoices, review tax breakdowns, and receipts.',
    starter: 'How do I download my invoice?',
  },
  {
    icon: RotateCcw,
    title: 'Refunds & Returns',
    desc: 'Check refund eligibility, bank processing times, and requests.',
    starter: 'How do I request a refund?',
  },
  {
    icon: Calendar,
    title: 'Subscriptions & Billing',
    desc: 'Manage recurring plans, renewals, and subscription changes.',
    starter: 'How do I cancel my subscription?',
  },
];

const CRM_LEAD_TOPICS = [
  {
    icon: UserPlus,
    title: 'Create New Lead in CRM',
    desc: 'Register prospective customer details directly into Zoho CRM.',
    starter: 'I want to register as a new lead in Zoho CRM. What details do you need?',
  },
  {
    icon: Briefcase,
    title: 'Schedule Sales Demo',
    desc: 'Book an interactive walkthrough and log a demo lead record.',
    starter: 'I would like to schedule a product demo. Please record my inquiry as a lead in Zoho CRM.',
  },
  {
    icon: Building2,
    title: 'Enterprise & Partnerships',
    desc: 'Submit high-volume B2B contract requests directly to sales.',
    starter: 'I represent an enterprise company interested in a partnership. Please add my details to Zoho CRM.',
  },
  {
    icon: Sparkles,
    title: 'Custom Quote Request',
    desc: 'Provide your project requirements to generate a tailored proposal.',
    starter: 'I need a custom pricing quote for my organization. Please capture my lead information in CRM.',
  },
];

export default function TopicCards({ onSelectTopic }) {
  return (
    <section id="topics" className="max-content px-4 sm:px-6 pb-20 sm:pb-24">
      {/* ── Category 1: CRM Sales & Lead Generation ── */}
      <div id="lead-capture" className="mb-14">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
            Zoho CRM Integration
          </span>
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Sales &amp; Lead Generation
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          Capture prospect inquiries, request customized quotes, and register new leads into Zoho CRM.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {CRM_LEAD_TOPICS.map((topic) => {
            const IconComponent = topic.icon;
            return (
              <button
                key={topic.title}
                type="button"
                onClick={() => onSelectTopic(topic.starter)}
                className="bg-white dark:bg-neutral-800/80 border border-neutral-200/90 dark:border-neutral-700/80 rounded-xl p-5 text-left flex flex-col items-start gap-3 shadow-xs hover:shadow-md hover:border-emerald-500/80 dark:hover:border-emerald-500/60 dark:hover:bg-neutral-800 transition-all duration-150 focus-visible:outline"
              >
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
                  <IconComponent size={20} strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-base mb-1">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-normal">
                    {topic.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Category 2: Payment & Billing Support ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80">
            Billing Support
          </span>
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Payment &amp; Billing Assistance
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          Access instant answers for accepted payment methods, invoice downloads, and refund inquiries.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {BILLING_TOPICS.map((topic) => {
            const IconComponent = topic.icon;
            return (
              <button
                key={topic.title}
                type="button"
                onClick={() => onSelectTopic(topic.starter)}
                className="bg-white dark:bg-neutral-800/80 border border-neutral-200/90 dark:border-neutral-700/80 rounded-xl p-5 text-left flex flex-col items-start gap-3 shadow-xs hover:shadow-md hover:border-blue-400/80 dark:hover:border-blue-500/60 dark:hover:bg-neutral-800 transition-all duration-150 focus-visible:outline"
              >
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                  <IconComponent size={20} strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-base mb-1">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-normal">
                    {topic.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
