import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, TrendingUp, Clock, ChevronLeft } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import PollCard from '../components/PollCard';
import PollCompose from '../components/PollCompose';
import Skeleton from '../components/Skeleton';

const PollsPage: React.FC = () => {
  useAuth();
  const { socket } = useSocket();
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'trending'>('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for compose query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('compose') === 'true') {
      setIsComposeOpen(true);
      // Clean up URL
      navigate('/dashboard/polls', { replace: true });
    }
  }, [location.search, navigate]);

  const fetchPolls = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await api.get(`/api/polls/feed`, {
        params: { page: pageNum, limit: 10, sort: sortBy },
      });

      if (append) {
        setPolls((prev) => [...prev, ...response.data.data]);
      } else {
        setPolls(response.data.data);
      }

      setTotalPages(response.data.pagination.total_pages);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPolls(1, false);
  }, [sortBy]);

  useEffect(() => {
    if (!socket) return;

    // Listen for new polls
    socket.on('new_poll', (newPoll: any) => {
      if (sortBy === 'newest') {
        setPolls((prev) => [newPoll, ...prev]);
      }
    });

    // Listen for poll updates (votes)
    socket.on('poll_updated', (data: { pollId: string, poll: any }) => {
      setPolls((prev) =>
        prev.map((p) => (p._id === data.pollId ? data.poll : p))
      );
    });

    // Listen for poll deletions
    socket.on('poll_removed', (data: { pollId: string }) => {
      setPolls((prev) => prev.filter((p) => p._id !== data.pollId));
    });

    return () => {
      socket.off('new_poll');
      socket.off('poll_updated');
      socket.off('poll_removed');
    };
  }, [socket, sortBy]);

  const handlePollCreated = (newPoll: any) => {
    setPolls((prev) => [newPoll, ...prev]);
  };

  const handleVote = (pollId: string, updatedPoll: any) => {
    setPolls((prev) =>
      prev.map((p) => (p._id === pollId ? { ...p, ...updatedPoll, has_voted: true } : p))
    );
  };

  const handleDelete = (pollId: string) => {
    setPolls((prev) => prev.filter((p) => p._id !== pollId));
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPolls(nextPage, true);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-3 md:p-6 scrollbar-hide">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-5 md:mb-8">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => window.history.back()}
                className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-[#6d28d9] hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl md:text-4xl font-black text-[#4c1d95] tracking-tight">Polls</h1>
            </div>
            <button
              onClick={() => setIsComposeOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 md:px-6 md:py-3.5 bg-[#6d28d9] hover:bg-[#5b21b6] text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl md:rounded-2xl shadow-lg shadow-purple-200 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5 text-white" />
              <span className="hidden xs:inline">Create Poll</span>
              <span className="xs:hidden">New Poll</span>
            </button>
          </div>

          {/* Sort Options */}
          <div className="flex gap-1.5 md:gap-2">
            <button
              onClick={() => setSortBy('newest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${
                sortBy === 'newest'
                  ? 'bg-white text-[#6d28d9] shadow-md shadow-purple-100 ring-1 ring-purple-100'
                  : 'bg-slate-200 text-slate-400 hover:bg-slate-300 hover:text-slate-600'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Newest
            </button>
            <button
              onClick={() => setSortBy('trending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${
                sortBy === 'trending'
                  ? 'bg-white text-[#6d28d9] shadow-md shadow-purple-100 ring-1 ring-purple-100'
                  : 'bg-slate-200 text-slate-400 hover:bg-slate-300 hover:text-slate-600'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Trending
            </button>
          </div>
        </div>

        {/* Polls Feed */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : polls.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <p className="text-slate-400 text-lg font-black uppercase tracking-widest mb-6">No active polls</p>
            <button
              onClick={() => setIsComposeOpen(true)}
              className="px-8 py-3 bg-[#6d28d9] hover:bg-[#5b21b6] text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-purple-200 active:scale-95 transition-all"
            >
              Create the first poll
            </button>
          </div>
        ) : (
          <>
            {polls.map((poll) => (
              <PollCard
                key={poll._id}
                poll={poll}
                onVote={handleVote}
                onDelete={handleDelete}
              />
            ))}

            {/* Load More */}
            {page < totalPages && (
              <div className="text-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-2xl border border-slate-100 transition-all active:scale-95 shadow-sm"
                >
                  {loadingMore ? 'Crunching Data...' : 'Load More Polls'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Poll Compose Modal */}
      <PollCompose
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onPollCreated={handlePollCreated}
      />
    </div>
  );
};

export default PollsPage;
