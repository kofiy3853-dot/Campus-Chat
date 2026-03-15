import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
import { ToastProvider } from './context/ToastContext';
import { ChatProvider } from './context/ChatContext';
import { SocketProvider } from './context/SocketContext';
import { UnreadProvider } from './context/UnreadContext';
import SyncService from './components/SyncService';
import ProtectedRoute from './components/ProtectedRoute';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';
import './App.css';

function App() {
  useEffect(() => {
    // Hide the splash screen after the app is mounted
    const hideSplash = async () => {
      try {
        await SplashScreen.hide();
      } catch (e) {
        console.warn('SplashScreen hide failed (probably not running on native):', e);
      }
    };
    hideSplash();

    // Hardware back button listener
    const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      backListener.then(l => l.remove());
    };
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <SocketProvider>
            <UnreadProvider>
              <ChatProvider>
                <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-primary-500/30">
                  <Suspense fallback={null}>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route 
                        path="/dashboard/*" 
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="/" element={<Navigate to="/dashboard" />} />
                    </Routes>
                  </Suspense>
                  <SyncService />
                </div>
              </ChatProvider>
            </UnreadProvider>
          </SocketProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
