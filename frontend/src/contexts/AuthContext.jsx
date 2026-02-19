/**
 * contexts/AuthContext.jsx
 * ────────────────────────
 * Global authentication state: stores user info and JWT token.
 * Provides login / logout helpers used throughout the app.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('chatbot_token'));
  const [loading, setLoading] = useState(true);

  // On mount: verify stored token and restore session
  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => {
          // Token invalid/expired — clear it
          localStorage.removeItem('chatbot_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('chatbot_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (username, password) => {
    const res = await api.post('/auth/register', { username, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('chatbot_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('chatbot_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
