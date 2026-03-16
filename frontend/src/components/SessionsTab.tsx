import React, { useState } from 'react';
import { Plus, Calendar, Clock, MapPin, Trash2, CalendarDays, Loader2, ChevronRight, Check } from 'lucide-react';
import api from '../services/api';
import { clsx } from 'clsx';

interface SessionsTabProps {
  groupId: string;
  sessions: any[];
  onUpdate: () => void;
  isAdmin: boolean;
}

const SessionsTab: React.FC<SessionsTabProps> = ({ groupId, sessions, onUpdate, isAdmin }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: ''
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.title || !newSession.start_time || !newSession.end_time) return;

    setLoading(true);
    try {
      await api.post('/api/groups/sessions', {
        groupId,
        ...newSession
      });
      onUpdate();
      setIsAdding(false);
      setNewSession({ title: '', description: '', start_time: '', end_time: '', location: '' });
    } catch (error) {
      console.error('Error scheduling session:', error);
      alert('Failed to schedule session');
    } finally {
      setLoading(false);
    }
  };

  const sortedSessions = [...sessions].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string, type: 'day' | 'month') => {
    const d = new Date(dateStr);
    return type === 'day' ? d.getDate() : d.toLocaleString('default', { month: 'short' });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-8 pb-4 flex items-center justify-between">
         <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Study Sessions</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest pl-1">Scheduled Operations</p>
         </div>
         {isAdmin && (
           <button 
             onClick={() => setIsAdding(!isAdding)}
             aria-label={isAdding ? "Cancel scheduling" : "Schedule session"}
             className={clsx(
               "p-4 rounded-2xl transition-all active:scale-95 shadow-lg",
               isAdding ? "bg-slate-100 text-slate-400 shadow-none" : "bg-purple-600 text-white shadow-purple-200"
             )}
           >
             <Plus className={clsx("w-5 h-5 transition-transform", isAdding && "rotate-45")} />
           </button>
         )}
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6 scrollbar-hide">
        {isAdding && (
          <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1" htmlFor="session-title">Session Title</label>
                <input 
                  id="session-title"
                  type="text" 
                  placeholder="e.g. Midterm Preparation"
                  className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium outline-none focus:ring-4 focus:ring-purple-500/5 transition-all"
                  value={newSession.title}
                  onChange={(e) => setNewSession({...newSession, title: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1" htmlFor="start-time">Start Time</label>
                  <input 
                    id="start-time"
                    type="datetime-local" 
                    className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium outline-none focus:ring-4 focus:ring-purple-500/5 transition-all"
                    value={newSession.start_time}
                    onChange={(e) => setNewSession({...newSession, start_time: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1" htmlFor="end-time">End Time</label>
                  <input 
                    id="end-time"
                    type="datetime-local" 
                    className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium outline-none focus:ring-4 focus:ring-purple-500/5 transition-all"
                    value={newSession.end_time}
                    onChange={(e) => setNewSession({...newSession, end_time: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1" htmlFor="location">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    id="location"
                    type="text" 
                    placeholder="e.g. Central Library, Room 402"
                    className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-medium outline-none focus:ring-4 focus:ring-purple-500/5 transition-all"
                    value={newSession.location}
                    onChange={(e) => setNewSession({...newSession, location: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Postpone
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-purple-600 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-200 hover:bg-black transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Activate Session'}
                </button>
              </div>
            </form>
          </div>
        )}

        {sortedSessions.length > 0 ? (
          <div className="space-y-4">
            {sortedSessions.map((session, i) => (
              <div 
                key={i} 
                className="group relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] hover:bg-white hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/5 transition-all duration-300"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-white shadow-sm flex flex-col items-center justify-center border border-slate-100 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-50">{formatDate(session.start_time, 'month')}</span>
                    <span className="text-xl font-black">{formatDate(session.start_time, 'day')}</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-slate-800">{session.title}</h4>
                    <div className="flex flex-wrap items-center gap-3">
                       <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(session.start_time)} - {formatTime(session.end_time)}
                       </span>
                       <span className="flex items-center gap-1.5 text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md uppercase tracking-widest">
                          <MapPin className="w-3.5 h-3.5" />
                          {session.location}
                       </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="hidden md:block h-10 w-[1px] bg-slate-100 mx-2" />
                  <button className="flex items-center gap-2 text-indigo-500 font-black uppercase text-[10px] tracking-widest hover:text-indigo-600">
                    RSVP 
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : !isAdding && (
          <div className="py-20 text-center">
             <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 text-slate-200">
                <CalendarDays className="w-8 h-8" />
             </div>
             <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Silence in the Labs</p>
             {isAdmin && (
               <button 
                 onClick={() => setIsAdding(true)}
                 className="mt-4 text-purple-500 text-[10px] font-black uppercase tracking-widest hover:text-purple-600 transition-colors"
               >
                 + Schedule First Session
               </button>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsTab;
