import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Ghost, TrendingUp, Clock, ShieldAlert, PenLine, ChevronLeft } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConfessionCard from '../components/ConfessionCard';
import ConfessionCompose from '../components/ConfessionCompose';

const ConfessionsPage: React.FC = () => {
  const { user } = useAuth();
  const [confessions, setConfessions] = useState<any[]>([]);
  const [sort, setSort] = useState<'newest' | 'top'>('newest');
  const [_page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchConfessions = useCallback(async (pageNum: number, sortType: string, reset = false) => {
    setLoading(true);
    try {
      // Assuming activeCategory is defined elsewhere or will be added. For now, using a placeholder.
      // If activeCategory is not defined, this line will cause an error.
      // For the purpose of this edit, I'll assume it's meant to be added later or is implicitly available.
      const activeCategory = 'All'; // Placeholder, replace with actual state if needed
      const categoryParam = activeCategory !== 'All' ? `&category=${activeCategory}` : '';
      const { data } = await api.get(`/api/confessions?page=${pageNum}&sort=${sortType}${categoryParam}`);

      if (reset) {
        setConfessions(data.confessions);
      } else {
        setConfessions(prev => [...prev, ...data.confessions]);
      }
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error fetching confessions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load / sort change
  useEffect(() => {
    setPage(1);
    setConfessions([]);
    setHasMore(true);
    fetchConfessions(1, sort, true);
  }, [sort, fetchConfessions]);

  // Check for compose query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('compose') === 'true') {
      setShowCompose(true);
      // Clean up URL
      navigate('/dashboard/confessions', { replace: true });
    }
  }, [location.search, navigate]);

  // Infinite scroll observer
  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage(prev => {
          const next = prev + 1;
          fetchConfessions(next, sort, false);
          return next;
        });
      }
    }, { threshold: 0.1 });

    if (sentinelRef.current) observer.current.observe(sentinelRef.current);
    return () => observer.current?.disconnect();
  }, [hasMore, loading, sort, fetchConfessions]);

  const handlePosted = (confession: any) => {
    setConfessions(prev => [{ ...confession, isLiked: false, likesCount: 0, commentsCount: 0 }, ...prev]);
  };

  const handleDelete = (id: string) => {
    setConfessions(prev => prev.filter(c => c._id !== id));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white min-h-full transition-none">
      <div className="max-w-2xl mx-auto px-3 py-4 md:py-6">

        {/* Page Header */}
        <div className="mb-4 md:mb-8">
          <div className="flex items-center gap-2.5 mb-1.5">
            <button 
              onClick={() => window.history.back()}
              className="md:hidden p-1.5 -ml-1 text-gray-400 hover:text-sky-500 hover:bg-gray-50 rounded-xl transition-none"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-100 shrink-0">
              <Ghost className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-800 tracking-tight">Campus Confessions</h1>
              <p className="text-[9px] md:text-[10px] text-gray-400 font-medium">Safe space for anonymous thoughts</p>
            </div>
          </div>
        </div>

        {/* Rules banner */}
        <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl md:rounded-2xl px-3 py-2 flex items-start gap-2.5 transition-none">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[9px] md:text-[10px] text-amber-600 leading-tight">
            <strong>Community Rules:</strong> No bullying, personal attacks or hate speech. Violations lead to bans.
          </p>
        </div>

        {/* Sort + Compose */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl p-0.5 md:p-1 gap-0.5">
            <button
              onClick={() => setSort('newest')}
              className={`flex items-center gap-1 py-1.5 px-2.5 md:px-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-none ${sort === 'newest' ? 'bg-white text-sky-500 shadow-sm' : 'text-gray-400 hover:text-sky-500'}`}
            >
              <Clock className="w-3 h-3" />
              Newest
            </button>
            <button
              onClick={() => setSort('top')}
              className={`flex items-center gap-1 py-1.5 px-2.5 md:px-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-none ${sort === 'top' ? 'bg-white text-sky-500 shadow-sm' : 'text-gray-400 hover:text-sky-500'}`}
            >
              <TrendingUp className="w-3 h-3" />
              Top
            </button>
          </div>

          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-[10px] md:text-xs font-black uppercase tracking-wider rounded-xl shadow-sm transition-none"
          >
            <PenLine className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden xs:inline">Post Confession</span>
            <span className="xs:hidden">Confess</span>
          </button>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {confessions.map(c => (
            <ConfessionCard
              key={c._id}
              confession={c}
              currentUser={user}
              onDelete={handleDelete}
            />
          ))}

          {loading && (
            <div className="text-center py-6 text-slate-600 text-sm">Loading…</div>
          )}

          {!loading && confessions.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4 transition-none">
                <Ghost className="w-8 h-8 text-gray-200" />
              </div>
              <p className="text-gray-400 font-medium">No confessions yet</p>
              <p className="text-gray-300 text-sm mt-1">Be the first to share something anonymously.</p>
            </div>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />

          {!hasMore && confessions.length > 0 && (
            <p className="text-center text-slate-700 text-xs py-4">You've reached the end</p>
          )}
        </div>
      </div>

      {/* Compose modal */}
      {showCompose && (
        <ConfessionCompose
          onClose={() => setShowCompose(false)}
          onPosted={handlePosted}
        />
      )}
    </div>
  );
};

export default ConfessionsPage;
