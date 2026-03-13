import React, { useState } from 'react';
import { MapPin, Calendar, Users, CheckCircle2, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { clsx } from 'clsx';
import { getMediaUrl } from '../utils/imageUrl';

interface EventCardProps {
  event: any;
  onUpdate: (updatedEvent: any) => void;
}

const formatEventDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const EventCard: React.FC<EventCardProps> = ({ event, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const isJoined = event.isJoined;

  const handleJoinToggle = async () => {
    setLoading(true);
    try {
      const endpoint = `/api/events/${event._id}/${isJoined ? 'leave' : 'join'}`;
      const { data } = await api.post(endpoint);
      onUpdate({ ...event, isJoined: !isJoined, attendeesCount: data.attendeesCount });
    } catch (error) {
      console.error('Error toggling join status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl overflow-hidden hover:border-slate-700/60 transition-all group">
      {/* Banner / Image */}
      <div className="relative h-48 bg-slate-800">
        <img 
          src={getMediaUrl(event.image) || '/default-event.jpg'} 
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
            {event.category}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/90 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="p-5 relative -mt-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-lg font-bold text-white leading-tight group-hover:text-primary-400 transition-colors">
            {event.title}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-800/50 rounded-lg px-2 py-1 border border-slate-700/30">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-semibold text-slate-300">{event.attendeesCount}</span>
          </div>
        </div>

        <p className="text-sm text-slate-400 line-clamp-2 mb-5">
          {event.description}
        </p>

        <div className="space-y-2.5 mb-6">
          <div className="flex items-center gap-3 text-slate-500">
            <Calendar className="w-4 h-4 text-primary-500" />
            <span className="text-xs">{formatEventDate(event.dateTime)}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <MapPin className="w-4 h-4 text-primary-500" />
            <span className="text-xs truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
               <img src={getMediaUrl(event.organizerId?.profile_picture) || `https://ui-avatars.com/api/?name=${event.organizerId?.name}`} alt="" />
            </div>
            <span className="text-xs text-slate-600">By {event.organizerId?.name}</span>
          </div>
        </div>

        <button
          onClick={handleJoinToggle}
          disabled={loading}
          className={clsx(
            "w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all",
            isJoined 
              ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700" 
              : "bg-primary-600 text-white shadow-lg shadow-primary-900/20 hover:bg-primary-500 active:scale-[0.98]"
          )}
        >
          {isJoined ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Going
            </>
          ) : (
            <>
              Join Event
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default EventCard;
