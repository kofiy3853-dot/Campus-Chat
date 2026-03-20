import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Filter, ChevronLeft } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import LostFoundCard from '../components/LostFoundCard';
import PostCompose from '../components/PostCompose';
import Skeleton from '../components/Skeleton';

const LostFoundPage: React.FC = () => {
  useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [status, setStatus] = useState<'lost' | 'found' | ''>('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params: any = { page: pageNum, limit: 10 };
      if (status) params.status = status;
      if (category) params.category = category;
      if (search) params.search = search;

      const response = await api.get(`/api/lost-found/feed`, { params });

      if (append) {
        setPosts((prev) => [...prev, ...response.data.data]);
      } else {
        setPosts(response.data.data);
      }

      setTotalPages(response.data.pagination.total_pages);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchPosts(1, false);
  }, [status, category, search]);

  // Check for compose query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('compose') === 'true') {
      setIsComposeOpen(true);
      // Clean up URL
      navigate('/dashboard/lost-found', { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    if (!socket) return;

    // Listen for new posts
    socket.on('new_lost_found', (newPost: any) => {
      setPosts((prev) => [newPost, ...prev]);
    });

    // Listen for post updates
    socket.on('lost_found_updated', (data: { postId: string, post: any }) => {
      setPosts((prev) =>
        prev.map((p) => (p._id === data.postId ? data.post : p))
      );
    });

    // Listen for post deletions
    socket.on('lost_found_removed', (data: { postId: string }) => {
      setPosts((prev) => prev.filter((p) => p._id !== data.postId));
    });

    return () => {
      socket.off('new_lost_found');
      socket.off('lost_found_updated');
      socket.off('lost_found_removed');
    };
  }, [socket]);

  const handlePostCreated = (newPost: any) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleResolve = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === postId ? { ...p, is_resolved: true } : p))
    );
  };

  const handleDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, true);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="h-full overflow-y-auto bg-white px-3 md:px-6 py-4 md:py-8 transition-none scrollbar-hide">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-5 md:mb-8">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => window.history.back()}
                className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-[#6d28d9] hover:bg-slate-50 rounded-xl transition-none"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">Lost & Found</h1>
            </div>
            <button
              onClick={() => setIsComposeOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 md:px-5 md:py-3 bg-[#6d28d9] hover:bg-[#5b21b6] text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl md:rounded-2xl shadow-lg shadow-purple-200 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5 md:w-5 md:h-5" />
              <span className="hidden xs:inline">Post Item</span>
              <span className="xs:hidden">Post</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4 md:mb-5 transition-none">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search items, locations..."
              className="w-full pl-11 pr-4 py-3 md:py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-slate-800 text-xs md:text-sm font-bold placeholder-slate-300 focus:outline-none focus:border-purple-200 focus:ring-8 focus:ring-purple-500/5 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2.5 flex-wrap items-center">
            <div className="flex items-center gap-1.5 shrink-0">
              <Filter className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Filter:</span>
            </div>

            <div className="flex gap-2 flex-wrap">
              {/* Status Filter */}
              <button
                onClick={() => setStatus(status === 'lost' ? '' : 'lost')}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-none ${
                  status === 'lost'
                    ? 'bg-rose-50 text-rose-500 border border-rose-100'
                    : 'bg-white text-slate-400 hover:text-[#6d28d9] border border-slate-100'
                }`}
              >
                🔍 Lost
              </button>

              <button
                onClick={() => setStatus(status === 'found' ? '' : 'found')}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-none ${
                  status === 'found'
                    ? 'bg-emerald-50 text-emerald-500 border border-emerald-100'
                    : 'bg-white text-slate-400 hover:text-[#6d28d9] border border-slate-100'
                }`}
              >
                ✅ Found
              </button>

              {/* Category Filter */}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filter by category"
                className="px-3 py-1.5 bg-white text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 focus:outline-none focus:border-purple-200 transition-all cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="electronics">Laptop/Phones</option>
                <option value="stationery">Stationery</option>
                <option value="personal">Personal</option>
                <option value="miscellaneous">Misc</option>
              </select>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 transition-none">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-400 text-lg mb-4">No items found</p>
            <button
              onClick={() => setIsComposeOpen(true)}
              className="px-8 py-3 bg-[#6d28d9] hover:bg-[#5b21b6] text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-purple-200 active:scale-95 transition-all"
            >
              Post an Item
            </button>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <LostFoundCard
                key={post._id}
                post={post}
                onDelete={handleDelete}
                onResolve={handleResolve}
              />
            ))}

            {/* Load More */}
            {page < totalPages && (
              <div className="text-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-2xl border border-slate-100 transition-all active:scale-95"
                >
                  {loadingMore ? 'Loading Labs...' : 'Load More Results'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Post Compose Modal */}
      <PostCompose
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
};

export default LostFoundPage;
