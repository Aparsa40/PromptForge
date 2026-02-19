/**
 * ThemeToggle.jsx
 * ───────────────
 * Animated sun/moon toggle switch for light/dark mode.
 */

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      className={`${styles.toggle} ${isDark ? styles.dark : ''} ${className}`}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'روشن' : 'تاریک'}
    >
      <span className={styles.track}>
        <span className={styles.thumb}>
          {isDark ? '🌙' : '☀️'}
        </span>
      </span>
    </button>
  );
}
