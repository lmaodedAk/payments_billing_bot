// components/TopicCards.jsx
import { CreditCard, AlertCircle, FileText, Calendar, RotateCcw, Percent } from 'lucide-react';

const TOPICS = [
  {
    icon: CreditCard,
    title: 'Payment Methods',
    desc: 'Accepted cards, net banking, UPI, and digital wallets.',
    starter: 'What payment methods do you accept?',
  },
  {
    icon: AlertCircle,
    title: 'Failed or Pending Payments',
    desc: 'Troubleshoot stuck transactions or declined card payments.',
    starter: 'Why is my payment pending?',
  },
  {
    icon: FileText,
    title: 'Invoices & Receipts',
    desc: 'Download past invoices, view tax breakdowns, and receipts.',
    starter: 'How do I download my invoice?',
  },
  {
    icon: Calendar,
    title: 'Subscriptions & Billing',
    desc: 'Manage active recurring plans, renewals, and upgrades.',
    starter: 'How do I cancel my subscription?',
  },
  {
    icon: RotateCcw,
    title: 'Refunds',
    desc: 'Check refund status, eligibility guidelines, and bank timelines.',
    starter: 'How do I request a refund?',
  },
  {
    icon: Percent,
    title: 'Taxes & Fees',
    desc: 'Understand applicable tax calculations, GST, and service fees.',
    starter: 'What is the tax rate on my invoice?',
  },
];

export default function TopicCards({ onSelectTopic }) {
  return (
    <section id="topics" className="max-content px-4 sm:px-6 pb-20 sm:pb-24">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {TOPICS.map((topic) => {
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
    </section>
  );
}
