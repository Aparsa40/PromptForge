/**
 * ChatBot/FAQModal.jsx
 * ─────────────────────
 * Modal displaying predefined FAQ questions.
 * User clicks a question → parent handles sending it to the bot.
 */

import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import styles from './FAQModal.module.css';

export default function FAQModal({ onClose, onSelect }) {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/chat/faqs')
      .then(res => setFaqs(res.data.faqs || []))
      .catch(() => setError('خطا در بارگذاری سوالات'))
      .finally(() => setLoading(false));
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Group by category
  const filtered = faqs.filter(f =>
    !search || f.question.toLowerCase().includes(search.toLowerCase())
  );
  const grouped = filtered.reduce((acc, faq) => {
    const cat = faq.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {});

  const categoryLabels = {
    general: 'عمومی',
    support: 'پشتیبانی',
    billing: 'مالی',
    technical: 'فنی',
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-label="سوالات متداول" aria-modal="true">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <span>❓</span>
            <h3>سوال‌های پرتکرار</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="بستن">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="جستجو در سوالات..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch('')}>×</button>
          )}
        </div>

        {/* Content */}
        <div className={styles.content}>
          {loading && (
            <div className={styles.center}>
              <div className={styles.spinner} />
              <p>در حال بارگذاری...</p>
            </div>
          )}
          {error && <div className={styles.error}>{error}</div>}
          {!loading && !error && filtered.length === 0 && (
            <div className={styles.center}>
              <span style={{ fontSize: '2rem' }}>🔍</span>
              <p>سوالی یافت نشد</p>
            </div>
          )}
          {!loading && !error && Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className={styles.group}>
              {Object.keys(grouped).length > 1 && (
                <div className={styles.groupLabel}>
                  {categoryLabels[cat] || cat}
                </div>
              )}
              <div className={styles.list}>
                {items.map((faq, i) => (
                  <button
                    key={faq.id}
                    className={styles.item}
                    onClick={() => onSelect(faq)}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <span className={styles.itemIcon}>💬</span>
                    <span className={styles.itemText}>{faq.question}</span>
                    <svg className={styles.itemArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span>{faqs.length} سوال متداول موجود است</span>
        </div>
      </div>
    </div>
  );
}
