// hooks/useChat.js
// Manages chat state, sessionStorage persistence, and API calls.
import { useState, useCallback, useRef } from 'react';

const SESSION_KEY = 'zia_session_id';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getOrCreateSession() {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export function useChat() {
  const [messages, setMessages] = useState([]);   // { id, role, text, error? }
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const sessionRef = useRef(getOrCreateSession());

  const appendMsg = useCallback((msg) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ...msg,
      },
    ]);
  }, []);

  const sendMessage = useCallback(async (text, retryMsgId = null) => {
    const trimmed = text?.trim();
    if (!trimmed) return;

    // Remove a previous error stub if retrying
    if (retryMsgId) {
      setMessages((prev) => prev.filter((m) => m.id !== retryMsgId));
    }

    appendMsg({ role: 'user', text: trimmed });
    setIsTyping(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          sessionId: sessionRef.current,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `Server error ${res.status}`);
      }

      appendMsg({ role: 'agent', text: data.reply });
    } catch (err) {
      appendMsg({
        role: 'agent',
        text: '',
        error: err.message || 'Something went wrong. Please try again.',
        retryText: trimmed,
      });
    } finally {
      setIsTyping(false);
    }
  }, [appendMsg]);

  const openWithMessage = useCallback((starterText) => {
    setIsOpen(true);
    // Small delay so the panel is mounted before we send
    setTimeout(() => sendMessage(starterText), 80);
  }, [sendMessage]);

  const newChat = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionRef.current = getOrCreateSession();
    setMessages([]);
    setIsTyping(false);
  }, []);

  return {
    messages,
    isTyping,
    isOpen,
    setIsOpen,
    sendMessage,
    openWithMessage,
    newChat,
  };
}
