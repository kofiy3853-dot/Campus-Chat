import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Filter, TrendingUp, Clock, Search, ChevronLeft } from 'lucide-react';
import api from '../services/api';
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
      const { data } = await api.get(`/api/events?sort=${sort}${categoryParam}`);
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
    <div className="flex-1 overflow-y-auto bg-white custom-scrollbar transition-none">
      <div className="max-w-7xl mx-auto px-3 md:px-8 py-5 md:py-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 md:gap-6 mb-8 md:mb-12">
          <div className="space-y-2.5 md:space-y-3">
            <div className="flex items-center gap-2.5 md:gap-3">
              <button 
                onClick={() => window.history.back()}
                className="md:hidden p-1.5 -ml-1 text-gray-400 hover:text-sky-500 hover:bg-gray-50 rounded-xl transition-none"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-sky-50 flex items-center justify-center border border-sky-100 shrink-0">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-sky-500" />
              </div>
              <h1 className="text-xl md:text-3xl font-black text-gray-800 tracking-tight">Campus Events</h1>
            </div>
            <p className="text-gray-400 text-xs md:text-base max-w-md leading-relaxed">Discover what's happening around campus. Meet, learn, and have fun.</p>
          </div>

          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-4 bg-sky-400 hover:bg-sky-500 text-white text-xs md:text-base font-bold rounded-xl md:rounded-2xl shadow-sm transition-none whitespace-nowrap"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden xs:inline">Post New Event</span>
            <span className="xs:hidden">New Event</span>
          </button>
        </div>

        {/* Filters & Tools */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100 transition-none">
          
          {/* Search */}
          <div className="relative w-full sm:w-80 group transition-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-sky-400 transition-none" />
            <input 
              type="text" 
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl pl-11 pr-4 py-2.5 md:py-3 text-xs md:text-sm text-gray-700 outline-none focus:border-sky-400/50 focus:ring-4 focus:ring-sky-500/5 transition-none"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 transition-none">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={clsx(
                    "px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold whitespace-nowrap transition-none",
                    activeCategory === cat 
                      ? "bg-sky-400 text-white shadow-sm" 
                      : "bg-gray-50 text-gray-400 border border-gray-100 hover:text-sky-500 hover:border-sky-200"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-gray-100 hidden sm:block"></div>

            {/* Sort Toggle */}
            <div className="flex bg-gray-50 border border-gray-100 rounded-xl p-1 shrink-0 transition-none">
               <button 
                 onClick={() => setSort('upcoming')}
                 className={clsx("p-1.5 md:p-2 rounded-lg transition-none", sort === 'upcoming' ? "bg-white text-sky-500 shadow-sm" : "text-gray-400 hover:text-sky-500")}
                 title="Upcoming"
               >
                 <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
               </button>
               <button 
                 onClick={() => setSort('popular')}
                 className={clsx("p-1.5 md:p-2 rounded-lg transition-none", sort === 'popular' ? "bg-white text-sky-500 shadow-sm" : "text-gray-400 hover:text-sky-500")}
                 title="Popular"
               >
                 <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
               </button>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 transition-none">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 rounded-3xl bg-gray-50 border border-gray-100 transition-none"></div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredEvents.map((event: any) => (
              <EventCard key={event._id} event={event} onUpdate={handleUpdateEvent} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center transition-none">
            <div className="w-20 h-20 rounded-[2rem] bg-gray-50 flex items-center justify-center mb-6 border border-gray-100 shadow-sm">
              <Calendar className="w-8 h-8 text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No events found</h3>
            <p className="text-gray-400 max-w-xs">Try adjusting your filters or search to find what you're looking for.</p>
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
