import React, { Component, ErrorInfo, ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // Log to Sentry
    Sentry.captureException(error, { extra: errorInfo as any });
  }

  private handleReset = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#fcfaff] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-purple-500/10 border border-purple-100 p-8 md:p-12 text-center relative overflow-hidden">
            {/* Background Decorative Circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#6d28d9]/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative">
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-red-100">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>

              <h1 className="text-2xl font-black text-[#1e1b4b] mb-4 tracking-tight">
                Oops! Something went wrong
              </h1>
              
              <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                We've encountered an unexpected error. Don't worry, our team has been notified and we're on it.
              </p>

              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full py-4 bg-[#6d28d9] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#5b21b6] active:scale-[0.98] transition-all shadow-xl shadow-purple-200"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try refreshing
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="w-full py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 active:scale-[0.98] transition-all"
                >
                  <Home className="w-5 h-5" />
                  Back to home
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-purple-50 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                Error ID: {Math.random().toString(36).substring(2, 9).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
