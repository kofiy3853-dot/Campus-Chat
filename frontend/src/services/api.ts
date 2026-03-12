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
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      if (userData.token) {
        config.headers.Authorization = `Bearer ${userData.token}`;
      }
    } catch (e) {
      console.error('Failed to parse stored user data:', e);
    }
  }
  return config;
});

export default api;
