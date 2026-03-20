import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bell,
  Bot,
  Users2,
  Calendar,
  ShoppingBag,
  MessageSquare,
  Megaphone,
  ChevronRight,
  Plus,
  Briefcase,
  Trophy,
  Award
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { clsx } from 'clsx';
import Skeleton from '../components/Skeleton';
import SafeImage from '../components/SafeImage';
import { useAuth } from '../context/AuthContext';
import AnnouncementHero from '../components/AnnouncementHero';

const ExplorerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trendingItems, setTrendingItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(''); // Added searchQuery state

  const fetchExploreData = async () => {
    try {
      setLoading(true);
      const [eventsRes] = await Promise.all([
        api.get('/api/events?sort=upcoming').catch(() => ({ data: [] }))
      ]);
      setTrendingItems((eventsRes.data || []).slice(0, 3));
    } catch (error) {
      console.error('Error fetching explore data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExploreData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard/discover?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const EXPLORE_CARDS = [
    { 
      id: 'study-groups',
      title: 'Study Groups', 
      desc: 'Find study partners', 
      icon: Users2, 
      color: 'text-blue-500', 
      bgColor: 'bg-white',
      iconBg: 'bg-blue-50',
      to: '/dashboard/study-groups'
    },
    { 
      id: 'events',
      title: 'Campus Events', 
      desc: "What's happening now", 
      icon: Calendar, 
      color: 'text-purple-500', 
      bgColor: 'bg-white',
      iconBg: 'bg-purple-50',
      to: '/dashboard/events'
    },
    { 
      id: 'marketplace',
      title: 'Marketplace', 
      desc: 'Buy & sell on campus', 
      icon: ShoppingBag, 
      color: 'text-teal-500', 
      bgColor: 'bg-white',
      iconBg: 'bg-teal-50',
      to: '/dashboard/marketplace'
    },
    { 
      id: 'confessions',
      title: 'Confessions', 
      desc: 'Share secrets anonymously', 
      icon: MessageSquare, 
      color: 'text-indigo-500', 
      bgColor: 'bg-white',
      iconBg: 'bg-indigo-50',
      to: '/dashboard/confessions',
      hasBorder: true // Representing the purple vertical bar in mockup
    },
    { 
      id: 'internships',
      title: 'Internships', 
      desc: 'Career opportunities', 
      icon: Briefcase, 
      color: 'text-orange-500', 
      bgColor: 'bg-white',
      iconBg: 'bg-orange-50',
      to: '/dashboard/internships'
    },
    { 
      id: 'clubs',
      title: 'Clubs', 
      desc: 'Join communities', 
      icon: Users2, 
      color: 'text-rose-500', 
      bgColor: 'bg-white',
      iconBg: 'bg-rose-50',
      to: '/dashboard/clubs'
    },
    { 
      id: 'leaderboard',
      title: 'Leaderboard', 
      desc: 'Top contributors', 
      icon: Trophy, 
      color: 'text-amber-500', 
      bgColor: 'bg-white',
      iconBg: 'bg-amber-50',
      to: '/dashboard/leaderboard'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 overflow-y-auto w-full relative">
      {/* HEADER */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 flex items-center justify-between z-40 border-b border-purple-50">
        <div className="flex items-center gap-3">
          <Link 
            to="/dashboard/profile"
            className="w-10 h-10 rounded-full border border-purple-100 overflow-hidden bg-white shadow-sm ring-2 ring-purple-50 transition-transform active:scale-95"
          >
            <SafeImage 
              src={user?.profile_picture} 
              fallback={`https://ui-avatars.com/api/?name=${user?.name}&background=f5eeff&color=6d28d9`} 
              className="w-full h-full object-cover" 
            />
          </Link>
          <h1 className="text-xl font-black text-[#4c1d95] tracking-tight">Vantage</h1>
        </div>
        <button 
          onClick={() => navigate('/dashboard/notifications')} 
          aria-label="Notifications"
          title="Notifications"
          className="text-[#6d28d9] p-2 hover:bg-purple-50 rounded-full transition-colors relative"
        >
           <Bell className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 px-6 pb-32 pt-2 max-w-xl mx-auto w-full">
        
        {/* TITLE SECTION */}
        <div className="mb-8 mt-4">
          <h2 className="text-3xl font-black text-[#4c1d95] leading-tight tracking-tight">Explore Campus</h2>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Everything you need</p>
        </div>

        {/* SEARCH BAR */}
        {/* Integrated Search Bar */}
        <form onSubmit={handleSearch} className="relative group mb-8">
          <div className="relative flex items-center bg-white border border-[#f5eeff] rounded-[2rem] px-6 py-4 shadow-sm group-focus-within:ring-8 ring-purple-500/5 group-focus-within:border-purple-200 transition-all duration-300">
            <Search className="w-5 h-5 mr-3 text-[#a78bfa]" />
            <input 
              type="text" 
              placeholder="search the entire campus..."
              className="flex-1 bg-transparent border-none outline-none text-sm font-black text-[#6d28d9] placeholder:text-slate-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* AUTOMATED ANNOUNCEMENT HERO */}
        <AnnouncementHero />

        {/* HERO CARD - AI ASSISTANT */}
        <div className="mb-6 bg-[#f5eeff] rounded-[2.5rem] p-8 relative overflow-hidden group border border-purple-100/50">
          <div className="relative z-10 max-w-[65%]">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-purple-50">
              <Bot className="w-7 h-7 text-[#6d28d9]" />
            </div>
            <h3 className="text-xl font-black text-[#4c1d95] mb-1">AI Study Assistant</h3>
            <p className="text-sm text-[#6d28d9] font-black uppercase tracking-widest text-[10px] mb-8">Your academic helper</p>
            <button 
              onClick={() => navigate('/dashboard/chat/ai')}
              className="bg-[#6d28d9] text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#5b21b6] transition-all shadow-xl shadow-purple-500/20 active:scale-95"
            >
              Start Learning
            </button>
          </div>
          {/* Mockup decorative elements */}
          <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-white/20 to-transparent pointer-events-none"></div>
          <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/30 rounded-full blur-3xl group-hover:bg-white/40 transition-colors"></div>
        </div>

        {/* GRID SECTION */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {EXPLORE_CARDS.map((card) => (
            <div 
              key={card.id}
              onClick={() => navigate(card.to)}
              className={clsx(
                "p-6 rounded-[2rem] cursor-pointer hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 relative border border-transparent hover:border-purple-100",
                card.bgColor,
                card.hasBorder && "border-l-4 border-l-[#7c3aed]"
              )}
            >
              <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm", card.iconBg)}>
                <card.icon className={clsx("w-6 h-6", card.id === 'confessions' ? 'text-[#6d28d9]' : card.color)} />
              </div>
              <h4 className="font-black text-[#4c1d95] mb-1 text-sm">{card.title}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* ANNOUNCEMENTS CARD */}
        <div 
          onClick={() => navigate('/dashboard/announcements')}
          className="bg-white rounded-[2.5rem] p-6 mb-12 flex items-center justify-between cursor-pointer hover:shadow-lg hover:border-purple-100 border border-transparent transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center shadow-sm">
              <Megaphone className="w-7 h-7 text-rose-500" />
            </div>
            <div>
              <h4 className="font-black text-[#4c1d95] text-base">Announcements</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Campus updates and news</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </div>

        {/* TRENDING NOW */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-[#4c1d95]">Trending Now</h3>
            <button onClick={() => navigate('/dashboard/discover')} className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6d28d9] hover:underline">See All</button>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2].map(i => <Skeleton key={i} className="h-44 rounded-[2.5rem]" />)
            ) : trendingItems.length > 0 ? (
              trendingItems.map((item) => (
                <div 
                  key={item._id} 
                  className="bg-white rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:border-purple-100 border border-transparent transition-all relative overflow-hidden group"
                >
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-[#6d28d9] rounded-r-full group-hover:h-20 transition-all"></div>
                  <div className="relative z-10">
                    <h4 className="text-lg font-black text-[#4c1d95] mb-4">{item.title}</h4>
                    <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed mb-6">
                      {item.description || "Join us this Friday for the latest campus showcase. Limited seats available!"}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#dcfce7] text-[#166534] text-[9px] font-black uppercase tracking-[0.1em] px-3 py-1 rounded-md">
                          Event
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">2 hours ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm">No trending updates found.</div>
            )}
          </div>
        </section>
      </main>

      {/* FAB */}
      {/* Floating Action Hint */}
      <Link 
        to="/dashboard/announcements?compose=true"
        className="fixed bottom-[100px] right-6 w-14 h-14 bg-[#6d28d9] rounded-full shadow-lg shadow-purple-500/40 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all z-40"
        aria-label="Create New"
        title="Create New"
      >
        <Plus className="w-7 h-7" />
      </Link>

    </div>
  );
};

export default ExplorerPage;
