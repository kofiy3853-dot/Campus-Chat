import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bell,
  TrendingUp,
  MapPin,
  SlidersHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { clsx } from 'clsx';
import Skeleton from '../components/Skeleton';
import SafeImage from '../components/SafeImage';
import { useAuth } from '../context/AuthContext';

const DiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [popularConfessions, setPopularConfessions] = useState<any[]>([]);
  const [featuredGroup, setFeaturedGroup] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('#Trending');

  const tags = ['#Trending', '#Events', '#Groups', '#Marketplace', '#Confessions'];

  const fetchDiscoveryData = async () => {
    try {
      setLoading(true);
      const [confessionsRes, groupsRes, eventsRes] = await Promise.all([
        api.get('/api/confessions?page=1&sort=top').catch(() => ({ data: { confessions: [] } })),
        api.get('/api/groups').catch(() => ({ data: [] })),
        api.get('/api/events?sort=upcoming').catch(() => ({ data: [] }))
      ]);
      
      setPopularConfessions((confessionsRes.data?.confessions || []).slice(0, 3));
      
      // Pick a random or first group to feature
      const groups = groupsRes.data || [];
      if (groups.length > 0) {
        setFeaturedGroup(groups[0]);
      }
      
      setUpcomingEvents((eventsRes.data || []).slice(0, 3));
    } catch (error) {
      console.error('Error fetching discovery data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscoveryData();
  }, []);

  // Helper for joining group
  const joinGroup = async (groupId: string) => {
    try {
      await api.post('/api/groups/join', { groupId });
      navigate(`/dashboard/groups/${groupId}`);
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fffbfe] text-slate-800 overflow-y-auto w-full relative">
      {/* HEADER */}
      <header className="sticky top-0 bg-[#fffbfe]/90 backdrop-blur-md px-5 py-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full border border-purple-100 overflow-hidden shadow-sm bg-white">
            <SafeImage 
              src={user?.profile_picture} 
              fallback={`https://ui-avatars.com/api/?name=${user?.name}&background=ebd8ff&color=41198f`} 
              className="w-full h-full object-cover" 
            />
          </div>
          <h1 className="text-xl font-bold italic text-[#3b1784] font-serif">
            Campus Curator
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard/notifications')} 
            aria-label="Notifications"
            title="Notifications"
            className="relative text-[#3b1784] hover:bg-purple-100 p-2 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 pb-28 pt-2 max-w-xl mx-auto w-full">
        
        {/* SEARCH BAR */}
        <div className="mb-6">
          <div className="relative flex items-center bg-[#f3e8ff] rounded-[2rem] px-5 py-3 shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-[#c084fc]">
            <Search className="w-5 h-5 text-[#c084fc] mr-3" />
            <input 
              type="text" 
              placeholder="Search for events, clubs, or discuss"
              className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-[#7c3aed] placeholder:text-[#d8b4fe]"
            />
          </div>
        </div>

        {/* TAGS SCROLL */}
        <div className="flex overflow-x-auto gap-3 no-scrollbar pb-1 mb-8">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={clsx(
                "px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-colors",
                activeTag === tag 
                  ? "bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/20" 
                  : "bg-white text-slate-400 border border-slate-100 hover:border-purple-200 hover:text-purple-500"
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* LIVE BUZZ - Trending Topics */}
        <section className="mb-10">
          <div className="mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#a78bfa]">Live Buzz</span>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#331c61] tracking-tight mt-1">Trending Topics</h2>
              <button className="text-xs font-bold text-[#6d28d9] hover:underline">View All</button>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)
            ) : popularConfessions.length > 0 ? (
              <>
                {/* Hot Debate Card */}
                {popularConfessions[0] && (
                  <div className="bg-white rounded-[2rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-purple-50/50 cursor-pointer hover:border-purple-200 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-[#dcfce7] text-[#166534] text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                        HOT DEBATE
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">1.2k students joined</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#331c61] leading-snug mb-4">
                      {popularConfessions[0].text.length > 80 ? popularConfessions[0].text.substring(0, 80) + '...' : popularConfessions[0].text}
                    </h3>
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        <img src={`https://ui-avatars.com/api/?name=A&background=fce7f3&color=db2777`} className="w-6 h-6 rounded-full border-[1.5px] border-white" alt="user" />
                        <img src={`https://ui-avatars.com/api/?name=B&background=e0f2fe&color=0284c7`} className="w-6 h-6 rounded-full border-[1.5px] border-white" alt="user" />
                      </div>
                      <span className="ml-2 bg-[#e9d5ff] text-[#7e22ce] text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        +{popularConfessions[0].likesCount || 65}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Secondary Cards */}
                {popularConfessions[1] && (
                  <div className="bg-[#fdf4ff] rounded-[1.5rem] p-5 cursor-pointer hover:bg-[#fae8ff] transition-colors flex flex-col justify-between min-h-[110px]">
                    <h4 className="font-bold text-[#4c1d95] text-sm leading-tight mb-4">
                      {popularConfessions[1].text}
                    </h4>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[#9333ea] text-[11px] font-bold">#Giveaway</span>
                      <TrendingUp className="w-4 h-4 text-[#9333ea]" />
                    </div>
                  </div>
                )}
                
                {popularConfessions[2] && (
                  <div className="bg-[#f3e8ff] rounded-[1.5rem] p-5 cursor-pointer hover:bg-[#e9d5ff] transition-colors flex flex-col justify-between min-h-[110px]">
                    <h4 className="font-bold text-[#4c1d95] text-sm leading-tight mb-4">
                      {popularConfessions[2].text}
                    </h4>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[#7e22ce] text-[11px] font-bold">#LostAndFound</span>
                      <span className="text-[#a855f7] text-[10px] font-medium">2h ago</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm">No trending topics right now.</div>
            )}
          </div>
        </section>

        {/* STUDENT CLUBS - Join Your Tribe */}
        <section className="mb-10">
          <div className="mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#a78bfa]">Student Clubs</span>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#331c61] tracking-tight mt-1">Join Your Tribe</h2>
              <button onClick={() => navigate('/dashboard/groups')} className="bg-[#f3e8ff] text-[#7e22ce] px-3 py-1.5 rounded-xl text-[10px] font-bold hover:bg-[#e9d5ff]">
                See<br/>Categories
              </button>
            </div>
          </div>

          {loading ? (
             <Skeleton className="h-72 rounded-[2.5rem]" />
          ) : featuredGroup ? (
            <div onClick={() => navigate(`/dashboard/groups/${featuredGroup._id}`)} className="bg-white rounded-[2.5rem] shadow-[0_4px_25px_rgba(0,0,0,0.04)] overflow-hidden cursor-pointer group">
              {/* Top Image Portion */}
              <div className="h-44 bg-gradient-to-tr from-[#c2410c] to-[#f97316] relative overflow-hidden flex items-center justify-center">
                 <div className="absolute top-4 left-4 z-10">
                   <span className="bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/30">
                     Music & Arts
                   </span>
                 </div>
                 {/* Visual placeholder for mockup hearts image */}
                 {featuredGroup.avatar_url ? (
                   <img src={featuredGroup.avatar_url} className="w-full h-full object-cover opacity-80 mix-blend-overlay group-hover:scale-105 transition-transform duration-500" alt="Club Hero" />
                 ) : (
                   <span className="text-6xl group-hover:scale-110 transition-transform duration-500 text-white/50">{featuredGroup.group_name[0]}</span>
                 )}
              </div>
              {/* Bottom Info Portion */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#331c61] mb-2">{featuredGroup.group_name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-6">
                  {featuredGroup.description || 'The premier home for aspiring producers, DJs, and audiophiles on campus. Join weekly mix sessions.'}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img src={`https://ui-avatars.com/api/?name=J&background=ffedd5&color=ea580c`} className="w-8 h-8 rounded-full border-2 border-white" alt="User" />
                    <span className="w-8 h-8 rounded-full bg-[#d8b4fe] flex items-center justify-center text-[9px] font-bold text-[#581c87] border-2 border-white -ml-2">
                       +800
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 ml-2">Active Tribe</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); joinGroup(featuredGroup._id); }}
                    className="bg-[#7c3aed] text-white px-7 py-2.5 rounded-2xl text-xs font-bold hover:bg-[#6d28d9] transition-colors"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm">No recommended clubs found.</div>
          )}
        </section>

        {/* DON'T MISS - Campus Highlights */}
        <section>
          <div className="mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#a78bfa]">Don't Miss</span>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#331c61] tracking-tight mt-1">Campus Highlights</h2>
            </div>
          </div>

          <div className="space-y-4">
             {loading ? (
                [1, 2].map(i => <Skeleton key={i} className="h-28 rounded-3xl" />)
             ) : upcomingEvents.length > 0 ? (
                upcomingEvents.map((event, idx) => {
                  const evDate = new Date(event.dateTime);
                  // Alternating background colors like the mockup (white vs dark-blue gradient thumb)
                  const thumbColor = idx % 2 === 0 ? 'bg-[#1c1917]' : 'bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6]';
                  
                  return (
                    <div key={event._id} onClick={() => navigate('/dashboard/events')} className="bg-[#fffaff] rounded-[2rem] p-3 flex gap-4 cursor-pointer hover:bg-[#fae8ff] transition-colors border border-purple-50">
                      <div className={`w-24 h-24 rounded-[1.5rem] flex-shrink-0 ${thumbColor} overflow-hidden shadow-inner flex items-center justify-center`}>
                        {/* Dummy representation of thumbnail images in mockup */}
                        <span className="text-2xl opacity-50">{idx % 2 === 0 ? '🌸' : ''}</span>
                      </div>
                      
                      <div className="flex flex-col py-1 mr-2 justify-center">
                         <div className="flex items-center mb-1.5">
                           <span className="bg-[#d8b4fe] text-[#4c1d95] text-[9px] font-black uppercase px-2 py-0.5 rounded-md mr-2 tracking-wider">
                             {evDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                           </span>
                           <span className="text-[9px] font-bold text-slate-400">
                             • {evDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                         </div>
                         <h4 className="font-bold text-[#331c61] text-sm leading-snug mb-2 line-clamp-2">
                           {event.title}
                         </h4>
                         <div className="flex items-center text-[10px] font-medium text-slate-400">
                           <MapPin className="w-3 h-3 mr-1" />
                           <span className="truncate">{event.location}</span>
                         </div>
                      </div>
                    </div>
                  );
                })
             ) : (
                <div className="py-8 text-center text-slate-400 text-sm">No campus highlights scheduled.</div>
             )}
          </div>
        </section>

        <div className="h-10"></div>
      </main>

      {/* FIXED FILTER FAB */}
      <button 
        aria-label="Filter" 
        className="fixed bottom-[100px] right-6 w-14 h-14 bg-[#7c3aed] rounded-full shadow-lg shadow-[#7c3aed]/40 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all z-40"
      >
        <SlidersHorizontal className="w-6 h-6" />
      </button>

    </div>
  );
};

export default DiscoverPage;
