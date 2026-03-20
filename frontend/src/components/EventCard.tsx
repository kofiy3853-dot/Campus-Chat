import React, { useState } from 'react';
import { MapPin, Calendar, Users, CheckCircle2, ChevronRight, Trash2 } from 'lucide-react';
import api from '../services/api';
import { clsx } from 'clsx';
import { getMediaUrl } from '../utils/imageUrl';
import SafeImage from './SafeImage';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

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
  const { user } = useAuth();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(false);
  const isJoined = event.isJoined;

  const isKofi = user?.email === 'nharnahyhaw19@gmail.com';
  const isAdmin = user?.role === 'admin';
  const isOrganizer = event.organizerId?._id === user?._id || event.organizerId === user?._id;
  const canDelete = isOrganizer || isAdmin || isKofi;

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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    setLoading(true);
    try {
      await api.delete(`/api/events/${event._id}`);
      // The event list will be updated via socket 'event_deleted' or manual filter
      onUpdate(null); // Signal deletion
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-purple-100/60 rounded-[2.5rem] overflow-hidden hover:border-purple-200 shadow-[0_4px_20px_rgba(109,40,217,0.03)] hover:shadow-[0_8px_30px_rgba(109,40,217,0.06)] hover:-translate-y-1 transition-all duration-300 group">
      {/* Banner / Image */}
      <div className="relative h-48 bg-gray-50 transition-none">
        <SafeImage 
          src={event.image} 
          alt={event.title}
          className="w-full h-full object-cover transition-none"
        />
        <div className="absolute top-4 left-4 transition-none">
          <span className="px-3 py-1.5 rounded-xl bg-white/95 border border-purple-50 text-[9px] font-black text-[#6d28d9] uppercase tracking-widest shadow-sm">
            {event.category}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent transition-none"></div>
      </div>

      {/* Content */}
      <div className="p-5 relative -mt-6 transition-none">
        <div className="flex items-start justify-between gap-4 mb-3 transition-none">
          <h3 className="text-lg font-black text-[#4c1d95] tracking-tight leading-tight">
            {event.title}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0 bg-purple-50 rounded-xl px-2.5 py-1 border border-purple-100/50">
            <Users className="w-3.5 h-3.5 text-[#6d28d9]" />
            <span className="text-xs font-black text-[#6d28d9]">{event.attendeesCount}</span>
          </div>
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete event"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-sm font-medium text-slate-400 line-clamp-2 mb-5">
          {event.description}
        </p>

        <div className="space-y-2.5 mb-6 transition-none">
          <div className="flex items-center gap-3 text-slate-400">
            <Calendar className="w-4 h-4 text-[#6d28d9]" />
            <span className="text-xs font-bold text-slate-600">{formatEventDate(event.dateTime)}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <MapPin className="w-4 h-4 text-[#6d28d9]" />
            <span className="text-xs font-bold text-slate-600 truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-400 transition-none">
            <div className="w-4 h-4 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shrink-0 transition-none">
               <SafeImage 
                 src={event.organizerId?.profile_picture} 
                 alt={event.organizerId?.name}
                 fallback={`https://ui-avatars.com/api/?name=${event.organizerId?.name}`}
                 className="w-full h-full object-cover"
               />
            </div>
            <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">By <span className="text-[#6d28d9]">{event.organizerId?.name}</span></span>
          </div>
        </div>

        <button
          onClick={handleJoinToggle}
          disabled={loading}
          className={clsx(
            "w-full py-4 rounded-[1.2rem] text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm",
            isJoined 
              ? "bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100" 
              : "bg-[#6d28d9] text-white shadow-md shadow-purple-200/50 hover:bg-[#5b21b6]"
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
