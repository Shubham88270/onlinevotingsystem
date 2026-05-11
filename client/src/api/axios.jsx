import axios from 'axios';
import { API_BASE_URL } from './config.js';

// Use env variable in production, proxy in development
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s — Render free tier cold start can take ~30-50s
});

// Request — JWT token attach karo
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Response — 401 pe auto logout, timeout pe friendly message
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    // Render cold start — server waking up
    if (error.code === 'ECONNABORTED' || !error.response) {
      error.message = '⏳ Server is waking up, please try again in a moment...';
    }
    return Promise.reject(error);
  }
);

export default api;
