import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import LostFoundCard from '../components/LostFoundCard';
import PostCompose from '../components/PostCompose';
import Skeleton from '../components/Skeleton';

const LostFoundPage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
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
    socket?.emit('lost_found_posted', { post: newPost });
  };

  const handleResolve = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === postId ? { ...p, is_resolved: true } : p))
    );
    socket?.emit('lost_found_resolved', { postId });
  };

  const handleDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    socket?.emit('lost_found_deleted', { postId });
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
    <div className="min-h-screen bg-slate-950 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold text-white">Lost & Found</h1>
            <button
              onClick={() => setIsComposeOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition"
            >
              <Plus className="w-5 h-5" /> Post Item
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by item, location..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">Filter:</span>
            </div>

            {/* Status Filter */}
            <button
              onClick={() => setStatus(status === 'lost' ? '' : 'lost')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                status === 'lost'
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              🔍 Lost
            </button>

            <button
              onClick={() => setStatus(status === 'found' ? '' : 'found')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                status === 'found'
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              ✅ Found
            </button>

            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
              className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-sm border border-slate-600 focus:outline-none focus:border-primary-500"
            >
              <option value="">All Categories</option>
              <option value="electronics">💻 Electronics</option>
              <option value="stationery">📝 Stationery</option>
              <option value="personal">👜 Personal</option>
              <option value="miscellaneous">📦 Miscellaneous</option>
            </select>
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
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-slate-400 text-lg mb-4">No items found</p>
            <button
              onClick={() => setIsComposeOpen(true)}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition"
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
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-medium rounded-lg transition"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
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
