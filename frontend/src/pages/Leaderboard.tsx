import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Heart, Users, Search, RefreshCw, Star } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import LeaderboardCard from '../components/LeaderboardCard';
import Skeleton from '../components/Skeleton';

type LeaderboardTab = 'campus' | 'weekly' | 'helpers';

const Leaderboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('campus');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();

  const fetchLeaderboards = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/leaderboard');
      setData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load leaderboards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboards();

    if (socket) {
      socket.on('leaderboard_update', () => {
        // Debounce or just re-fetch for now to keep it simple and accurate
        fetchLeaderboards();
      });

      return () => {
        socket.off('leaderboard_update');
      };
    }
  }, [socket]);

  const getCurrentList = () => {
    if (!data) return [];
    if (activeTab === 'campus') return data.allTime;
    if (activeTab === 'weekly') return data.weekly;
    return data.helpers;
  };

  const tabs = [
    { id: 'campus', label: 'Campus Leaders', icon: Trophy, color: 'text-yellow-500' },
    { id: 'weekly', label: 'Weekly Stars', icon: TrendingUp, color: 'text-sky-500' },
    { id: 'helpers', label: 'Study Helpers', icon: Heart, color: 'text-rose-500' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-6 pb-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              Hall of Fame <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            </h1>
            <p className="text-sm text-slate-500 font-medium">Top contributors and active students this week.</p>
          </div>
          <button 
            onClick={fetchLeaderboards}
            className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-400"
            title="Refresh"
          >
            <RefreshCw className={clsx("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as LeaderboardTab)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                activeTab === tab.id 
                  ? "bg-white text-slate-800 shadow-sm shadow-slate-200 ring-1 ring-slate-100" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              )}
            >
              <tab.icon className={clsx("w-4 h-4", activeTab === tab.id ? tab.color : "text-slate-400")} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
        {loading && !data ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100">
              <Skeleton className="w-10 h-6 rounded-md" />
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-32 h-4 rounded-md" />
                <Skeleton className="w-24 h-3 rounded-md" />
              </div>
              <Skeleton className="w-16 h-8 rounded-md" />
            </div>
          ))
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Something went wrong</h3>
            <p className="text-slate-500 max-w-xs mx-auto mb-6">{error}</p>
            <button 
              onClick={fetchLeaderboards}
              className="bg-sky-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-sky-200 active:scale-95 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : getCurrentList().length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center opacity-60">
            <Users className="w-12 h-12 text-slate-300 mb-4" />
            <p className="font-bold text-slate-400">No data available yet.</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-black">Join groups and share resources!</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            {getCurrentList().map((entry: any, index: number) => (
              <LeaderboardCard 
                key={entry._id}
                rank={index + 1}
                user={entry.user}
                points={entry.totalPoints}
              />
            ))}
            
            <div className="py-8 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                Updates in real-time • Keep contributing!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
