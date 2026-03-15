import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Contact, GraduationCap, Loader2, ArrowRight, Sparkles } from 'lucide-react';
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
    <div className="relative min-h-[100dvh] w-full bg-slate-950 flex items-center justify-center p-4 md:p-8 overflow-x-hidden font-sans">
      {/* Dynamic Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        
        {/* Left Content / Value Prop */}
        <div className="flex-1 text-center lg:text-left space-y-8 max-w-xl hidden lg:block">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-sky-100 uppercase tracking-[0.2em]">The Future of Campus Life</span>
          </div>
          
          <h1 className="text-5xl xl:text-7xl font-black text-white leading-[1.1] tracking-tight">
            Connect. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Collaborate.</span> <br />
            Network.
          </h1>
          
          <p className="text-slate-400 text-lg xl:text-xl leading-relaxed font-medium">
            Join thousands of students and faculty members in the most advanced campus networking platform.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-4 justify-center lg:justify-start">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-950 overflow-hidden bg-slate-800">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" />
                </div>
              ))}
            </div>
            <p className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <span className="text-sky-400">+500</span> students joined today
            </p>
          </div>
        </div>

        {/* Right Form Component (Glass Card) */}
        <div className="w-full lg:w-[500px] bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden self-center transition-all duration-500 hover:border-white/20">
          <div className="p-8 md:p-12">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-gradient-to-tr from-sky-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-sky-500/20 rotate-3">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight mb-2">Create Account</h2>
              <p className="text-slate-400 font-medium">Building bridges across campus</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-shake">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="md:col-span-2 space-y-2">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
                    <input 
                      name="name"
                      required
                      placeholder="Full Name"
                      onChange={handleChange}
                      className="w-full bg-white/[0.05] border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all font-medium placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="md:col-span-2 space-y-2">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
                    <input 
                      name="email"
                      type="email"
                      required
                      placeholder="Campus Email"
                      onChange={handleChange}
                      className="w-full bg-white/[0.05] border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all font-medium placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Student ID */}
                <div className="space-y-2">
                  <div className="relative group">
                    <Contact className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
                    <input 
                      name="student_id"
                      required
                      placeholder="Student ID"
                      onChange={handleChange}
                      className="w-full bg-white/[0.05] border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all font-medium placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <div className="relative group">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
                    <input 
                      name="department"
                      placeholder="Department"
                      onChange={handleChange}
                      className="w-full bg-white/[0.05] border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all font-medium placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
                    <input 
                      name="password"
                      type="password"
                      required
                      placeholder="Password"
                      onChange={handleChange}
                      className="w-full bg-white/[0.05] border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all font-medium placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Study Level */}
                <div className="space-y-2">
                  <div className="relative group">
                    <select 
                      name="level"
                      aria-label="Select study level"
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-white/10 text-white rounded-2xl py-4 px-4 outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all font-medium appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-slate-900">Study Level</option>
                      <option value="100" className="bg-slate-900">100 Level</option>
                      <option value="200" className="bg-slate-900">200 Level</option>
                      <option value="300" className="bg-slate-900">300 Level</option>
                      <option value="400" className="bg-slate-900">400 Level</option>
                      <option value="PG" className="bg-slate-900">Postgraduate</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <ArrowRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-6 flex justify-center py-4.5 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black uppercase tracking-wider shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none group"
              >
                {loading ? (
                  <div className="flex items-center gap-3 py-1">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-1">
                    <span>Create Account</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-slate-400 font-medium">
                Already part of the network? {' '}
                <Link to="/login" className="text-sky-400 font-black hover:text-sky-300 transition-colors underline underline-offset-4 decoration-sky-400/30">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          {/* Footer Branding */}
          <div className="bg-white/[0.02] py-4 px-8 border-t border-white/5 flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3 text-sky-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Powered by Campus-Networking Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
