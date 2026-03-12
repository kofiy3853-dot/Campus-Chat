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
    <div className="flex min-h-screen items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/20 via-slate-950 to-slate-950">
      <div 
        className="w-full max-w-md glass p-8 rounded-2xl shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-primary-500/10 rounded-xl mb-4">
            <LogIn className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Welcome Back
          </h1>
          <p className="text-slate-400 mt-2">Sign in to your campus account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="email" 
                required
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-slate-200"
                placeholder="email@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="password" 
                required
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-slate-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2"
          >
            {loading ? 'Loading...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-400 text-sm">
          Don't have an account? {' '}
          <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
