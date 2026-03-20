import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Megaphone, Zap, ShoppingBag, Users } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'engagement' | 'marketplace' | 'social';
  cta?: string;
  priority: 'low' | 'medium' | 'high';
}

const AnnouncementHero: React.FC = () => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const navigate = useNavigate();

  const fetchHero = async () => {
    try {
      const { data } = await api.get('/api/announcements/hero');
      setAnnouncement(data);
    } catch (error) {
      console.error('Failed to fetch hero announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHero();

    if (socket) {
      socket.on('new_announcement', (newAnn: any) => {
        if (newAnn.priority === 'high' && newAnn.is_auto_generated) {
          setAnnouncement(newAnn);
        }
      });
    }

    return () => {
      if (socket) socket.off('new_announcement');
    };
  }, [socket]);

  if (loading || !announcement) return null;

  const getIcon = () => {
    switch (announcement.type) {
      case 'marketplace': return <ShoppingBag className="w-5 h-5" />;
      case 'social': return <Users className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  const handleCTA = () => {
    const cta = announcement.cta?.toLowerCase() || '';
    if (cta.includes('confession')) navigate('/dashboard/confessions');
    else if (cta.includes('sell') || cta.includes('market')) navigate('/dashboard/marketplace');
    else if (cta.includes('event')) navigate('/dashboard/events');
    else navigate('/dashboard/explorer');
  };

  return (
    <div className="relative overflow-hidden bg-white rounded-[2.5rem] border border-purple-100 shadow-xl shadow-purple-500/5 group hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 mb-8">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#6d28d9]/5 rounded-full blur-[40px] translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
        {/* Visual/Icon Side */}
        <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-gradient-to-br from-[#6d28d9] to-[#4c1d95] flex items-center justify-center text-white shadow-lg shadow-purple-200 group-hover:rotate-6 transition-transform">
          {getIcon()}
        </div>

        {/* Content Side */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <span className="px-3 py-1 bg-purple-50 text-[#6d28d9] text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-purple-100 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 fill-current" />
              Campus Live
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#6d28d9] animate-pulse"></span>
          </div>
          
          <h2 className="text-xl md:text-2xl font-black text-[#1e1b4b] tracking-tight mb-2">
            {announcement.title}
          </h2>
          <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed max-w-xl">
            {announcement.content}
          </p>
        </div>

        {/* Action Side */}
        <div className="shrink-0">
          <button 
            onClick={handleCTA}
            className="flex items-center gap-3 px-8 py-4 bg-[#6d28d9] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#5b21b6] shadow-xl shadow-purple-200 active:scale-95 transition-all group/btn"
          >
            {announcement.cta || 'Take Action'}
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementHero;
