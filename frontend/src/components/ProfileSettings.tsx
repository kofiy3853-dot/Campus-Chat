import React, { useState, useRef } from 'react';
import { User, Camera, Mail, Contact, GraduationCap, Shield, Save, LogOut, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import api from '../services/api';

const ProfileSettings = () => {
  const { user, login, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    department: user?.department || '',
    level: user?.level || '300 Level',
    profile_picture: user?.profile_picture || ''
  });

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/api/auth/profile');
        updateUser(data);
        setFormData({
          name: data.name,
          department: data.department || '',
          level: data.level || '300 Level',
          profile_picture: data.profile_picture || ''
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
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
        const formData = new FormData();
        formData.append('image', selectedFile);
        
        const { data: uploadData } = await api.post('/api/auth/profile-picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        updateUser(uploadData);
        setFormData(prev => ({ ...prev, profile_picture: uploadData.profile_picture }));
        setSelectedFile(null); // Clear selected file after successful upload
      }

      // 2. Update other profile details
      const { data } = await api.put('/api/auth/profile', formData);
      updateUser(data);
      alert('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 scrollbar-hide">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10 text-center">
          <div className="relative inline-block group mb-6">
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-slate-900 shadow-2xl relative">
              <img 
                src={previewUrl || user?.profile_picture || `https://ui-avatars.com/api/?name=${user?.name}`} 
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
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer border-none"
              >
                <Camera className="text-white w-8 h-8" />
              </button>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary-600 p-2 rounded-xl border-4 border-slate-950 text-white select-none pointer-events-none">
              <Camera className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white">{user?.name}</h2>
          <p className="text-slate-400 mt-1">{user?.student_id}</p>
        </header>

        <div className="space-y-6">
          <section className="glass rounded-2xl p-6 border border-slate-800/50">
            <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-400" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                <input 
                  id="name"
                  type="text" 
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
                <input 
                  id="email"
                  type="email" 
                  defaultValue={user?.email}
                  readOnly
                  placeholder="Your email address"
                  className="w-full bg-slate-900/10 border border-slate-800/50 rounded-xl py-3 px-4 text-slate-500 cursor-not-allowed outline-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="department" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Department</label>
                <input 
                  id="department"
                  type="text" 
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Your department"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="level" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Level</label>
                <select 
                  id="level"
                  value={formData.level}
                  onChange={handleChange}
                  aria-label="Select study level"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:ring-1 focus:ring-primary-500 outline-none appearance-none"
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

          <section className="glass rounded-2xl p-6 border border-slate-800/50">
            <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-400" />
              Security & Preferences
            </h3>
            <button className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-slate-800 text-left group">
              <div className="p-2 bg-slate-900 rounded-lg group-hover:bg-primary-500/10">
                <Lock className="w-5 h-5 text-slate-500 group-hover:text-primary-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-200">Change Password</p>
                <p className="text-[10px] text-slate-500">Update your account password</p>
              </div>
            </button>
          </section>

          <div className="flex items-center gap-4 pt-4">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl font-bold text-white shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              onClick={logout}
              className="px-6 py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl font-bold flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
