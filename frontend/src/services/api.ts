import axios from 'axios';

// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Log API configuration only in development
if (import.meta.env.DEV) {
  console.log('[API] Configuration:', {
    environment: import.meta.env.MODE,
    apiUrl: API_URL,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  });
}

// Validate API URL in production
if (import.meta.env.PROD && !API_URL) {
  console.error('❌ CRITICAL: VITE_API_URL is not defined in production. API calls will fail.');
}

if (import.meta.env.PROD && API_URL === 'http://localhost:5000') {
  console.error('❌ WARNING: Using localhost API URL in production. Update VITE_API_URL in .env.production');
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout for better performance
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token and logging
api.interceptors.request.use((config) => {
  // Add authorization token
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      if (userData.token) {
        config.headers.Authorization = `Bearer ${userData.token}`;
      }
    } catch (e) {
      console.error('[API] Failed to parse stored user data:', e);
    }
  }

  // Log request in development
  if (import.meta.env.DEV) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }

  return config;
}, (error) => {
  console.error('[API] Request error:', error);
  return Promise.reject(error);
});

// Response interceptor - Handle errors and logging
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API] Response ${response.status} from ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();

    // Log error details
    console.error(`[API] Error ${status} ${method} ${url}`, {
      message: error.message,
      status,
      data: error.response?.data,
    });

    // Handle 404 errors
    if (status === 404) {
      console.error(`[API] 404 Not Found: ${method} ${url}`);
      console.error('[API] Possible causes:');
      console.error('  1. Backend is not running');
      console.error('  2. API URL is incorrect');
      console.error('  3. Route does not exist on backend');
      console.error(`[API] Current API URL: ${API_URL}`);
    }

    // Handle 401 - Unauthorized
    if (status === 401) {
      console.warn('[API] Session expired or unauthorized. Logging out...');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // Force reload to trigger AuthContext logout/redirect if on a protected route
      if (!window.location.pathname.startsWith('/login') && window.location.pathname !== '/') {
        window.location.href = '/?expired=true';
      }
    }

    // Handle 500 - Server error
    if (status === 500) {
      console.error('[API] Server error. Check backend logs.');
    }

    // Handle network errors
    if (!error.response) {
      console.error('[API] Network error - Backend may be unreachable');
      console.error(`[API] Trying to reach: ${API_URL}`);
    }

    return Promise.reject(error);
  }
);

export default api;
