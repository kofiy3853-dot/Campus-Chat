import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Megaphone, 
  Ghost, 
  Calendar, 
  Search, 
  Bell, 
  User, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Users, 
  Home,
  Package,
  ChevronRight,
  TrendingUp,
  Clock,
  MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUnread } from '../context/UnreadContext';
import api from '../services/api';
import { getMediaUrl } from '../utils/imageUrl';
import { clsx } from 'clsx';
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [chatsRes, groupsRes, confessionsRes, eventsRes, marketRes, announcementsRes] = await Promise.all([
          api.get('/api/chat/conversations'),
          api.get('/api/groups'),
          api.get('/api/confessions?page=1&sort=top'),
          api.get('/api/events?sort=upcoming'),
          api.get('/api/marketplace'),
          api.get('/api/announcements')
        ]);
        setRecentChats((chatsRes.data || []).slice(0, 5));
        setGroups((groupsRes.data || []).slice(0, 5));
        setTrendingConfessions((confessionsRes.data.confessions || []).slice(0, 3));
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

  const quickActions = [
    { 
      id: 'post-confession', 
      title: 'Confession', 
      icon: Ghost, 
      color: 'bg-purple-50 text-purple-600 border-purple-100',
      action: () => navigate('/dashboard/confessions?compose=true') 
    },
    { 
      id: 'create-event', 
      title: 'Event', 
      icon: Calendar, 
      color: 'bg-sky-50 text-sky-600 border-sky-100',
      action: () => navigate('/dashboard/events?compose=true') 
    },
    { 
      id: 'post-announcement', 
      title: 'Announcement', 
      icon: Megaphone, 
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      action: () => navigate('/dashboard/announcements?compose=true') 
    },
    { 
      id: 'report-lost', 
      title: 'Lost and Found', 
      icon: Package, 
      color: 'bg-orange-50 text-orange-600 border-orange-100',
      action: () => navigate('/dashboard/lost-found') 
    },
  ];

  const isNew = (date: string) => {
    if (!date) return false;
    const now = new Date();
    const created = new Date(date);
    const diff = now.getTime() - created.getTime();
    return diff < 48 * 60 * 60 * 1000; // Updated in last 48 hours for visibility
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] text-[#1E293B] overflow-y-auto scrollbar-hide">
      {/* Top Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-slate-100 px-6 py-4 flex items-center justify-between z-40">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Campus-Networking</span>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            Welcome back, <span className="text-sky-500">{user?.name}</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            title="Notifications" 
            onClick={() => navigate('/dashboard/notifications')}
            className="p-2.5 bg-slate-50 text-slate-400 hover:text-sky-500 rounded-2xl relative border border-slate-100 transition-all hover:scale-105 active:scale-95"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>
          <button title="Profile" onClick={() => navigate('/dashboard/profile')} className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-slate-50 shadow-sm transition-all hover:scale-105 active:scale-95">
            <img src={getMediaUrl(user?.profile_picture) || `https://ui-avatars.com/api/?name=${user?.name}&background=0EA5E9&color=fff`} alt="Profile" className="w-full h-full object-cover" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-6 space-y-8 max-w-2xl mx-auto w-full">
        
        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-0 bg-sky-500/5 blur-xl group-focus-within:blur-2xl transition-all rounded-3xl opacity-0 group-focus-within:opacity-100"></div>
          <div className="relative flex items-center bg-white border border-slate-100 rounded-[2rem] px-5 py-4 shadow-sm group-focus-within:border-sky-200 transition-all duration-300">
            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search students, groups, confessions, or events"
              className="flex-1 bg-transparent border-none outline-none px-3 text-sm font-medium text-slate-700 placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Live Campus Feed Cards */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                <Megaphone className="w-4 h-4 text-amber-500" />
              </div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Campus Announcements</h2>
            </div>
            <button onClick={() => navigate('/dashboard/announcements')} className="text-amber-600 text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
              Live Feed <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2">
            {loading ? (
              [1, 2].map((i) => <Skeleton key={i} className="min-w-[280px] h-40 rounded-3xl shrink-0" />)
            ) : announcements.length > 0 ? (
              announcements.map((ann) => (
                <div key={ann._id} onClick={() => navigate('/dashboard/announcements')} className="min-w-[280px] p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-amber-200 transition-all cursor-pointer shrink-0 relative overflow-hidden group">
                  {ann.pinned && (
                    <div className="absolute top-3 right-3 w-2 h-2 bg-amber-500 rounded-full"></div>
                  )}
                  {isNew(ann.createdAt) && (
                    <div className="absolute top-3 right-3 bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                      UPDATED
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-100">
                      <img src={getMediaUrl(ann.posted_by?.profile_picture) || `https://ui-avatars.com/api/?name=${ann.posted_by?.name}`} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{ann.posted_by?.name}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mb-2 line-clamp-2 uppercase tracking-tight">{ann.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 font-medium">{ann.content}</p>
                </div>
              ))
            ) : (
              <div className="w-full p-8 text-center bg-white border border-slate-100 rounded-3xl">
                <Megaphone className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No recent announcements</p>
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions Grid */}
        <section>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <button 
                key={action.id} 
                onClick={action.action}
                className={clsx(
                  "flex flex-col items-center justify-center p-5 rounded-3xl border text-center transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                  action.color
                )}
              >
                <div className="p-3 rounded-2xl bg-white shadow-sm mb-3">
                  <action.icon className="w-6 h-6" />
                </div>
                <span className="font-bold text-[xs] tracking-tight">{action.title}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Campus Marketplace */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center border border-green-100">
                <Package className="w-4 h-4 text-green-500" />
              </div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Marketplace Deals</h2>
            </div>
            <button onClick={() => navigate('/dashboard/marketplace')} className="text-green-600 text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
              Shop Now <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {loading ? (
              [1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-3xl" />)
            ) : marketplaceItems.length > 0 ? (
              marketplaceItems.map((item) => (
                <div key={item._id} onClick={() => navigate('/dashboard/marketplace')} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:border-green-200 transition-all cursor-pointer group relative">
                  <div className="aspect-square relative overflow-hidden bg-slate-100">
                    <SafeImage src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-black text-slate-800 shadow-sm leading-none">
                      ₵{item.price}
                    </div>
                    {isNew(item.createdAt) && (
                      <div className="absolute bottom-2 left-2 bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm">
                        UPDATED
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-xs text-slate-800 truncate">{item.title}</h4>
                    <p className="text-[10px] text-slate-400 font-medium truncate capitalize">{item.category}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-8 text-center bg-white border border-slate-100 rounded-3xl">
                <Package className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No items available yet</p>
              </div>
            )}
          </div>
        </section>

        {/* Trending Confessions */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
                <Ghost className="w-4 h-4 text-purple-500" />
              </div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Trending Confessions</h2>
            </div>
            <button onClick={() => navigate('/dashboard/confessions')} className="text-purple-600 text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
              See All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              [1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-3xl" />)
            ) : trendingConfessions.length > 0 ? (
              trendingConfessions.map((c) => (
                <div key={c._id} onClick={() => navigate('/dashboard/confessions')} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-purple-200 transition-all cursor-pointer relative overflow-hidden">
                  {isNew(c.createdAt) && (
                    <div className="absolute top-3 right-3 bg-purple-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm">
                      UPDATED
                    </div>
                  )}
                  <p className="text-sm text-slate-600 leading-relaxed font-medium mb-3 line-clamp-2 italic">“{c.text}”</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                      <TrendingUp className="w-3 h-3" /> {c.likesCount || 0} Likes
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                      <MessageSquare className="w-3 h-3" /> {c.commentsCount || 0} Comments
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-white border border-slate-100 rounded-3xl">
                <Ghost className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No trending confessions yet</p>
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Events */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center border border-sky-100">
                <Calendar className="w-4 h-4 text-sky-500" />
              </div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Upcoming Events</h2>
            </div>
            <button onClick={() => navigate('/dashboard/events')} className="text-sky-600 text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
              See All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2">
            {loading ? (
              [1, 2].map((i) => <Skeleton key={i} className="min-w-[240px] h-32 rounded-3xl shrink-0" />)
            ) : upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div key={event._id} onClick={() => navigate('/dashboard/events')} className="min-w-[260px] p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-sky-200 transition-all cursor-pointer shrink-0 relative overflow-hidden">
                  {isNew(event.createdAt) && (
                    <div className="absolute top-3 right-3 bg-sky-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm">
                      UPDATED
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-500 bg-sky-50 px-2.5 py-1 rounded-full">
                      {event.category || 'General'}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <Users className="w-3 h-3" /> {event.attendeesCount || 0}
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2 truncate">{event.title}</h4>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(event.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {event.location}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full p-8 text-center bg-white border border-slate-100 rounded-3xl">
                <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No upcoming events</p>
              </div>
            )}
          </div>
        </section>

        {/* Popular Groups */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
                <Users className="w-4 h-4 text-orange-500" />
              </div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Popular Groups</h2>
            </div>
            <button onClick={() => navigate('/dashboard/groups')} className="text-orange-600 text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
              See All Groups <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {loading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)
            ) : groups.length > 0 ? (
              groups.slice(0, 5).map((group) => (
                <div key={group._id} onClick={() => navigate(`/dashboard/groups/${group._id}`)} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-3xl hover:border-orange-200 transition-all cursor-pointer shadow-sm group">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-lg group-hover:scale-110 transition-transform">
                    {group.group_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-800 truncate">{group.group_name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{group.members?.length || 0} Members</p>
                  </div>
                  <button className="flex items-center gap-1 px-4 py-2 bg-orange-50 border border-orange-100 rounded-2xl text-[10px] font-black text-orange-600 hover:bg-orange-600 hover:text-white transition-all uppercase tracking-wider">
                    Join
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-white border border-slate-100 rounded-3xl">
                <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No popular groups available</p>
              </div>
            )}
          </div>
        </section>

        {/* Recent Chats */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center border border-sky-100">
                <MessageSquare className="w-4 h-4 text-sky-500" />
              </div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Recent Chats</h2>
            </div>
            <button onClick={() => navigate('/dashboard/chats')} className="text-sky-600 text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
              Messages <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-3xl" />)
            ) : recentChats.length > 0 ? (
              recentChats.map((chat) => {
                const otherUser = chat.participants.find((p: any) => p._id !== user?._id);
                return (
                  <button 
                    key={chat._id} 
                    onClick={() => navigate(`/dashboard/chat/${chat._id}`)}
                    className="w-full flex items-center gap-4 p-4 bg-white border border-slate-50 rounded-3xl transition-all hover:shadow-md group shadow-sm"
                  >
                    <div className="relative">
                      <img 
                        src={getMediaUrl(otherUser?.profile_picture) || `https://ui-avatars.com/api/?name=${otherUser?.name}&background=0EA5E9&color=fff`} 
                        alt={otherUser?.name} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-slate-50 ring-4 ring-transparent group-hover:ring-sky-50 transition-all"
                      />
                      {otherUser?.status === 'online' && (
                        <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="font-black text-slate-800 text-sm truncate">{otherUser?.name}</h4>
                        <span className="text-[10px] font-bold text-slate-400">{chat.last_message_time ? new Date(chat.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-slate-500 truncate font-medium">{chat.last_message?.message_text || 'Start conversation'}</p>
                        {chat.unread_count > 0 && (
                          <span className="bg-sky-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-sky-200">
                            {chat.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[2rem]">
                <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No active chats</p>
                <p className="text-[10px] text-slate-300 mt-1">Start chatting with your fellow students!</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingDashboard;
