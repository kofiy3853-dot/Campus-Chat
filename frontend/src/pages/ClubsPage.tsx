import React, { useState, useEffect } from 'react';
import { Search, Globe, Users, Plus, ArrowRight, Loader2, Sparkles, Filter, Shield, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import CreateClubModal from '../components/CreateClubModal';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/context/ToastContext';
import { clsx } from 'clsx';

const ClubsPage = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { socket } = useSocket();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const categories = ['All', 'Academic', 'Social', 'Cultural', 'Sports', 'Technology', 'Arts', 'Professional', 'Other'];

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/clubs', {
        params: {
          category: category === 'All' ? undefined : category,
          search: searchQuery || undefined
        }
      });
      setClubs(data);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, [category]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_club', (club: any) => {
      setClubs(prev => [club, ...prev]);
      showToast('info', 'New Club', `${club.name} has just launched! Join them now.`);
    });

    return () => {
      socket.off('new_club');
    };
  }, [socket, showToast]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClubs();
  };

  const joinClub = async (clubId: string) => {
    try {
      await api.post(`/api/clubs/join/${clubId}`);
      showToast('success', 'Joined!', 'You are now a member of this club.');
      navigate(`/dashboard/clubs/${clubId}`);
    } catch (error: any) {
      showToast('error', 'Failed to join', error.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto h-full p-6 md:p-10 space-y-10 scrollbar-hide">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white">
              <Globe className="w-5 h-5" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Clubs & Communities</h2>
          </div>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest pl-1">Join the heartbeat of campus life</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          aria-label="Create new club"
          className="bg-green-600 hover:bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 shadow-xl shadow-green-200"
        >
          <Plus className="w-5 h-5" />
          Launch a Club
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 max-w-2xl">
          <form onSubmit={handleSearch} className="relative group">
            <input 
              type="text" 
              placeholder="Search by club name or mission..."
              className="w-full bg-white border-2 border-slate-100 rounded-[2rem] py-5 px-8 pr-16 text-slate-700 font-medium shadow-sm outline-none focus:border-green-500 focus:ring-8 focus:ring-green-500/5 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              type="submit"
              aria-label="Search clubs"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-green-500 text-white rounded-full hover:bg-black transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full whitespace-nowrap">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">Filter</span>
          </div>
          {categories.slice(0, 5).map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={clsx(
                "px-6 py-2.5 rounded-full text-sm font-black transition-all whitespace-nowrap border",
                category === cat 
                  ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                  : "bg-white border-slate-100 text-slate-500 hover:border-green-200 hover:text-green-600"
              )}
            >
              {cat}
            </button>
          ))}
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            title="More categories"
            className="bg-white border border-slate-100 rounded-full px-6 py-2.5 text-sm font-black text-slate-500 outline-none focus:ring-4 focus:ring-green-500/5 cursor-pointer shadow-sm"
          >
            <option value="All">More...</option>
            {categories.slice(5).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-[2.5rem] p-8 space-y-4 border border-slate-100 animate-pulse">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto" />
              <div className="h-6 w-3/4 bg-slate-100 rounded-lg mx-auto" />
              <div className="h-4 w-1/2 bg-slate-100 rounded-lg mx-auto" />
              <div className="pt-4 flex gap-4">
                <div className="h-12 flex-1 bg-slate-50 rounded-xl" />
              </div>
            </div>
          ))
        ) : clubs.length > 0 ? (
          clubs.map((club) => (
            <div 
              key={club._id} 
              className="group bg-white rounded-[2.5rem] p-8 space-y-6 border border-slate-100 hover:border-green-500/30 hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300 relative overflow-hidden text-center"
            >
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <Sparkles className="w-5 h-5 text-green-400" />
              </div>

              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 mx-auto">
                  {club.profile_image ? (
                    <img src={club.profile_image} alt={club.name} className="w-full h-full object-cover" />
                  ) : (
                    <Globe className="w-10 h-10 text-slate-300" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full shadow-sm">
                  {club.visibility === 'public' ? (
                    <Shield className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-black text-slate-800 text-xl group-hover:text-green-600 transition-colors line-clamp-1">{club.name}</h3>
                <span className="inline-block px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {club.category}
                </span>
                <p className="text-sm text-slate-500 font-medium line-clamp-2 min-h-[40px]">
                  {club.description}
                </p>
              </div>

              <div className="flex items-center justify-center gap-6 py-2 border-y border-slate-50">
                <div className="flex flex-col">
                  <span className="text-lg font-black text-slate-800">{club.members.length}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Members</span>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div className="flex flex-col">
                  <span className="text-lg font-black text-slate-800">12</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Post</span>
                </div>
              </div>

              <button 
                onClick={() => joinClub(club._id)}
                className="w-full bg-slate-900 text-white hover:bg-black hover:shadow-lg hover:shadow-green-200 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 group/btn"
              >
                Join Community
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <Globe className="w-8 h-8 text-slate-300" />
            </div>
            <div className="space-y-2">
                <p className="text-xl font-black text-slate-400 uppercase tracking-widest">No Communities Found</p>
                <p className="text-slate-300 font-medium">Be the first to launch a new student organization!</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-green-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-lg"
            >
              Start a Movement
            </button>
          </div>
        )}
      </div>

      <CreateClubModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchClubs}
      />
    </div>
  );
};

export default ClubsPage;
