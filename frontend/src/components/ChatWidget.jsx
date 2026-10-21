// components/ChatWidget.jsx
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, RotateCcw, MessageSquare } from 'lucide-react';

const STARTER_CHIPS = [
  'What payment methods do you accept?',
  'Why is my payment pending?',
  'How do I request a refund?',
  'How do I download my invoice?',
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-1 px-1" aria-label="Assistant is typing">
      <span className="dot-pulse" />
      <span className="dot-pulse" />
      <span className="dot-pulse" />
    </div>
  );
}

function MessageBubble({ msg, onRetry }) {
  const isUser = msg.role === 'user';

  if (msg.error) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-xl p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300">
          <p>{msg.error}</p>
          <button
            type="button"
            onClick={() => onRetry(msg.retryText, msg.id)}
            className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-300 hover:underline focus-visible:outline"
          >
            <RotateCcw size={12} strokeWidth={2} aria-hidden="true" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-xs ${
          isUser
            ? 'bg-primary-600 text-white rounded-tr-xs'
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200/80 dark:border-neutral-700/80 rounded-tl-xs'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.text}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:my-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:my-2 [&>ol]:list-decimal [&>ol]:pl-5 [&>li]:my-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
          </div>
        )}
      </div>

      {msg.timestamp && (
        <span className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 px-1">
          {msg.timestamp}
        </span>
      )}
    </div>
  );
}

export default function ChatWidget({
  isOpen,
  onClose,
  messages,
  isTyping,
  onSend,
  onNewChat,
}) {
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of message list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input and handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  function handleSubmit(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isTyping) return;
    setDraft('');
    onSend(text);
  }

  function handleInputKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Payment assistant chat"
      aria-modal="true"
      className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[410px] sm:h-[590px] z-50 flex flex-col bg-white dark:bg-neutral-900 sm:rounded-2xl sm:border sm:border-neutral-200 dark:sm:border-neutral-800 shadow-panel overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <MessageSquare size={16} strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Payment Assistant
            </h2>
            {/* Green dot as replacement to active now */}
            <span
              className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20"
              title="Active"
              aria-label="Active"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNewChat}
            className="px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus-visible:outline"
          >
            New chat
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors focus-visible:outline"
          >
            <X size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── Messages list ── */}
      <div
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-neutral-50/50 dark:bg-[#0b0f19]/70"
        aria-live="polite"
        aria-label="Message list"
      >
        {messages.length === 0 && (
          <div className="my-auto flex flex-col gap-4 text-left">
            <div className="p-3.5 bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 rounded-xl text-sm text-neutral-900 dark:text-neutral-100 shadow-xs">
              <p>👋 Hello! I am your AI payment assistant. How can I help you today?</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">
                Common questions
              </p>
              <div className="flex flex-col gap-2">
                {STARTER_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => onSend(chip)}
                    className="text-left text-xs p-2.5 bg-white dark:bg-neutral-800/90 border border-neutral-200/80 dark:border-neutral-700/80 rounded-lg hover:bg-blue-50/60 dark:hover:bg-neutral-750 hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors text-neutral-800 dark:text-neutral-200 shadow-xs focus-visible:outline"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} onRetry={(text, id) => onSend(text, id)} />
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 rounded-2xl rounded-tl-xs px-3.5 py-2 shadow-xs">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input bar ── */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-neutral-200 dark:border-neutral-800 p-3 bg-white dark:bg-neutral-900 flex gap-2 items-end"
      >
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Ask a question..."
          rows={1}
          aria-label="Type your message"
          disabled={isTyping}
          className="flex-1 resize-none rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 dark:focus:border-primary-400 transition-colors min-h-[40px] max-h-32"
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
          }}
        />

        <button
          type="submit"
          disabled={!draft.trim() || isTyping}
          aria-label="Send"
          className="h-10 w-10 shrink-0 rounded-xl bg-primary-600 hover:bg-primary-700 active:scale-95 disabled:opacity-40 disabled:hover:bg-primary-600 text-white flex items-center justify-center transition-all focus-visible:outline text-base shadow-xs"
        >
          <span aria-hidden="true" className="select-none leading-none">✈️</span>
        </button>
      </form>
    </div>
  );
}
