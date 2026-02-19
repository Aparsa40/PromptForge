/**
 * ChatBot/ChatWidget.jsx
 * ──────────────────────
 * The floating chat button + expandable chat window.
 *
 * Features:
 *   • Floating action button (FAB) — fixed bottom-right
 *   • Smooth open/close animation
 *   • Auto-sends welcome message on first open
 *   • Text input + send button
 *   • "سوال‌های پرتکرار" FAQ modal trigger
 *   • Typing indicator animation
 *   • Message timestamps
 *   • Auto-scroll to latest message
 *   • Session ID persistence per browser session
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import api from '../../services/api';
import FAQModal from './FAQModal';
import styles from './ChatWidget.module.css';

// Generate or restore session ID
function getSessionId() {
  let id = sessionStorage.getItem('chat_session');
  if (!id) { id = uuidv4(); sessionStorage.setItem('chat_session', id); }
  return id;
}

const SESSION_ID = getSessionId();
const WELCOME_TEXT = 'سلام 👋 خوش آمدید. چطور می‌توانم کمکتان کنم؟';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Send welcome message on first open
  useEffect(() => {
    if (isOpen && !hasOpened) {
      setHasOpened(true);
      setTimeout(() => {
        appendMessage({ sender: 'bot', text: WELCOME_TEXT });
      }, 500);
    }
  }, [isOpen, hasOpened]);

  // ── Message helpers ──────────────────────────────────────────────
  function appendMessage(msg) {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      sender: msg.sender,
      text: msg.text,
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    }]);
    if (!isOpen && msg.sender === 'bot') {
      setUnreadCount(c => c + 1);
    }
  }

  async function sendMessage(text, faqId = null, source = 'text') {
    if (!text?.trim() && !faqId) return;

    const userText = text?.trim() || '';
    if (userText) appendMessage({ sender: 'user', text: userText });

    setInput('');
    setIsTyping(true);

    try {
      const res = await api.post('/chat/message', {
        message: userText,
        faq_id: faqId,
        session_id: SESSION_ID,
        source,
      });
      // Simulate a natural typing delay
      await new Promise(r => setTimeout(r, 700 + Math.random() * 600));
      appendMessage({ sender: 'bot', text: res.data.response });
    } catch (err) {
      appendMessage({ sender: 'bot', text: '⚠️ خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.' });
    } finally {
      setIsTyping(false);
    }
  }

  function handleSend() {
    sendMessage(input);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Called when user picks a FAQ from modal
  function handleFaqSelect(faq) {
    setShowFaq(false);
    appendMessage({ sender: 'user', text: faq.question });
    sendMessage(faq.question, faq.id, 'faq_button');
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`${styles.fab} ${isOpen ? styles.fabOpen : ''}`}
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? 'بستن چت' : 'باز کردن چت'}
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {!isOpen && unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount}</span>
        )}
      </button>

      {/* Chat Window */}
      <div
        className={`${styles.window} ${isOpen ? styles.windowOpen : ''}`}
        role="dialog"
        aria-label="چت‌بات پشتیبانی"
        aria-modal="true"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatar}>🤖</div>
              <div className={styles.statusDot} />
            </div>
            <div>
              <div className={styles.headerName}>پشتیبانی هوشمند</div>
              <div className={styles.headerStatus}>
                {isTyping ? 'در حال تایپ...' : 'آنلاین'}
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="بستن">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className={styles.messages} role="log" aria-live="polite">
          {messages.length === 0 && (
            <div className={styles.emptyState}>
              <span>💬</span>
              <p>مکالمه‌ای وجود ندارد. سوالتان را بپرسید!</p>
            </div>
          )}
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`${styles.messageRow} ${msg.sender === 'user' ? styles.userRow : styles.botRow}`}
            >
              {msg.sender === 'bot' && (
                <div className={styles.botAvatar}>🤖</div>
              )}
              <div className={styles.bubble}>
                <div className={`${styles.bubbleContent} ${msg.sender === 'user' ? styles.userBubble : styles.botBubble}`}>
                  {msg.text}
                </div>
                <div className={styles.msgTime}>{msg.time}</div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className={`${styles.messageRow} ${styles.botRow}`}>
              <div className={styles.botAvatar}>🤖</div>
              <div className={styles.bubble}>
                <div className={`${styles.bubbleContent} ${styles.botBubble} ${styles.typingBubble}`}>
                  <span className={styles.typingDot} style={{ animationDelay: '0ms' }} />
                  <span className={styles.typingDot} style={{ animationDelay: '200ms' }} />
                  <span className={styles.typingDot} style={{ animationDelay: '400ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {/* FAQ Button */}
          <button
            className={styles.faqBtn}
            onClick={() => setShowFaq(true)}
            title="سوال‌های پرتکرار"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            سوال‌های پرتکرار
          </button>

          {/* Input Row */}
          <div className={styles.inputRow}>
            <input
              ref={inputRef}
              className={styles.input}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="پیام خود را بنویسید..."
              maxLength={500}
              disabled={isTyping}
              aria-label="متن پیام"
            />
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              aria-label="ارسال"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Modal */}
      {showFaq && (
        <FAQModal onClose={() => setShowFaq(false)} onSelect={handleFaqSelect} />
      )}
    </>
  );
}
