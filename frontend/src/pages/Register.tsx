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
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-900/10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-primary-800/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2 bg-primary-600 rounded-lg shadow-sm">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Campus Chat</h1>
        </div>
        
        <div className="relative z-10 max-w-xl">
          <h2 className="text-4xl lg:text-5xl text-white font-bold leading-tight mb-6">Join the campus conversation.</h2>
          <p className="text-slate-400 text-lg md:text-xl leading-relaxed">Create your account to connect with peers, join groups, and stay updated with everything happening on campus.</p>
        </div>
        
        <div className="relative z-10">
          <p className="text-slate-500 text-sm font-medium">© {new Date().getFullYear()} Campus Chat. All rights reserved.</p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white relative z-10 shadow-2xl lg:shadow-none min-h-screen overflow-y-auto">
        <div className="mx-auto w-full max-w-xl lg:max-w-md xl:max-w-lg">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="p-2 bg-primary-600 rounded-lg shadow-sm">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-slate-900 text-3xl font-bold tracking-tight">Campus Chat</h1>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Create Account</h2>
            <p className="mt-3 text-slate-500 text-lg">Join your campus community today</p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-1 xl:grid-cols-2">
            {error && (
              <div className="md:col-span-2 xl:col-span-2 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-1.5 md:col-span-2 xl:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  name="name"
                  required
                  className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-transparent sm:text-sm text-slate-900 bg-slate-50 hover:bg-white transition-colors placeholder-slate-400 font-medium"
                  placeholder="John Doe"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2 xl:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Campus Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  name="email"
                  type="email" 
                  required
                  className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-transparent sm:text-sm text-slate-900 bg-slate-50 hover:bg-white transition-colors placeholder-slate-400 font-medium"
                  placeholder="doe@campus.edu"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Student ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Contact className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  name="student_id"
                  required
                  className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-transparent sm:text-sm text-slate-900 bg-slate-50 hover:bg-white transition-colors placeholder-slate-400 font-medium"
                  placeholder="S1234567"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Department</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <GraduationCap className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  name="department"
                  className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-transparent sm:text-sm text-slate-900 bg-slate-50 hover:bg-white transition-colors placeholder-slate-400 font-medium"
                  placeholder="Computer Science"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  name="password"
                  type="password" 
                  required
                  className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-transparent sm:text-sm text-slate-900 bg-slate-50 hover:bg-white transition-colors placeholder-slate-400 font-medium"
                  placeholder="••••••••"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Study Level</label>
              <select 
                name="level"
                aria-label="Select study level"
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-transparent sm:text-sm text-slate-900 bg-slate-50 hover:bg-white transition-colors placeholder-slate-400 font-medium appearance-none"
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

            <div className="md:col-span-2 xl:col-span-2 mt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm font-medium text-slate-600 pb-12 lg:pb-0">
            Already have an account? {' '}
            <Link to="/login" className="font-bold text-primary-600 hover:text-primary-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
