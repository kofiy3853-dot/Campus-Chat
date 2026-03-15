import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      login(data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Branding Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <LogIn className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your Campus-Networking account</p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Email */}
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                  <input 
                    type="email" 
                    required
                    placeholder="Campus Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all text-sm placeholder:text-slate-400"
                  />
                </div>

                {/* Password */}
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                  <input 
                    type="password" 
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all text-sm placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-4 flex justify-center py-3.5 px-6 rounded-2xl bg-sky-500 text-white font-bold text-sm shadow-sm hover:bg-sky-600 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-xs">
              <p className="text-slate-500 font-medium">
                New to the network? {' '}
                <Link to="/register" className="text-sky-500 font-bold hover:underline underline-offset-4">
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Branding */}
        <div className="mt-8 text-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">© Campus-Networking</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
  );
};

export default Login;
