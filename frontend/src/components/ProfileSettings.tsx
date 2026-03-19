import React, { useState, useRef } from 'react';
import clsx from 'clsx';
import { User, Camera, Shield, Save, LogOut, Lock, ChevronLeft, Smile } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

import api from '../services/api';
import BlockList from './BlockList';
import ChangePasswordModal from './ChangePasswordModal';
import { getMediaUrl } from '../utils/imageUrl';

import { compressImage } from '../utils/imageCompression';

const ProfileSettings = () => {
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isBlockListOpen, setIsBlockListOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
   const [formData, setFormData] = useState({
    name: user?.name || '',
    department: user?.department || '',
    level: user?.level || '300 Level',
    profile_picture: user?.profile_picture || '',
    tick_color: user?.tick_color || '#38BDF8'
  });

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/api/auth/profile');
        updateUser(data);
        setFormData({
          name: data.name || '',
          department: data.department || '',
          level: data.level || '300 Level',
          profile_picture: data.profile_picture || '',
          tick_color: data.tick_color || '#38BDF8'
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      
      const file = await compressImage(originalFile);
      
      // Basic validation (optional but good practice)
      if (file.size > 5 * 1024 * 1024) {
        alert('File is too large. Please select an image under 5MB.');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Upload profile picture if one is selected
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', selectedFile);
        
        const { data: uploadData } = await api.post('/api/auth/profile-picture', uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        updateUser(uploadData);
        // CRITICAL: Update local variable to avoid race condition with state
        const updatedProfilePicture = uploadData.profile_picture;
        setFormData(prev => ({ ...prev, profile_picture: updatedProfilePicture }));
        
        // Use updated image URL directly for the next API call
        const { data } = await api.put('/api/auth/profile', { ...formData, profile_picture: updatedProfilePicture });
        updateUser(data);
        setSelectedFile(null);
      } else {
        // 2. Update other profile details
        const { data } = await api.put('/api/auth/profile', formData);
        updateUser(data);
      }
      alert('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-[100dvh] overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 p-4 md:p-6 pb-32 md:pb-32">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6 md:mb-10 text-center relative mt-2 md:mt-0">
          <button 
            onClick={() => window.history.back()}
            className="md:hidden absolute left-0 top-0 p-2 text-slate-400 hover:text-sky-600 hover:bg-white rounded-xl shadow-sm border border-slate-100 transition-all dark:hover:bg-slate-800 dark:hover:text-slate-400"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="relative inline-block group mb-4 md:mb-6 mt-6 md:mt-0">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl shadow-sky-900/10 relative bg-slate-100 dark:bg-slate-800">
              <img 
                src={previewUrl || getMediaUrl(user?.profile_picture) || `https://ui-avatars.com/api/?name=${user?.name}&background=0ea5e9&color=fff`} 
                className="w-full h-full object-cover" 
                alt="Profile Preview" 
              />
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/jpeg, image/png, image/jpg" 
                className="hidden" 
                aria-label="Upload profile picture"
                title="Upload profile picture file input"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload profile picture"
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer border-none transition-opacity"
              >
                <Camera className="text-white w-6 h-6 md:w-8 md:h-8" />
              </button>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-sky-500 p-2 md:p-2.5 rounded-xl md:rounded-2xl border-4 border-slate-50 text-white select-none pointer-events-none shadow-lg shadow-sky-500/20">
              <Camera className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{user?.name}</h2>
          <p className="text-slate-500 mt-1 text-xs md:text-sm font-medium tracking-wide">{user?.student_id}</p>
        </header>

        <div className="space-y-4 md:space-y-6">
          <section className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-[2rem] p-5 md:p-8 border border-slate-100 dark:border-slate-700 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)]">
            <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-200 mb-5 md:mb-8 flex items-center gap-2">
              <User className="w-4 h-4 md:w-5 md:h-5 text-sky-500" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
              <div className="space-y-2">
                <label htmlFor="name" className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  id="name"
                  type="text" 
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm md:text-base text-slate-800 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <input 
                  id="email"
                  type="email" 
                  defaultValue={user?.email}
                  readOnly
                  placeholder="Your email address"
                  className="w-full bg-slate-100/50 border border-slate-200/50 rounded-xl py-3 px-4 text-sm md:text-base text-slate-400 cursor-not-allowed outline-none font-medium"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="department" className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                <input 
                  id="department"
                  type="text" 
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Your department"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm md:text-base text-slate-800 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="level" className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Study Level</label>
                <select 
                  id="level"
                  value={formData.level}
                  onChange={handleChange}
                  aria-label="Select study level"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm md:text-base text-slate-800 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none appearance-none transition-all font-medium cursor-pointer"
                >
                  <option value="100 Level">100 Level</option>
                  <option value="200 Level">200 Level</option>
                  <option value="300 Level">300 Level</option>
                  <option value="400 Level">400 Level</option>
                  <option value="500 Level">500 Level</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-[2rem] p-5 md:p-8 border border-slate-100 dark:border-slate-700 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)]">
            <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 md:mb-6 flex items-center gap-2">
              <Shield className="w-4 h-4 md:w-5 md:h-5 text-sky-500" />
              Security & Preferences
            </h3>
            <button 
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 text-left group transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-600">
              <div className="w-10 h-10 bg-sky-50 dark:bg-sky-900/50 rounded-xl flex items-center justify-center group-hover:bg-sky-100 dark:group-hover:bg-sky-800/50 transition-colors">
                <Lock className="w-5 h-5 text-sky-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Change Password</p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wide mt-0.5">Update your secure login credentials</p>
              </div>
            </button>

            <button 
              onClick={() => setIsBlockListOpen(true)}
              className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 text-left group transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-600 mt-2"
            >
              <div className="w-10 h-10 bg-sky-50 dark:bg-sky-900/50 rounded-xl flex items-center justify-center group-hover:bg-sky-100 dark:group-hover:bg-sky-800/50 transition-colors">
                <Shield className="w-5 h-5 text-sky-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Blocked Users</p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wide mt-0.5">Manage your restricted contacts</p>
              </div>
            </button>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-[2rem] p-5 md:p-8 border border-slate-100 dark:border-slate-700 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)]">
            <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 md:mb-6 flex items-center gap-2">
              <Smile className="w-4 h-4 md:w-5 md:h-5 text-sky-500" />
              Chat Appearance
            </h3>
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl border border-slate-100 dark:border-slate-600">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Dark Mode</p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wide mt-0.5">Switch between light and dark themes</p>
                </div>
                <ThemeToggle />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl border border-slate-100 dark:border-slate-600">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Delivery Status Color</p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wide mt-0.5">Personalize your message double-ticks</p>
                </div>
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-600 shadow-sm">
                  <input 
                    type="color" 
                    id="tick_color"
                    value={formData.tick_color}
                    onChange={handleChange}
                    className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                    title="Choose tick color"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 pt-2">
                {['#0EA5E9', '#3B82F6', '#10B981', '#8B5CF6', '#F43F5E', '#F59E0B'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tick_color: color }))}
                    className={clsx(
                      "w-10 h-10 rounded-xl shadow-sm transition-all duration-300",
                      formData.tick_color === color ? "scale-110 shadow-md ring-4 ring-offset-2 ring-slate-100" : "hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                    title={`Select ${color}`}
                  />
                ))}
              </div>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full sm:flex-1 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed py-3.5 md:py-4 rounded-2xl font-black text-sm md:text-base text-white shadow-xl shadow-sky-500/20 flex items-center justify-center gap-2 transition-all uppercase tracking-widest"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving Changes...' : 'Save Profile'}
            </button>
            <button 
              onClick={logout}
              className="w-full sm:w-auto px-6 py-3.5 md:py-4 border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 active:scale-[0.98] rounded-2xl text-sm md:text-base font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
      {isBlockListOpen && (
        <BlockList onClose={() => setIsBlockListOpen(false)} />
      )}
    </div>
  );
};

export default ProfileSettings;
