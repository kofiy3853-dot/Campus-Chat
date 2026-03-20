import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Users, Plus, ArrowRight, Sparkles, Calendar } from 'lucide-react';
import api from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import StudyGroupCreateModal from '../components/StudyGroupCreateModal';

const StudyGroupsPage = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for compose query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('compose') === 'true') {
      setIsModalOpen(true);
      // Clean up URL
      navigate('/dashboard/study-groups', { replace: true });
    }
  }, [location.search, navigate]);

  const fetchGroups = async (query = '') => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/groups/discover${query ? `?subject=${query}` : ''}`);
      setGroups(data);
    } catch (error) {
      console.error('Error fetching study groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGroups(searchQuery);
  };

  const joinGroup = async (groupId: string) => {
    try {
      await api.post('/api/groups/join', { groupId });
      navigate(`/dashboard/study-groups/${groupId}`);
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Failed to join group');
    }
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto h-full p-6 md:p-10 space-y-10 scrollbar-hide">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6d28d9] flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Study Groups</h2>
          </div>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest pl-1">Accelerate your learning together</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          aria-label="Open study group creation modal"
          className="bg-[#6d28d9] hover:bg-[#5b21b6] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 shadow-xl shadow-purple-200 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create Study Group
        </button>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl">
        <form onSubmit={handleSearch} className="relative group">
          <input 
            type="text" 
            placeholder="Search by subject (e.g. CS302, Calculus)..."
            className="w-full bg-white border border-[#f5eeff] rounded-[2rem] py-5 px-8 pr-16 text-slate-700 font-bold shadow-sm outline-none focus:border-purple-200 focus:ring-8 focus:ring-purple-500/5 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            type="submit"
            aria-label="Search study groups"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-[#6d28d9] text-white rounded-full hover:bg-[#5b21b6] transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-[2.5rem] p-8 space-y-4 border border-slate-100 animate-pulse">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
              <div className="h-6 w-3/4 bg-slate-100 rounded-lg" />
              <div className="h-4 w-1/2 bg-slate-100 rounded-lg" />
              <div className="pt-4 flex gap-4">
                <div className="h-10 flex-1 bg-slate-50 rounded-xl" />
              </div>
            </div>
          ))
        ) : groups.length > 0 ? (
          groups.map((group) => (
            <div 
              key={group._id} 
              className="group bg-white rounded-[2.5rem] p-8 space-y-6 border border-slate-100 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#f5eeff] flex items-center justify-center text-[#6d28d9] transition-colors group-hover:bg-[#6d28d9] group-hover:text-white border border-purple-50">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-lg group-hover:text-[#6d28d9] transition-colors line-clamp-1">{group.group_name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{group.subject || 'Lobby'}</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-500 font-medium line-clamp-2 min-h-[40px]">
                  {group.description || 'No description provided.'}
                </p>

                <div className="flex items-center gap-4 py-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <Users className="w-4 h-4" />
                    {group.members.length}/{group.max_members || 50}
                  </div>
                  {group.schedule && (
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#6d28d9] bg-[#f5eeff] px-3 py-1 rounded-full uppercase tracking-widest text-[9px]">
                      <Calendar className="w-3 h-3" />
                      {group.schedule}
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={() => joinGroup(group._id)}
                className="w-full bg-[#fdfaff] border border-purple-50 text-slate-600 hover:bg-[#6d28d9] hover:text-white hover:border-[#6d28d9] hover:shadow-lg hover:shadow-purple-200 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                Assemble with Peers
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <BookOpen className="w-8 h-8 text-slate-300" />
            </div>
            <div className="space-y-2">
                <p className="text-xl font-black text-slate-400 uppercase tracking-widest">No Study Groups Found</p>
                <p className="text-slate-300 font-medium">Be the first to create one for your subject!</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-[#6d28d9] font-black uppercase text-xs tracking-widest hover:text-[#5b21b6] transition-colors"
            >
              + Launch New Lab
            </button>
          </div>
        )}
      </div>

      <StudyGroupCreateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default StudyGroupsPage;
