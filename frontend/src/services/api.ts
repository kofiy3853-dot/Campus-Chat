import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

if (import.meta.env.PROD && !API_URL) {
  console.error('❌ CRITICAL: VITE_API_URL is not defined in production. API calls will fail with 405.');
}

const api = axios.create({
  baseURL: API_URL,
});

// Add interceptor to include token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
