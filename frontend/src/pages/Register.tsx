import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Contact, GraduationCap, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    student_id: '',
    password: '',
    department: '',
    level: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { data } = await api.post('/api/auth/register', formData);
      login(data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/20 via-slate-950 to-slate-950">
      <div 
        className="w-full max-w-2xl glass p-8 rounded-2xl shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-primary-500/10 rounded-xl mb-4">
            <UserPlus className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Create Account
          </h1>
          <p className="text-slate-400 mt-2">Join your campus community today</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {error && (
            <div className="md:col-span-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                name="name"
                required
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-slate-200"
                placeholder="John Doe"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Campus Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                name="email"
                type="email" 
                required
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-slate-200"
                placeholder="doe@campus.edu"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Student ID</label>
            <div className="relative">
              <Contact className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                name="student_id"
                required
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-slate-200"
                placeholder="S1234567"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Department</label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                name="department"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-slate-200"
                placeholder="Computer Science"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                name="password"
                type="password" 
                required
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-slate-200"
                placeholder="••••••••"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Study Level</label>
            <select 
              name="level"
              aria-label="Select study level"
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-slate-200 appearance-none"
              onChange={handleChange}
            >
              <option value="">Select Level</option>
              <option value="100">100 Level</option>
              <option value="200">200 Level</option>
              <option value="300">300 Level</option>
              <option value="400">400 Level</option>
              <option value="PG">Postgraduate</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="md:col-span-2 w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Loading...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-400 text-sm">
          Already have an account? {' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
