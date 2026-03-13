import React, { useState, useEffect } from 'react';
import { Megaphone, Heart, Bookmark, Share2, Loader2, Calendar, Award, ArrowRight, ChevronLeft } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../utils/imageUrl';
import Skeleton from './Skeleton';

const AnnouncementList = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchAnnouncements();
  }, []);

  if (loading) return (
    <div className="flex-1 overflow-y-auto bg-white p-10 space-y-10 transition-none">
      <div className="max-w-4xl mx-auto space-y-10 transition-none">
        <div className="space-y-4 transition-none">
            <Skeleton className="h-10 w-64 transition-none" />
            <Skeleton className="h-4 w-96 transition-none" />
        </div>
        {[1, 2, 3].map(i => (
            <div key={i} className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-6 transition-none">
                <div className="flex justify-between transition-none">
                    <div className="flex gap-4 transition-none">
                        <Skeleton variant="circle" className="w-12 h-12 transition-none" />
                        <div className="space-y-2 transition-none">
                            <Skeleton className="h-4 w-32 transition-none" />
                            <Skeleton className="h-3 w-20 transition-none" />
                        </div>
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full transition-none" />
                </div>
                <Skeleton className="h-8 w-3/4 transition-none" />
                <Skeleton className="h-24 w-full transition-none" />
            </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-white scrollbar-hide py-5 md:py-8 px-3 md:px-12 transition-none">
      <div className="max-w-4xl mx-auto transition-none">
        <header className="mb-6 md:mb-8 relative transition-none">
          <div className="absolute -left-12 -top-4 w-24 h-24 bg-sky-500/5 rounded-full blur-3xl transition-none"></div>
          <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-3 transition-none">
             <button 
               onClick={() => window.history.back()}
               className="md:hidden p-1.5 -ml-1 text-gray-400 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-none"
               aria-label="Back"
             >
               <ChevronLeft className="w-5 h-5" />
             </button>
             <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 transition-none">
                <Megaphone className="text-amber-500 w-4 h-4 md:w-5 md:h-5" />
             </div>
             <span className="text-amber-500 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] transition-none">Live Campus Feed</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-5xl font-black text-gray-800 tracking-tight leading-tight transition-none">
            Campus <span className="text-sky-500">Announcements</span>
          </h2>
          <p className="text-gray-500 mt-1.5 text-sm md:text-base max-w-xl leading-relaxed font-medium transition-none">
            Official updates and alerts from around the campus.
          </p>
        </header>

        <div className="space-y-6 md:space-y-8 transition-none">
          {announcements.length === 0 ? (
             <div className="py-12 md:py-20 flex flex-col items-center text-gray-400 bg-gray-50 rounded-2xl md:rounded-[3rem] border border-gray-100 border-dashed transition-none">
                <Award className="w-12 h-12 md:w-16 md:h-16 mb-4 opacity-20" />
                <p className="text-base md:text-lg font-bold">No announcements yet.</p>
             </div>
          ) : (
            announcements.map((announcement: any) => (
              <div 
                key={announcement._id}
                className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-gray-100 group relative overflow-hidden transition-none shadow-sm"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-[60px] translate-x-1/2 -translate-y-1/2 transition-none"></div>
                
                <div className="flex items-center justify-between mb-4 md:mb-6 relative z-10 transition-none">
                  <div className="flex items-center gap-2.5 md:gap-3 transition-none">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl border border-gray-100 p-0.5 transition-none">
                        <img 
                          src={getMediaUrl(announcement.posted_by?.profile_picture) || `https://ui-avatars.com/api/?name=${announcement.posted_by?.name}`} 
                          alt={announcement.posted_by?.name} 
                          className="w-full h-full object-cover rounded-md md:rounded-lg transition-none" 
                        />
                    </div>
                    <div className="transition-none">
                      <h4 className="text-xs md:text-sm font-bold text-gray-800 tracking-tight">{announcement.posted_by?.name}</h4>
                      <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 transition-none">
                        <Calendar className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        {new Date(announcement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 md:py-1 bg-amber-50 rounded-full border border-amber-100 transition-none">
                    <Award className="w-2.5 h-2.5 md:w-3 md:h-3 text-amber-500" />
                    <span className="text-amber-500 text-[8px] md:text-[9px] font-black uppercase tracking-widest">Verified</span>
                  </div>
                </div>

                <div className="relative z-10 transition-none">
                    <h3 className="text-base md:text-2xl font-black text-gray-800 mb-2 md:mb-3 leading-tight uppercase tracking-tight">{announcement.title}</h3>
                    <p className="text-gray-600 leading-relaxed text-xs md:text-[16px] mb-4 md:mb-6 font-medium whitespace-pre-wrap transition-none">{announcement.content}</p>
                </div>

                <div className="flex items-center justify-between border-t border-gray-50 pt-4 md:pt-6 relative z-10 transition-none">
                  <div className="flex items-center gap-4 md:gap-6 transition-none">
                    <button aria-label="Like" className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-none">
                      <Heart className="w-5 h-5 md:w-6 md:h-6" />
                      <span className="text-xs md:text-sm font-bold">{announcement.reactions?.length || 0}</span>
                    </button>
                    <button aria-label="Bookmark" className="text-gray-400 hover:text-sky-500 transition-none">
                      <Bookmark className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  </div>
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-sky-500 font-bold text-xs md:text-sm transition-none group/btn transition-none">
                    <span className="hidden xs:inline">Read More</span>
                    <span className="xs:hidden">More</span>
                    <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover/btn:translate-x-1 transition-none" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementList;
