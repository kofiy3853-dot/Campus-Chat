import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, Bell, MessageSquare, Users, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export type ToastType = 'message' | 'success' | 'info' | 'error';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, title, message, duration };
    
    setToasts((prev) => [newToast, ...prev].slice(0, 3)); // Max 3 toasts

    if (duration !== Infinity) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-5 h-5 text-sky-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={clsx(
              "pointer-events-auto w-80 md:w-96 bg-white border border-slate-100 rounded-2xl p-4 shadow-2xl flex items-start gap-4 animate-in slide-in-from-right-10 fade-in duration-300",
              "hover:scale-[1.02] transition-transform cursor-pointer"
            )}
            onClick={() => removeToast(toast.id)}
          >
            <div className="shrink-0 p-2 rounded-xl bg-slate-50 border border-slate-100/50 flex items-center justify-center">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-800 text-sm leading-tight truncate">{toast.title}</h4>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed line-clamp-2 font-medium">{toast.message}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              title="Close notification"
              aria-label="Close notification"
              className="p-1 hover:bg-slate-50 rounded-lg text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
