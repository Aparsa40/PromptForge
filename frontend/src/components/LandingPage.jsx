/**
 * LandingPage.jsx
 * ───────────────
 * Demo landing page that hosts the ChatWidget.
 * In a real deployment this would be your actual website.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ChatWidget from './ChatBot/ChatWidget';
import ThemeToggle from './ThemeToggle';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const { user, logout, isAdmin } = useAuth();
  const { isDark } = useTheme();

  return (
    <div className={styles.page}>
      {/* ── Top Navigation ── */}
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          <span className={styles.navLogo}>💬</span>
          <span className={styles.navTitle}>ChatBot Pro</span>
        </div>
        <div className={styles.navActions}>
          <ThemeToggle />
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className={styles.navLink}>
                  🛠 داشبورد مدیریت
                </Link>
              )}
              <button className={styles.navBtn} onClick={logout}>
                خروج
              </button>
            </>
          ) : (
            <Link to="/login" className={styles.navLink}>
              ورود / ثبت‌نام
            </Link>
          )}
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <main className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>✨ نسل جدید پشتیبانی هوشمند</div>
          <h1 className={styles.heroTitle}>
            پاسخ فوری به
            <span className={styles.highlight}> سوالات شما</span>
          </h1>
          <p className={styles.heroDesc}>
            سیستم چت‌بات هوشمند ما با پاسخ‌های از پیش تعریف‌شده، سریع‌ترین راه برای دریافت کمک است.
            روی آیکون چت در گوشه صفحه کلیک کنید.
          </p>
          <div className={styles.features}>
            {[
              { icon: '⚡', label: 'پاسخ فوری' },
              { icon: '🌙', label: 'حالت تاریک' },
              { icon: '📱', label: 'ریسپانسیو' },
              { icon: '🔒', label: 'امن' },
            ].map(f => (
              <div key={f.label} className={styles.featureChip}>
                <span>{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.heroIllustration}>
          <div className={styles.illustrationCard}>
            <div className={styles.illustrationDots}>
              <span /><span /><span />
            </div>
            <div className={styles.illustrationBubbles}>
              <div className={`${styles.bubble} ${styles.bubbleBot}`}>
                سلام! چطور می‌تونم کمکتون کنم؟ 👋
              </div>
              <div className={`${styles.bubble} ${styles.bubbleUser}`}>
                ساعت کاری شما چقدر است؟
              </div>
              <div className={`${styles.bubble} ${styles.bubbleBot}`}>
                ما از شنبه تا پنجشنبه ۹ صبح تا ۶ عصر در دسترس هستیم.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Chat Widget (floating) ── */}
      <ChatWidget />
    </div>
  );
}
