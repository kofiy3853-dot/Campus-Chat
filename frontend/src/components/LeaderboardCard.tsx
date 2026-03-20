import React from 'react';
import { Trophy, Medal, Crown } from 'lucide-react';
import { clsx } from 'clsx';
import { getMediaUrl } from '../utils/imageUrl';

interface LeaderboardCardProps {
  user: {
    name: string;
    profile_picture?: string;
    department?: string;
  };
  points: number;
  rank: number;
}

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ user, points, rank }) => {
  const isTopThree = rank <= 3;
  
  const getRankIcon = () => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-300 fill-slate-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600 fill-amber-600" />;
    return <span className="text-slate-400 font-bold text-sm">#{rank}</span>;
  };

  const getRankStyles = () => {
    if (rank === 1) return "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 scale-[1.02] shadow-yellow-100";
    if (rank === 2) return "bg-gradient-to-br from-slate-50 to-purple-50 border-slate-200";
    if (rank === 3) return "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200";
    return "bg-white border-slate-100 hover:border-purple-200 shadow-[0_2px_10px_rgba(109,40,217,0.02)] hover:shadow-purple-50/50";
  };

  return (
    <div className={clsx(
      "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 shadow-sm",
      getRankStyles()
    )}>
      <div className="flex items-center justify-center w-10 shrink-0">
        {getRankIcon()}
      </div>

      <div className="relative shrink-0">
        <img 
          src={getMediaUrl(user.profile_picture) || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
          alt={user.name}
          className={clsx(
            "w-12 h-12 rounded-xl object-cover border-2",
            rank === 1 ? "border-yellow-400" : rank === 2 ? "border-slate-300" : rank === 3 ? "border-amber-500" : "border-white"
          )}
        />
        {isTopThree && (
          <div className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm">
            {rank === 1 && <Trophy className="w-4 h-4 text-yellow-500" />}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-black text-slate-800 truncate">{user.name}</h3>
        <p className="text-[10px] text-slate-400 font-black truncate uppercase tracking-widest">{user.department || 'Campus Student'}</p>
      </div>

      <div className="text-right">
        <div className="text-lg font-black text-[#6d28d9] leading-none">{points.toLocaleString()}</div>
        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1.5">Points</div>
      </div>
    </div>
  );
};

export default LeaderboardCard;
