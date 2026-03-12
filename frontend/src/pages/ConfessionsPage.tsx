import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Ghost, PenLine, TrendingUp, Clock, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ConfessionCard from '../components/ConfessionCard';
import ConfessionCompose from '../components/ConfessionCompose';

const ConfessionsPage: React.FC = () => {
  const { user } = useAuth();
  const [confessions, setConfessions] = useState<any[]>([]);
  const [sort, setSort] = useState<'newest' | 'top'>('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchConfessions = useCallback(async (pageNum: number, sortType: string, reset = false) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/confessions?page=${pageNum}&sort=${sortType}`);
      setConfessions(prev => reset ? data.confessions : [...prev, ...data.confessions]);
      setHasMore(pageNum < data.pages);
    } catch {
      // silent
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
    <div className="flex-1 overflow-y-auto bg-[#0A0F1D] min-h-full">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
              <Ghost className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Campus Confessions</h1>
              <p className="text-xs text-slate-500">Anonymous thoughts from your campus community</p>
            </div>
          </div>
        </div>

        {/* Rules banner */}
        <div className="mb-6 bg-amber-500/5 border border-amber-500/15 rounded-2xl px-4 py-3 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-[12px] text-amber-300/80 leading-relaxed">
            <strong>Community Rules:</strong> No bullying, hate speech, personal attacks, or revealing identities.
            Violations will be removed and users may be banned.
          </p>
        </div>

        {/* Sort + Compose */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1 gap-1">
            <button
              onClick={() => setSort('newest')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium ${sort === 'newest' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Clock className="w-3.5 h-3.5" />
              Newest
            </button>
            <button
              onClick={() => setSort('top')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium ${sort === 'top' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Top
            </button>
          </div>

          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-2xl shadow-lg shadow-violet-600/20"
          >
            <PenLine className="w-4 h-4" />
            Confess
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
              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4">
                <Ghost className="w-8 h-8 text-slate-700" />
              </div>
              <p className="text-slate-500 font-medium">No confessions yet</p>
              <p className="text-slate-700 text-sm mt-1">Be the first to share something anonymously.</p>
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
