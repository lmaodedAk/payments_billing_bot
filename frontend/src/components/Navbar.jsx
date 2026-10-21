// components/Navbar.jsx
import { useState, useEffect } from 'react';
import { CreditCard, Sun, Moon, MessageSquare } from 'lucide-react';

export default function Navbar({ isDark, onToggleDark, onOpenChat }) {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setHasScrolled(window.scrollY > 8);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-white dark:bg-[#0b0f19] border-b transition-colors duration-150 ${
        hasScrolled
          ? 'border-neutral-200 dark:border-neutral-800 shadow-xs'
          : 'border-transparent'
      }`}
    >
      <div className="max-content px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand name & icon */}
        <a
          href="#"
          className="flex items-center gap-2.5 font-bold text-neutral-900 dark:text-neutral-50 text-base tracking-tight"
          aria-label="Payment & Billing home"
        >
          <CreditCard size={20} strokeWidth={2} className="text-primary-600 dark:text-primary-400" aria-hidden="true" />
          <span>Payment &amp; Billing</span>
        </a>

        {/* Center: Navigation links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
          <a
            href="#"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Home
          </a>
          <a
            href="#topics"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Support
          </a>
          <a
            href="#questions"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Contact
          </a>
        </nav>

        {/* Right: Controls & Primary button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onToggleDark}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors focus-visible:outline"
          >
            {isDark ? (
              <Sun size={18} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Moon size={18} strokeWidth={2} aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenChat}
            className="btn-primary"
          >
            <MessageSquare size={16} strokeWidth={2} aria-hidden="true" />
            <span>Chat with Assistant</span>
          </button>
        </div>
      </div>
    </header>
  );
}
