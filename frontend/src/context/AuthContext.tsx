import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  email: string;
  student_id: string;
  department?: string;
  level?: string;
  token: string;
  profile_picture?: string;
  status?: string;
  tick_color?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  updateUser: (userData: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set base URL from environment variable
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      axios.defaults.baseURL = apiUrl;
    } else if (import.meta.env.PROD) {
      console.error('❌ CRITICAL: VITE_API_URL is not defined in production. API calls will fail with 405.');
    }

    // Axios Interceptor for Authorization
    const requestInterceptor = axios.interceptors.request.use((config) => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        config.headers.Authorization = `Bearer ${userData.token}`;
      }
      return config;
    });

    // Axios Interceptor for Handling 401 Errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('Unauthorized request detected. Logging out...');
          logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      }
    } catch (err) {
      console.error('Failed to parse stored user data:', err);
      localStorage.removeItem('user'); // Clear potentially corrupted data
    } finally {
      setLoading(false);
    }

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...userData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
