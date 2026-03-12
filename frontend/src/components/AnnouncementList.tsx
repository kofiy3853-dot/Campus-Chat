import React, { useState, useEffect } from 'react';
import { Megaphone, Heart, Bookmark, Share2, Loader2, Calendar, Award, ArrowRight } from 'lucide-react';
import api from '../services/api';
import Skeleton from './Skeleton';

const AnnouncementList = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data } = await api.get('/api/announcements');
        setAnnouncements(data);
      } catch (err) {
        console.error('Error fetching announcements:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  if (loading) return (
    <div className="flex-1 overflow-y-auto bg-[#0A0F1D] p-10 space-y-10">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
        </div>
        {[1, 2, 3].map(i => (
            <div key={i} className="p-8 bg-slate-900/40 rounded-[2rem] border border-slate-800/50 space-y-6">
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
    <div className="flex-1 overflow-y-auto bg-[#0A0F1D] scrollbar-hide py-12 px-6 sm:px-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 relative">
          <div className="absolute -left-12 -top-4 w-24 h-24 bg-primary-500/10 rounded-full blur-3xl"></div>
          <div className="flex items-center gap-4 mb-3">
             <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Megaphone className="text-amber-500 w-6 h-6" />
             </div>
             <span className="text-amber-500 text-sm font-bold uppercase tracking-[0.2em]">Live Campus Feed</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight sm:text-5xl">
            Campus <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Announcements</span>
          </h2>
          <p className="text-slate-400 mt-4 text-lg max-w-xl leading-relaxed font-medium">
            Official updates, emergency alerts, and student life highlights from around the campus.
          </p>
        </header>

        <div className="space-y-8">
          {announcements.length === 0 ? (
             <div className="py-20 flex flex-col items-center text-slate-600 bg-slate-900/20 rounded-[3rem] border border-slate-800/50 border-dashed">
                <Award className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">No announcements yet. Check back soon!</p>
             </div>
          ) : (
            announcements.map((ann: any, idx) => (
              <div 
                key={ann._id}
                className="bg-slate-900/40 backdrop-blur-sm p-8 rounded-[2.5rem] border border-slate-800/50 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[60px] translate-x-1/2 -translate-y-1/2"></div>
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl border-2 border-slate-800 p-0.5">
                      <img className="w-full h-full object-cover rounded-[0.8rem]" src={ann.posted_by.profile_picture || `https://ui-avatars.com/api/?name=${ann.posted_by.name}`} alt="" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 tracking-tight">{ann.posted_by.name}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(ann.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 rounded-full border border-amber-500/20">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest">Verified</span>
                  </div>
                </div>

                <div className="relative z-10">
                    <h3 className="text-2xl font-black text-white mb-4 leading-tight uppercase tracking-tight">{ann.title}</h3>
                    <p className="text-slate-400 leading-[1.8] text-[16px] mb-8 font-medium whitespace-pre-wrap selection:bg-amber-500/20 capitalize">{ann.content}</p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/50 pt-6 relative z-10">
                  <div className="flex items-center gap-6">
                    <button aria-label="Like" className="flex items-center gap-2.5 text-slate-500 hover:text-red-400">
                      <Heart className="w-6 h-6" />
                      <span className="text-sm font-bold">{ann.reactions?.length || 0}</span>
                    </button>
                    <button aria-label="Bookmark" className="text-slate-500 hover:text-primary-400">
                      <Bookmark className="w-6 h-6" />
                    </button>
                  </div>
                  <button className="flex items-center gap-2 text-slate-500 hover:text-white font-bold text-sm group/btn">
                    Read More
                    <ArrowRight className="w-4 h-4" />
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
