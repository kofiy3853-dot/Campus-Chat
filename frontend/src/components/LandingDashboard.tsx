import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Megaphone, 
  Ghost, 
  Calendar, 
  Search, 
  Bell, 
  MessageSquare, 
  Users, 
  Package,
  Heart,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUnread } from '../context/UnreadContext';
import api from '../services/api';
import { getMediaUrl } from '../utils/imageUrl';
import Skeleton from './Skeleton';
import SafeImage from './SafeImage';

const LandingDashboard: React.FC = () => {
  const { user } = useAuth();
  const { unread } = useUnread();
  const navigate = useNavigate();
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [trendingConfessions, setTrendingConfessions] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [chatsRes, groupsRes, confessionsRes, eventsRes, marketRes, announcementsRes] = await Promise.all([
          api.get('/api/chat/conversations').catch(() => ({ data: [] })),
          api.get('/api/groups').catch(() => ({ data: [] })),
          api.get('/api/confessions?page=1&sort=top').catch(() => ({ data: { confessions: [] } })),
          api.get('/api/events?sort=upcoming').catch(() => ({ data: [] })),
          api.get('/api/marketplace').catch(() => ({ data: [] })),
          api.get('/api/announcements').catch(() => ({ data: [] }))
        ]);
        setRecentChats((chatsRes.data || []).slice(0, 5));
        setGroups((groupsRes.data || []).slice(0, 5));
        setTrendingConfessions((confessionsRes.data?.confessions || []).slice(0, 3));
        setUpcomingEvents((eventsRes.data || []).slice(0, 3));
        setMarketplaceItems((marketRes.data || []).slice(0, 4));
        setAnnouncements((announcementsRes.data || []).slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const heroAnnouncement = announcements.length > 0 ? announcements[0] : null;

  return (
    <div className="flex flex-col h-full bg-[#fcfbfe] text-slate-800 overflow-y-auto w-full">
      {/* HEADER */}
      <header className="sticky top-0 bg-[#fcfbfe]/90 backdrop-blur-md px-5 py-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <Link to="/dashboard/profile" className="w-10 h-10 rounded-full border border-purple-100 overflow-hidden shadow-sm bg-white">
            <SafeImage 
              src={getMediaUrl(user?.profile_picture)} 
              fallback={`https://ui-avatars.com/api/?name=${user?.name}&background=ebd8ff&color=41198f`} 
              className="w-full h-full object-cover" 
            />
          </Link>
          <Link to="/dashboard" className="group/title inline-block">
            <h1 className="text-xl font-bold italic text-[#3b1784] font-serif">
              Campus Curator
            </h1>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button aria-label="Search" onClick={() => navigate('/dashboard/discover')} className="text-[#3b1784] hover:bg-purple-100 p-2 rounded-full transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button aria-label="Notifications" onClick={() => navigate('/dashboard/notifications')} className="relative text-[#3b1784] hover:bg-purple-100 p-2 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 pb-28 pt-2 space-y-8 max-w-xl mx-auto w-full">
        
        {/* HERO ANNOUNCEMENT (Mockup Banner) */}
        <section onClick={() => navigate('/dashboard/announcements')} className="cursor-pointer relative overflow-hidden bg-gradient-to-br from-[#6b35b6] to-[#452085] rounded-[2rem] p-6 text-white shadow-xl shadow-[#452085]/20 group hover:scale-[1.01] transition-transform">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-10 -mt-20"></div>
          <div className="relative z-10 flex flex-col min-h-[140px] justify-between">
            <div className="self-start">
              <span className="bg-[#cdfa87] text-[#3b1784] text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-sm">
                Announcement
              </span>
            </div>
            <h2 className="text-2xl font-bold leading-tight mt-6 pr-4">
              {heroAnnouncement ? heroAnnouncement.title : "Spring Semester Cultural Fest 2024: Registrations Open!"}
            </h2>
          </div>
        </section>

        {/* QUICK ACTION GRID */}
        <section className="grid grid-cols-2 gap-4">
          <button aria-label="Confessions" onClick={() => navigate('/dashboard/confessions')} className="bg-white rounded-[2rem] p-4 flex flex-col items-center justify-center gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-purple-50 hover:border-purple-200 transition-colors">
            <div className="bg-[#debfff] text-[#5527a2] p-4 rounded-3xl">
              <Ghost className="w-6 h-6" />
            </div>
            <span className="font-bold text-[#3b1784] text-sm">Confession</span>
          </button>
          
          <button aria-label="Events" onClick={() => navigate('/dashboard/events')} className="bg-white rounded-[2rem] p-4 flex flex-col items-center justify-center gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-purple-50 hover:border-purple-200 transition-colors">
            <div className="bg-[#b7ffc6] text-[#0f5b24] p-4 rounded-3xl">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="font-bold text-[#3b1784] text-sm">Event</span>
          </button>

          <button aria-label="Notices" onClick={() => navigate('/dashboard/announcements')} className="bg-white rounded-[2rem] p-4 flex flex-col items-center justify-center gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-purple-50 hover:border-purple-200 transition-colors">
            <div className="bg-[#99fc6d] text-[#2d6e15] p-4 rounded-3xl">
              <Megaphone className="w-6 h-6" />
            </div>
            <span className="font-bold text-[#3b1784] text-sm">Notice</span>
          </button>

          <button aria-label="Lost & Found" onClick={() => navigate('/dashboard/lost-found')} className="bg-white rounded-[2rem] p-4 flex flex-col items-center justify-center gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-purple-50 hover:border-purple-200 transition-colors">
            <div className="bg-[#ffcdd7] text-[#a41a33] p-4 rounded-3xl">
              <Package className="w-6 h-6 flex-shrink-0" />
            </div>
            <span className="font-bold text-[#3b1784] text-sm text-center">Lost & Found</span>
          </button>
        </section>

        {/* MARKETPLACE DEALS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[#3d1583] tracking-tight">Marketplace Deals</h3>
            <button onClick={() => navigate('/dashboard/marketplace')} className="text-[#8444e2] text-xs font-bold hover:underline">
              See All
            </button>
          </div>
          
          <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2 -mx-5 px-5">
            {loading ? (
              [1, 2].map((i) => <Skeleton key={i} className="min-w-[170px] h-52 rounded-[2rem]" />)
            ) : marketplaceItems.length > 0 ? (
              marketplaceItems.map((item) => (
                <button key={item._id} onClick={() => navigate('/dashboard/marketplace')} className="min-w-[170px] max-w-[170px] bg-white rounded-[2rem] p-2 flex flex-col shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-purple-50 text-left snap-center hover:scale-[1.02] transition-transform">
                  <div className="w-full h-[150px] rounded-[1.5rem] bg-[#f9dbb9] overflow-hidden mb-3">
                    <SafeImage src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="px-2 pb-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-bold text-sm text-[#3b1784] truncate">{item.title}</h4>
                      <span className="text-sm font-black text-[#7c3aed]">₵{item.price}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                      {item.description || "Perfect condition."}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="w-full py-8 text-center bg-white rounded-[2rem] border border-purple-50">
                <Package className="w-8 h-8 text-purple-200 mx-auto mb-2" />
                <p className="text-sm text-purple-400 font-medium tracking-tight">No deals available</p>
              </div>
            )}
          </div>
        </section>

        {/* TRENDING CONFESSIONS */}
        <section>
          <h3 className="text-xl font-bold text-[#3d1583] tracking-tight mb-4">Trending Confessions</h3>
          <div className="space-y-4">
            {loading ? (
              [1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-[2rem]" />)
            ) : trendingConfessions.length > 0 ? (
              trendingConfessions.map((c) => (
                <div key={c._id} onClick={() => navigate('/dashboard/confessions')} className="bg-[#faf5ff] rounded-[2rem] p-6 relative cursor-pointer group hover:bg-[#f6efff] transition-colors border border-purple-50/50">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="font-bold text-slate-400 tracking-wider">#{c._id.substring(18).toUpperCase()} • CAMPUS</span>
                    <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-red-400 transition-colors">
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      <span className="font-bold text-[10px]">{c.likesCount || 0}</span>
                    </div>
                  </div>
                  <p className="text-[#4b336e] font-medium leading-relaxed">
                    {c.text}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-purple-400 font-medium">No trending confessions.</p>
              </div>
            )}
          </div>
        </section>

        {/* UPCOMING EVENTS */}
        <section>
          <h3 className="text-xl font-bold text-[#3d1583] tracking-tight mb-4">Upcoming Events</h3>
          <div className="space-y-4">
            {loading ? (
              [1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-[2rem]" />)
            ) : upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => {
                const evDate = new Date(event.dateTime);
                return (
                  <div key={event._id} onClick={() => navigate('/dashboard/events')} className="bg-white rounded-[2rem] p-3 flex items-center gap-4 cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-purple-50 hover:border-purple-200 transition-colors">
                    <div className="bg-[#dcfce7] min-w-[64px] h-[64px] rounded-[1.2rem] flex flex-col items-center justify-center text-[#166534]">
                      <span className="text-[10px] font-black uppercase tracking-widest">{evDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-xl font-black leading-none">{evDate.getDate()}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-[#3b1784] text-sm mb-1">{event.title}</h4>
                      <p className="text-[11px] font-medium text-slate-400">
                        {event.location} • {evDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-purple-400 font-medium">No upcoming events.</p>
              </div>
            )}
          </div>
        </section>

        {/* POPULAR GROUPS */}
        <section>
          <h3 className="text-xl font-bold text-[#3d1583] tracking-tight mb-4">Popular Groups</h3>
          <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2 -mx-5 px-5">
            {loading ? (
              [1, 2].map((i) => <Skeleton key={i} className="min-w-[140px] h-40 rounded-[2rem]" />)
            ) : groups.length > 0 ? (
              groups.map((group) => (
                <div key={group._id} onClick={() => navigate(`/dashboard/groups/${group._id}`)} className="bg-white min-w-[140px] max-w-[140px] rounded-[2rem] p-5 flex flex-col items-center text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-purple-50 snap-center cursor-pointer hover:border-purple-200 transition-colors">
                  <div className="w-14 h-14 bg-[#112f38] rounded-full mb-3 flex items-center justify-center text-white font-bold overflow-hidden shadow-sm">
                    {group.avatar_url ? (
                      <SafeImage src={group.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (group.group_name[0])}
                  </div>
                  <h4 className="font-bold text-[#3b1784] text-sm truncate w-full mb-1">{group.group_name}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">{group.members?.length || 0} Members</p>
                  <button className="w-full py-2 bg-[#8444e2] hover:bg-[#6c36be] text-white rounded-xl text-xs font-bold transition-colors">
                    Join
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 w-full">
                <p className="text-sm text-purple-400 font-medium">No popular groups yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* RECENT CHATS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[#3d1583] tracking-tight">Recent Chats</h3>
          </div>
          <div className="bg-white rounded-[2rem] p-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-purple-50">
            {loading ? (
              [1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl mb-2" />)
            ) : recentChats.length > 0 ? (
              <div className="divide-y divide-purple-50">
                {recentChats.map((chat) => {
                  const otherUser = chat.participants.find((p: any) => p._id !== user?._id);
                  const timeStr = chat.last_message_time 
                    ? new Date(chat.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : '';
                  return (
                    <button key={chat._id} onClick={() => navigate(`/dashboard/chat/${chat._id}`)} className="w-full flex items-center gap-4 py-3 px-2 hover:bg-[#faf5ff] rounded-2xl transition-colors">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                        <SafeImage 
                          src={getMediaUrl(otherUser?.profile_picture)} 
                          fallback={`https://ui-avatars.com/api/?name=${otherUser?.name}&background=cbd5e1`} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="font-bold text-[#3b1784] text-sm truncate pr-2">{otherUser?.name || 'Unknown'}</h4>
                          <span className="text-[9px] font-bold text-slate-400 shrink-0">{timeStr}</span>
                        </div>
                        <p className="text-[11px] text-[#8444e2] font-medium truncate">
                          {chat.last_message?.message_text || "Sent a photo"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-purple-400 font-medium">No recent chats.</p>
              </div>
            )}
          </div>
        </section>
        
        {/* Floating Action Buffer to avoid blocking last section behind Nav bar */}
        <div className="h-4"></div>
      </main>
    </div>
  );
};

export default LandingDashboard;
