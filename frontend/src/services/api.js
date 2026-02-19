/**
 * services/api.js
 * ───────────────
 * Centralised Axios instance with:
 *   - Base URL configuration
 *   - Auto JWT header injection
 *   - Consistent error handling
 *
 * PHASE 2 NOTE:
 *   Add interceptors here for refresh-token rotation,
 *   request queuing, or switching to a different AI API endpoint.
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('chatbot_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise error responses
api.interceptors.response.use(
  res => res,
  err => {
    const message = err.response?.data?.message || err.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);

export default api;
