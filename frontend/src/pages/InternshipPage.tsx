import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Briefcase, MapPin, Calendar, Bookmark, BookmarkCheck, ExternalLink, Plus, Filter, Loader2, ChevronRight, Trash2 } from 'lucide-react';
import api from '@/services/api';
import { clsx } from 'clsx';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ApplyInternshipModal from '@/components/ApplyInternshipModal';
import PostInternshipModal from '@/components/PostInternshipModal';

const InternshipPage: React.FC = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('All');
  const [tab, setTab] = useState<'all' | 'saved'>('all');
  const [deadlineFilter, setDeadlineFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const navigate = useNavigate();
  const routerLocation = useLocation();

  // Check for compose query param
  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    if (params.get('compose') === 'true') {
      setIsModalOpen(true);
      // Clean up URL
      navigate('/dashboard/internships', { replace: true });
    }
  }, [routerLocation.search, navigate]);

  const categories = ['All', 'Engineering', 'Design', 'Marketing', 'Data Science', 'Business', 'Other'];
  const locations = ['All', 'Remote', 'Accra', 'Kumasi', 'Tema', 'On-site'];

  useEffect(() => {
    fetchInternships();
  }, [category, location, deadlineFilter, tab]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_internship', (internship: any) => {
      setInternships(prev => [internship, ...prev]);
      if (tab === 'all') {
        showToast('info', 'New Opportunity', `${internship.company} just posted a new ${internship.title} role!`);
      }
    });

    socket.on('internship_deleted', (id: string) => {
      setInternships(prev => prev.filter(i => i._id !== id));
    });

    return () => {
      socket.off('new_internship');
      socket.off('internship_deleted');
    };
  }, [socket, tab, showToast]);

  const fetchInternships = async () => {
    setLoading(true);
    try {
      const endpoint = tab === 'all' ? '/api/internships' : '/api/internships/saved';
      const response = await api.get(endpoint, {
        params: {
          category,
          location,
          search,
          deadline: deadlineFilter
        }
      });
      setInternships(response.data);
      if (tab === 'saved') {
        setSavedIds(response.data.map((i: any) => i._id));
      }
    } catch (error) {
      console.error('Failed to fetch internships:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInternships();
  };

  const toggleSave = async (id: string) => {
    try {
      const response = await api.post(`/api/internships/save/${id}`);
      setSavedIds(response.data.saved_internships);
      if (tab === 'saved') {
        setInternships(prev => prev.filter(i => i._id !== id));
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) return;
    try {
      await api.delete(`/api/internships/${id}`);
      setInternships(prev => prev.filter(i => i._id !== id));
      showToast('success', 'Deleted', 'Internship opportunity removed successfuly');
    } catch (error) {
      console.error('Failed to delete internship:', error);
      showToast('error', 'Error', 'Failed to delete internship');
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Campus Internships</h1>
            <p className="text-slate-500 font-medium">Find your next big opportunity and start your career journey.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            aria-label="Post new internship opportunity"
            className="bg-indigo-600 hover:bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-200"
          >
            <Plus className="w-5 h-5" />
            Post Opportunity
          </button>
        </div>

        {/* Stats & Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            <button 
              onClick={() => setTab('all')}
              className={clsx(
                "flex-1 py-3 px-6 rounded-xl font-bold transition-all",
                tab === 'all' ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              All Openings
            </button>
            <button 
              onClick={() => setTab('saved')}
              className={clsx(
                "flex-1 py-3 px-6 rounded-xl font-bold transition-all",
                tab === 'saved' ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              Saved For Later
            </button>
          </div>
          
          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search roles, companies..."
              aria-label="Search internships"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all shadow-sm"
            />
          </form>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">Filters</span>
          </div>
          
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            title="Filter by category"
            className="bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/5 cursor-pointer shadow-sm"
          >
            {categories.map(c => <option key={c} value={c}>{c} Category</option>)}
          </select>

          <select 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            title="Filter by location"
            className="bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/5 cursor-pointer shadow-sm"
          >
            {locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          <select 
            value={deadlineFilter}
            onChange={(e) => setDeadlineFilter(e.target.value)}
            title="Filter by deadline"
            className="bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/5 cursor-pointer shadow-sm"
          >
            <option value="all">All Deadlines</option>
            <option value="upcoming">Upcoming Only</option>
          </select>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="font-bold text-slate-400">Loading opportunities...</p>
          </div>
        ) : internships.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {internships.map((internship) => (
              <div 
                key={internship._id}
                className="group bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all flex flex-col relative overflow-hidden"
              >
                {/* Save Button */}
                <button 
                  onClick={() => toggleSave(internship._id)}
                  aria-label={savedIds.includes(internship._id) || tab === 'saved' ? "Unsave internship" : "Save internship for later"}
                  title={savedIds.includes(internship._id) || tab === 'saved' ? "Unsave" : "Save"}
                  className={clsx(
                    "absolute top-6 right-6 p-3 rounded-2xl transition-all active:scale-90",
                    savedIds.includes(internship._id) || tab === 'saved'
                      ? "bg-indigo-50 text-indigo-600" 
                      : "bg-slate-50 text-slate-300 hover:text-indigo-400"
                  )}
                >
                  {savedIds.includes(internship._id) || tab === 'saved' ? <BookmarkCheck className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
                </button>

                {(user?.role === 'admin' || user?.email === 'nharnahyhaw19@gmail.com' || user?._id === (internship.posted_by?._id || internship.posted_by)) && (
                  <button
                    onClick={() => handleDelete(internship._id)}
                    className="absolute top-24 right-6 p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
                    title="Delete opportunity"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Briefcase className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 line-clamp-1">{internship.title}</h3>
                    <p className="text-sm font-bold text-slate-400">{internship.company}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8 flex-1">
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-bold">{internship.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-bold">Deadline: {formatDate(internship.deadline)}</span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed line-clamp-3">
                    {internship.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {internship.requirements?.slice(0, 3).map((req: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100">
                      {req}
                    </span>
                  ))}
                  {internship.requirements?.length > 3 && (
                    <span className="px-3 py-1.5 text-slate-400 text-[10px] font-bold">+{internship.requirements.length - 3} more</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {internship.apply_link ? (
                    <a 
                      href={internship.apply_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                      Apply Externally
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <button 
                      onClick={() => setIsApplying(internship._id)}
                      className="flex-1 bg-indigo-600 hover:bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                      Apply with Resume
                    </button>
                  )}
                  <button 
                    aria-label="View internship details"
                    title="View Details"
                    className="p-4 bg-slate-50 hover:bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-500 transition-all shadow-sm"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-50/30 rounded-full blur-2xl group-hover:bg-indigo-100/40 transition-colors" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 mb-6">
              <Search className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">No opportunities found</h2>
            <p className="text-slate-400 font-bold mb-8">Try adjusting your filters or check back later!</p>
            <button 
              onClick={() => {setCategory('All'); setLocation('All'); setDeadlineFilter('all'); setSearch(''); setTab('all');}}
              className="text-indigo-600 font-black uppercase tracking-widest text-xs hover:text-black transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      <PostInternshipModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchInternships} 
      />

      <ApplyInternshipModal
        internshipId={isApplying}
        onClose={() => setIsApplying(null)}
        onSuccess={() => {
          setIsApplying(null);
          // Maybe refresh to show "Applied" status if added later
        }}
      />
    </div>
  );
};

export default InternshipPage;
