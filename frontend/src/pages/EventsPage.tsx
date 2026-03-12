import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Filter, TrendingUp, Clock, Search } from 'lucide-react';
import axios from 'axios';
import { clsx } from 'clsx';
import EventCard from '../components/EventCard';
import EventCompose from '../components/EventCompose';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Academic', 'Social', 'Sports', 'Clubs', 'Career'];

const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [sort, setSort] = useState<'upcoming' | 'popular'>('upcoming');
  const [search, setSearch] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const categoryParam = activeCategory !== 'All' ? `&category=${activeCategory}` : '';
      const { data } = await axios.get(`/api/events?sort=${sort}${categoryParam}`);
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [activeCategory, sort]);

  const handleUpdateEvent = (updatedEvent: any) => {
    setEvents(events.map((e: any) => e._id === updatedEvent._id ? updatedEvent : e));
  };

  const handleCreated = (newEvent: any) => {
    // Add organizer info locally if missing (server returns populated in GET but maybe not in POST)
    const eventWithOrganizer = {
       ...newEvent,
       organizerId: { _id: user?._id, name: user?.name, profile_picture: user?.profile_picture }
    };
    setEvents([eventWithOrganizer, ...events]);
  };

  const filteredEvents = events.filter((e: any) => 
    e.title.toLowerCase().includes(search.toLowerCase()) || 
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    e.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0F1D] custom-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 md:py-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-600/10 flex items-center justify-center border border-primary-600/20">
                <Calendar className="w-6 h-6 text-primary-500" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">Campus Events</h1>
            </div>
            <p className="text-slate-400 max-w-md">Discover what's happening around campus. Meet new people, learn new skills, and have fun.</p>
          </div>

          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl shadow-xl shadow-primary-900/40 transition-all hover:-translate-y-1 active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Post New Event
          </button>
        </div>

        {/* Filters & Tools */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-800/50">
          
          {/* Search */}
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-300 outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/5 transition-all"
            />
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={clsx(
                    "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                    activeCategory === cat 
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-900/20" 
                      : "bg-slate-900/50 text-slate-500 border border-slate-800 hover:text-slate-300 hover:border-slate-700"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

            {/* Sort Toggle */}
            <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 shrink-0">
               <button 
                 onClick={() => setSort('upcoming')}
                 className={clsx("p-2 rounded-lg transition-all", sort === 'upcoming' ? "bg-slate-800 text-primary-400 shadow-sm" : "text-slate-600 hover:text-slate-400")}
                 title="Upcoming"
               >
                 <Clock className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => setSort('popular')}
                 className={clsx("p-2 rounded-lg transition-all", sort === 'popular' ? "bg-slate-800 text-primary-400 shadow-sm" : "text-slate-600 hover:text-slate-400")}
                 title="Popular"
               >
                 <TrendingUp className="w-4 h-4" />
               </button>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 rounded-3xl bg-slate-900/20 animate-pulse border border-slate-800/50"></div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event: any) => (
              <EventCard key={event._id} event={event} onUpdate={handleUpdateEvent} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-[2rem] bg-slate-900 flex items-center justify-center mb-6 border border-slate-800 shadow-xl">
              <Calendar className="w-8 h-8 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No events found</h3>
            <p className="text-slate-500 max-w-xs">Try adjusting your filters or search to find what you're looking for.</p>
          </div>
        )}
      </div>

      {showCompose && (
        <EventCompose 
          onClose={() => setShowCompose(false)} 
          onCreated={handleCreated} 
        />
      )}
    </div>
  );
};

export default EventsPage;
