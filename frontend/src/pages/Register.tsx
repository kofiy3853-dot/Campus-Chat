import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Contact, GraduationCap, Loader2, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Branding Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Account</h1>
          <p className="text-slate-500 text-sm mt-1">Join the Campus-Networking community</p>
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
                {/* Full Name */}
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                  <input 
                    name="name"
                    required
                    placeholder="Full Name"
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all text-sm placeholder:text-slate-400"
                  />
                </div>

                {/* Email */}
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                  <input 
                    name="email"
                    type="email"
                    required
                    placeholder="Campus Email"
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all text-sm placeholder:text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Student ID */}
                  <div className="relative group">
                    <Contact className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    <input 
                      name="student_id"
                      required
                      placeholder="Student ID"
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all text-sm placeholder:text-slate-400"
                    />
                  </div>

                  {/* Department */}
                  <div className="relative group">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    <input 
                      name="department"
                      placeholder="Dept"
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all text-sm placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Password */}
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    <input 
                      name="password"
                      type="password"
                      required
                      placeholder="Password"
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all text-sm placeholder:text-slate-400"
                    />
                  </div>

                  {/* Study Level */}
                  <div className="relative group">
                    <select 
                      name="level"
                      aria-label="Select study level"
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all text-sm appearance-none cursor-pointer"
                    >
                      <option value="">Level</option>
                      <option value="100">100</option>
                      <option value="200">200</option>
                      <option value="300">300</option>
                      <option value="400">400</option>
                      <option value="PG">PG</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ArrowRight className="w-3 h-3 rotate-90" />
                    </div>
                  </div>
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
                    <span>Creating...</span>
                  </div>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-xs">
              <p className="text-slate-500 font-medium">
                Already have an account? {' '}
                <Link to="/login" className="text-sky-500 font-bold hover:underline underline-offset-4">
                  Sign in
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

export default Register;
