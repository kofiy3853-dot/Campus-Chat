import React, { useState, useEffect } from 'react';
import { X, User, MapPin, GraduationCap, Clock, Mail, Users, MessageSquare, Shield, ShieldOff, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { getMediaUrl } from '../utils/imageUrl';
import { formatLastSeen } from '../utils/time';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface ProfileViewProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  isGroup?: boolean;
  groupData?: any;
}

const ProfileView: React.FC<ProfileViewProps> = ({ isOpen, onClose, targetId, isGroup, groupData }) => {
  const { user: currentUser } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || isGroup) return;

    const fetchProfileAndBlockStatus = async () => {
      try {
        setLoading(true);
        const [profileRes, blockRes] = await Promise.all([
          api.get(`/api/auth/profile/${targetId}`),
          api.get('/api/chat/blocked-users')
        ]);
        setProfile(profileRes.data);
        const isUserBlocked = blockRes.data.some((u: any) => u._id === targetId);
        setIsBlocked(isUserBlocked);
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndBlockStatus();
  }, [isOpen, targetId, isGroup]);

  const handleBlockToggle = async () => {
    try {
      setBlockLoading(true);
      await api.post(`/api/chat/block/${targetId}`);
      setIsBlocked(!isBlocked);
    } catch (error) {
      console.error('Error toggling block status:', error);
    } finally {
      setBlockLoading(false);
    }
  };

  if (!isOpen) return null;

  const data = isGroup ? {
    name: groupData?.group_name || 'Unnamed Group',
    profile_picture: null,
    department: 'Community Group',
    level: `${groupData?.members?.length || 0} Members`,
    isGroup: true
  } : profile;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden pointer-events-none">
      {/* Backdrop */}
      <div 
        className={clsx(
          "absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-500 pointer-events-auto",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Slide-over Content */}
      <div 
        className={clsx(
          "relative w-full max-w-sm bg-white h-full shadow-2xl transition-transform duration-500 ease-out pointer-events-auto border-l border-gray-100 flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header/Banner Area */}
        <div className="relative h-48 bg-gradient-to-br from-sky-400 to-sky-600 shrink-0">
          <button 
            onClick={onClose}
            aria-label="Close profile"
            title="Close profile"
            className="absolute top-4 left-4 p-2 bg-black/20 text-white rounded-full hover:bg-black/40 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 rounded-3xl border-4 border-white overflow-hidden bg-slate-100 shadow-xl shadow-sky-900/10">
              {data?.isGroup ? (
                <div className="w-full h-full flex items-center justify-center bg-sky-100 text-sky-500">
                  <Users className="w-12 h-12" />
                </div>
              ) : (
                <img 
                  src={getMediaUrl(data?.profile_picture) || `https://ui-avatars.com/api/?name=${data?.name || 'User'}&background=0EA5E9&color=fff`} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 mt-16 px-8 pb-8 overflow-y-auto scrollbar-hide">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{data?.name}</h2>
            {!isGroup && data?.status === 'online' && (
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-slow"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Online</span>
              </div>
            )}
            {!isGroup && data?.status !== 'online' && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Last seen {formatLastSeen(data?.last_seen)}
                </p>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Details</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                    <GraduationCap className="w-5 h-5 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Department</p>
                    <p className="text-sm font-black text-slate-800 tracking-tight">
                        {isGroup ? 'Community Hub' : (data?.department || 'Not specified')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                    <Clock className="w-5 h-5 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                        {isGroup ? 'Members' : 'Study Level'}
                    </p>
                    <p className="text-sm font-black text-slate-800 tracking-tight">
                        {isGroup ? `${groupData?.members?.length || 0} Members` : (data?.level || '300 Level')}
                    </p>
                  </div>
                </div>

                {isGroup && (
                    <div className="flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                            <Users className="w-5 h-5 text-sky-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Admin</p>
                            <p className="text-sm font-black text-slate-800 tracking-tight">
                                {typeof groupData?.admin === 'object' ? groupData?.admin?.name : 'Group Admin'}
                            </p>
                        </div>
                    </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50 space-y-3">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Return to Chat
              </button>

              {!isGroup && currentUser?._id !== targetId && (
                <button 
                  onClick={handleBlockToggle}
                  disabled={blockLoading}
                  className={clsx(
                    "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 border shadow-sm",
                    isBlocked 
                      ? "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100" 
                      : "bg-red-50 text-red-600 border-red-100 hover:bg-red-50 shadow-red-500/10 hover:border-red-200"
                  )}
                >
                  {blockLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isBlocked ? (
                    <>
                      <ShieldOff className="w-4 h-4" />
                      Unblock User
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Block User
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
