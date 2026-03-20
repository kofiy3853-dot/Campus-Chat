import React from 'react';

const BrandedLoading = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-slate-950 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-100/50 dark:bg-purple-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Animated Logo / Icon Placeholder */}
        <div className="relative w-24 h-24 mb-8">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-3xl border-4 border-purple-100 dark:border-purple-900/30" />
          <div className="absolute inset-0 rounded-3xl border-4 border-t-purple-600 border-r-transparent border-b-transparent border-l-transparent animate-spin-slow" />
          
          {/* Inner pulse */}
          <div className="absolute inset-4 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/20 flex items-center justify-center animate-pulse">
            <span className="text-3xl font-black text-white italic">C</span>
          </div>
        </div>

        {/* Text Loading State */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Preparing Campus
          </h2>
          <div className="flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
      
      {/* Bottom Footer Tip */}
      <div className="absolute bottom-12 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-[0.2em] animate-fade-in">
        Connecting to Database...
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default BrandedLoading;
