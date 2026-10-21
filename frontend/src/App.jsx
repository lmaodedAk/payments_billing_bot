// App.jsx
import { useState, useEffect, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TopicCards from './components/TopicCards';
import LeadForm from './components/LeadForm';
import QuickQuestions from './components/QuickQuestions';
import ChatWidget from './components/ChatWidget';
import Footer from './components/Footer';
import { useChat } from './hooks/useChat';

export default function App() {
  // ── Dark mode preference ────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('zia_theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
    localStorage.setItem('zia_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // ── Chat hook ────────────────────────────────────────────────────────────
  const {
    messages,
    isTyping,
    isOpen,
    setIsOpen,
    sendMessage,
    openWithMessage,
    newChat,
  } = useChat();

  const handleOpenChat = useCallback(
    (starterText) => {
      if (starterText) {
        openWithMessage(starterText);
      } else {
        setIsOpen(true);
      }
    },
    [openWithMessage, setIsOpen]
  );

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0b0f19] text-neutral-900 dark:text-neutral-50 transition-colors">
      <Navbar
        isDark={isDark}
        onToggleDark={() => setIsDark((prev) => !prev)}
        onOpenChat={() => handleOpenChat()}
      />

      <main className="flex-1">
        <Hero onOpenChat={() => handleOpenChat()} />
        <TopicCards onSelectTopic={handleOpenChat} />
        <LeadForm onSubmitLead={handleOpenChat} />
        <QuickQuestions onSelect={handleOpenChat} />
      </main>

      <Footer />

      {/* Floating launcher button — bottom right on desktop */}
      {!isOpen && (
        <button
          type="button"
          id="chat-launcher"
          onClick={() => handleOpenChat()}
          aria-label="Open chat"
          className="fixed bottom-6 right-6 z-30 w-13 h-13 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center transition-all focus-visible:outline"
        >
          <MessageSquare size={22} strokeWidth={2} aria-hidden="true" />
        </button>
      )}

      <ChatWidget
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        isTyping={isTyping}
        onSend={sendMessage}
        onNewChat={newChat}
      />
    </div>
  );
}
