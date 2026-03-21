import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { 
  User, 
  Settings, 
  ChevronLeft, 
  MapPin, 
  GraduationCap, 
  Bell, 
  Shield, 
  LogOut,
  ChevronRight,
  CreditCard,
  Award,
  Users,
  Trophy,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../utils/imageUrl';
import { compressImage } from '../utils/imageCompression';
import api from '../services/api';

const ProfileSettings = () => {
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState({
    credits: '-',
    clubs: '-',
    rank: '-'
  });
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch Clubs
        const { data: myClubs } = await api.get('/api/clubs/my-clubs');
        
        // Fetch Leaderboard for points and rank
        const { data: lbData } = await api.get('/api/leaderboard');
        const myLBEntry = lbData.allTime?.find((e: any) => (e.user?._id || e.user) === user?._id);
        const myRank = lbData.allTime?.findIndex((e: any) => (e.user?._id || e.user) === user?._id);

        setStats({
          credits: myLBEntry?.totalPoints?.toString() || '0',
          clubs: myClubs.length.toString(),
          rank: myRank !== -1 ? `Rank ${myRank + 1}` : 'N/A'
        });
      } catch (err) {
        console.error('Failed to fetch profile stats:', err);
      }
    };

    if (user) fetchStats();
  }, [user]);

  const scrollToSettings = () => {
    if (settingsRef.current) {
      settingsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      console.warn('Settings ref not found for scrolling');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      const file = await compressImage(originalFile);
      
      setLoading(true);
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('image', file);
        
        const { data: uploadData } = await api.post('/api/auth/profile-picture', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        updateUser(uploadData);
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        alert('Failed to upload image');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-white pb-24 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-purple-50/50">
        <button 
          onClick={() => window.history.back()}
          className="p-2 text-slate-800 hover:bg-purple-50 rounded-xl transition-colors"
          title="Go Back"
          aria-label="Go Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black text-[#4c1d95] tracking-tight">Profile</h1>
        <button 
          onClick={() => {
            console.log('Settings clicked');
            scrollToSettings();
          }}
          className="relative z-20 p-2 text-slate-800 hover:bg-purple-50 active:bg-purple-100 rounded-xl transition-all active:scale-90 cursor-pointer flex items-center justify-center shadow-sm border border-purple-50 bg-white/50"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-6 h-6 pointer-events-none text-[#6d28d9]" />
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 space-y-6">
        {/* User Hero Section */}
        <div className="relative pt-8 pb-6 flex flex-col items-center text-center bg-white rounded-[2.5rem] shadow-sm border border-purple-50/50">
          <div className="relative mb-6">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl shadow-purple-200/30 relative group">
              <img 
                src={getMediaUrl(user?.profile_picture) || `https://ui-avatars.com/api/?name=${user?.name}&background=8444e2&color=fff`} 
                className="w-full h-full object-cover" 
                alt="Profile" 
              />
              <input 
                type="file" 
                id="profile-picture-input"
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
                title="Change profile picture"
                aria-label="Change profile picture"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                title="Upload new profile picture"
                aria-label="Upload new profile picture"
              >
                <User className="text-white w-8 h-8" />
              </button>
            </div>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-full">
                <div className="w-8 h-8 border-4 border-[#6d28d9] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <h2 className="text-3xl font-black text-[#1e1b4b] tracking-tight">{user?.name || 'Sophie Laurent'}</h2>
          
          <div className="mt-2 inline-flex items-center px-4 py-1.5 bg-purple-50 text-[#6d28d9] rounded-full text-xs font-black uppercase tracking-wider">
            {user?.department || 'Computer Science & Design'}
          </div>

          <div className="mt-4 flex items-center gap-4 text-slate-400 text-sm font-semibold">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#6d28d9]" />
              Campus Network
            </span>
            <span className="text-slate-200">•</span>
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-[#6d28d9]" />
              Level {user?.level || '100'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[2rem] border border-purple-50/50 shadow-sm flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform cursor-default">
            <span className="text-2xl font-black text-[#6d28d9] mb-1">{stats.credits}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-wrap">POINTS & CREDITS</span>
          </div>
          <div className="bg-white p-5 rounded-[2rem] border border-purple-50/50 shadow-sm flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform cursor-default">
            <span className="text-2xl font-black text-[#6d28d9] mb-1">{stats.clubs}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-wrap">CLUBS JOINED</span>
          </div>
          <div className="bg-white p-5 rounded-[2rem] border border-purple-50/50 shadow-sm flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform cursor-default col-span-2">
            <span className="text-2xl font-black text-[#6d28d9] mb-1">{stats.rank}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-wrap">CAMPUS RANKING</span>
          </div>
        </div>

        {/* Academic Progress */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-[#2d1a47] flex items-center gap-2">
            Academic Progress
            <span className="w-2 h-2 rounded-full bg-[#8444e2]" />
          </h3>
          
          <div className="bg-purple-50/30 rounded-[2.5rem] p-6 border border-purple-50">
            <div className="flex justify-between items-end mb-3">
              <span className="text-sm font-bold text-[#2d1a47]">Degree Completion</span>
              <span className="text-base font-black text-[#6d28d9]">76%</span>
            </div>
            <div className="h-3 w-full bg-purple-100/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#6d28d9] rounded-full transition-all duration-1000" 
                style={{ width: '76%' }} 
              />
            </div>

            <div className="mt-8 space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Current Enrollment</span>
              <div className="p-4 bg-white rounded-2xl border border-purple-50/50 shadow-sm">
                <span className="text-sm font-bold text-[#44337a] uppercase tracking-tight">{user?.department || 'General Studies'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Student ID Card */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-[#2d1a47] flex items-center gap-2">
            Student ID
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </h3>
          
          <div className="relative overflow-hidden bg-gradient-to-br from-[#8444e2] via-[#7c3aed] to-[#6d28d9] rounded-[2.5rem] p-8 text-white shadow-xl shadow-purple-500/20">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-xl" />

            <div className="relative flex justify-between items-start mb-8 transition-none">
              <div>
                <p className="text-[10px] font-black text-purple-100 uppercase tracking-widest opacity-80">Student ID Number</p>
                <p className="text-2xl font-black mt-1 uppercase tracking-tighter">{user?.student_id || 'VC-XXXX-XXXX'}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>

            <div className="relative grid grid-cols-2 gap-4 mt-auto transition-none">
              <div>
                <p className="text-[10px] font-black text-purple-100 uppercase tracking-widest opacity-80">Year of Study</p>
                <p className="text-sm font-bold mt-1">Level {user?.level || '100'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-purple-100 uppercase tracking-widest opacity-80">Validation</p>
                <p className="text-sm font-bold mt-1">Active Account</p>
              </div>
            </div>
            
            {/* ID Bar */}
            <div className="absolute bottom-6 left-8 right-8 h-1 bg-[#10b981] rounded-full mt-6" />
          </div>
        </div>

        {/* Account & Settings */}
        <div ref={settingsRef} className="space-y-4 pt-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Account & Settings</h3>
          
          <div className="bg-white rounded-[2.5rem] overflow-hidden border border-purple-50/50 shadow-sm">
            <button className="w-full flex items-center gap-4 p-5 hover:bg-purple-50 transition-colors group">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-[#6d28d9] group-hover:bg-[#6d28d9] group-hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
              </div>
              <span className="flex-1 text-left font-bold text-[#44337a]">Notifications</span>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
            
            <div className="h-px bg-purple-50 mx-5" />
            
            <button className="w-full flex items-center gap-4 p-5 hover:bg-purple-50 transition-colors group">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-[#6d28d9] group-hover:bg-[#6d28d9] group-hover:text-white transition-colors">
                <Shield className="w-5 h-5" />
              </div>
              <span className="flex-1 text-left font-bold text-[#44337a]">Privacy & Security</span>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
            
            <div className="h-px bg-purple-50 mx-5" />
            
            <button 
              onClick={logout}
              className="w-full flex items-center gap-4 p-5 hover:bg-red-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="flex-1 text-left font-bold text-red-500">Logout</span>
              <ChevronRight className="w-5 h-5 text-red-200" />
            </button>
            
            <div className="h-px bg-purple-50 mx-5" />

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;

