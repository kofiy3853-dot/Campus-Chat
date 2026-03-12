import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Clock } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import PollCard from '../components/PollCard';
import PollCompose from '../components/PollCompose';
import Skeleton from '../components/Skeleton';

const PollsPage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'trending'>('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

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
    socket?.emit('poll_created', { poll: newPoll });
  };

  const handleVote = (pollId: string, updatedPoll: any) => {
    setPolls((prev) =>
      prev.map((p) => (p._id === pollId ? { ...p, ...updatedPoll, has_voted: true } : p))
    );
    socket?.emit('poll_voted', { pollId, poll: updatedPoll });
  };

  const handleDelete = (pollId: string) => {
    setPolls((prev) => prev.filter((p) => p._id !== pollId));
    socket?.emit('poll_deleted', { pollId });
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPolls(nextPage, true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold text-white">Polls</h1>
            <button
              onClick={() => setIsComposeOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition"
            >
              <Plus className="w-5 h-5" /> Create Poll
            </button>
          </div>

          {/* Sort Options */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('newest')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                sortBy === 'newest'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" /> Newest
            </button>
            <button
              onClick={() => setSortBy('trending')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                sortBy === 'trending'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Trending
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
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg mb-4">No polls yet</p>
            <button
              onClick={() => setIsComposeOpen(true)}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition"
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
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-medium rounded-lg transition"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
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
