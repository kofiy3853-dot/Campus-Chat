import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Megaphone, Heart, Bookmark, Share2, Calendar, Award, ArrowRight, ChevronLeft, Pin, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getMediaUrl } from '../utils/imageUrl';
import Skeleton from './Skeleton';
import CreateAnnouncementModal from './CreateAnnouncementModal';

const AnnouncementList = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('compose') === 'true') {
      setIsModalOpen(true);
    }
  }, [location]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/announcements');
      setAnnouncements(res.data);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_announcement', (newAnnouncement: any) => {
      setAnnouncements(prev => {
        const updated = [newAnnouncement, ...prev];
        return updated.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      });
    });

    return () => {
      socket.off('new_announcement');
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('announcement_deleted', ({ id }: { id: string }) => {
      setAnnouncements(prev => prev.filter(ann => ann._id !== id));
    });

    return () => {
      socket.off('announcement_deleted');
    };
  }, [socket]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/api/announcements/${id}`);
      setAnnouncements(prev => prev.filter(ann => ann._id !== id));
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      alert('Failed to delete announcement');
    }
  };

  if (loading) return (
    <div className="flex-1 overflow-y-auto bg-white p-10 space-y-10">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
        </div>
        {[1, 2, 3].map(i => (
            <div key={i} className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-6">
                <div className="flex justify-between">
                    <div className="flex gap-4">
                        <Skeleton variant="circle" className="w-12 h-12" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-24 w-full" />
            </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex-1 h-full relative overflow-hidden bg-slate-50">
      <div className="h-full overflow-y-auto scrollbar-hide py-5 md:py-8 px-3 md:px-12">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 md:mb-12 relative">
            <div className="absolute -left-12 -top-4 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-3">
                <button 
                  onClick={() => window.history.back()}
                  className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-[#6d28d9] hover:bg-white rounded-xl transition-colors"
                  aria-label="Back"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-100">
                    <Megaphone className="text-[#6d28d9] w-4 h-4 md:w-5 md:h-5" />
                </div>
                <span className="text-[#6d28d9] text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Campus Official</span>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-5xl font-black text-[#4c1d95] tracking-tight leading-tight">
              Campus <span className="text-[#6d28d9]">Announcements</span>
            </h2>
            <p className="text-slate-500 mt-2 text-sm md:text-lg max-w-xl leading-relaxed font-bold uppercase tracking-wide opacity-60">
              Stay ahead with the latest live updates.
            </p>
          </header>

          <div className="space-y-6 md:space-y-8 pb-24">
            {announcements.length === 0 ? (
               <div className="py-12 md:py-20 flex flex-col items-center text-gray-400 bg-gray-50 rounded-2xl md:rounded-[3rem] border border-gray-100 border-dashed">
                  <Award className="w-12 h-12 md:w-16 md:h-16 mb-4 opacity-20" />
                  <p className="text-base md:text-lg font-bold">No announcements yet.</p>
               </div>
            ) : (
              announcements.map((announcement: any) => (
                <div 
                  key={announcement._id}
                  className={`bg-white p-6 md:p-10 rounded-[2.5rem] border ${announcement.pinned ? 'border-purple-200 shadow-purple-500/5' : 'border-purple-50'} group relative overflow-hidden shadow-sm hover:shadow-xl hover:shadow-purple-500/5 hover:border-purple-200 transition-all duration-300`}
                >
                  {announcement.pinned && (
                     <div className="absolute top-8 right-10 flex items-center gap-1.5 text-[#6d28d9] bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100 z-20">
                       <Pin className="w-3.5 h-3.5 fill-[#6d28d9]" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Pinned</span>
                     </div>
                  )}
                  
                  <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2"></div>
                  
                  <div className="flex items-center justify-between mb-4 md:mb-6 relative z-10">
                    <div className="flex items-center gap-2.5 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl border border-gray-100 p-0.5">
                          <img 
                            src={getMediaUrl(announcement.posted_by?.profile_picture) || `https://ui-avatars.com/api/?name=${announcement.posted_by?.name}`} 
                            alt={announcement.posted_by?.name} 
                            className="w-full h-full object-cover rounded-md md:rounded-lg" 
                          />
                      </div>
                      <div className="transition-none">
                        <h4 className="text-xs md:text-sm font-black text-slate-800 tracking-tight">{announcement.posted_by?.name}</h4>
                        <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                          <Calendar className="w-2.5 h-2.5 md:w-3 md:h-3" />
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!announcement.pinned && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 rounded-full border border-purple-100">
                          <Award className="w-2.5 h-2.5 md:w-3 md:h-3 text-[#6d28d9]" />
                          <span className="text-[#6d28d9] text-[9px] font-black uppercase tracking-widest">Verified</span>
                        </div>
                      )}
                      {(user?.role === 'admin' || user?._id === (announcement.posted_by?._id || announcement.posted_by) || user?.email === 'nharnahyhaw19@gmail.com') && (
                        <button 
                          onClick={() => handleDelete(announcement._id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete announcement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="relative z-10">
                      <h3 className="text-lg md:text-3xl font-black text-[#4c1d95] mb-3 md:mb-5 leading-tight tracking-tight">{announcement.title}</h3>
                      <p className="text-slate-600 leading-relaxed text-sm md:text-lg mb-6 md:mb-8 font-medium whitespace-pre-wrap">{announcement.content}</p>
                      
                      {announcement.image && (
                        <div className="mb-6 rounded-2xl md:rounded-[2rem] overflow-hidden border border-gray-100 aspect-video md:aspect-[21/9]">
                          <img 
                            src={getMediaUrl(announcement.image)} 
                            alt={announcement.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-50 pt-4 md:pt-6 relative z-10">
                    <div className="flex items-center gap-4 md:gap-6">
                      <button aria-label="Like" className="flex items-center gap-2 text-gray-400 hover:text-red-500">
                        <Heart className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="text-xs md:text-sm font-bold">{announcement.reactions?.length || 0}</span>
                      </button>
                      <button aria-label="Bookmark" className="text-gray-400 hover:text-sky-500">
                        <Bookmark className="w-5 h-5 md:w-6 md:h-6" />
                      </button>
                      <button aria-label="Share" className="text-gray-400 hover:text-sky-500">
                        <Share2 className="w-5 h-5 md:w-6 md:h-6" />
                      </button>
                    </div>
                    <button className="flex items-center gap-1.5 text-gray-400 hover:text-sky-500 font-bold text-xs md:text-sm group/btn">
                      <span className="hidden xs:inline">Read More</span>
                      <span className="xs:hidden">More</span>
                      <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <CreateAnnouncementModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchAnnouncements} 
      />
    </div>
  );
};

export default AnnouncementList;
