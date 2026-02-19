/**
 * Auth/LoginPage.jsx
 * ──────────────────
 * Handles both user login and user registration.
 * Admin logs in via same form (server distinguishes by role).
 * Redirects:
 *   - admin → /admin
 *   - user  → /
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ThemeToggle';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('لطفاً نام کاربری و رمز عبور را وارد کنید.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const user = mode === 'login'
        ? await login(username.trim(), password)
        : await register(username.trim(), password);

      // Redirect based on role
      navigate(user.role === 'admin' ? '/admin' : '/', { replace: true });
    } catch (err) {
      setError(err.message || 'خطا در ورود. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* Top-right theme toggle */}
      <div className={styles.topBar}>
        <Link to="/" className={styles.backLink}>
          ← بازگشت به صفحه اصلی
        </Link>
        <ThemeToggle />
      </div>

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <span>💬</span>
          <h1>ChatBot Pro</h1>
        </div>

        {/* Mode toggle */}
        <div className={styles.modeTabs}>
          <button
            className={`${styles.modeTab} ${mode === 'login' ? styles.activeTab : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            ورود
          </button>
          <button
            className={`${styles.modeTab} ${mode === 'register' ? styles.activeTab : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            ثبت‌نام
          </button>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="username">نام کاربری</label>
            <div className={styles.inputWrap}>
              <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="username"
                className={styles.input}
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="نام کاربری"
                autoComplete="username"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="password">رمز عبور</label>
            <div className={styles.inputWrap}>
              <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="password"
                className={styles.input}
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'حداقل ۶ کاراکتر' : 'رمز عبور'}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                disabled={loading}
                required
              />
              <button
                type="button"
                className={styles.showPassBtn}
                onClick={() => setShowPass(s => !s)}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.errorBox} role="alert">
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            className={styles.submitBtn}
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <><span className={styles.loader} /> در حال پردازش...</>
            ) : (
              mode === 'login' ? 'ورود' : 'ایجاد حساب'
            )}
          </button>
        </form>

        {/* Admin hint */}
        <div className={styles.hint}>
          <span>🛡</span>
          برای ورود ادمین از اطلاعات پیش‌فرض استفاده کنید:
          <code> admin / Admin@1234</code>
        </div>
      </div>
    </div>
  );
}
