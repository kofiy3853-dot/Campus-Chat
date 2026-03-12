import React, { useState } from 'react';
import { Heart, MessageCircle, Flag, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import axios from 'axios';
import ConfessionComments from './ConfessionComments';

interface ConfessionCardProps {
  confession: any;
  currentUser: any;
  onDelete: (id: string) => void;
}

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const ConfessionCard: React.FC<ConfessionCardProps> = ({ confession, currentUser, onDelete }) => {
  const [liked, setLiked] = useState(confession.isLiked);
  const [likes, setLikes] = useState(confession.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [reported, setReported] = useState(false);
  const [reporting, setReporting] = useState(false);
  const isAdmin = currentUser?.role === 'admin';

  const handleLike = async () => {
    try {
      const { data } = await axios.post(`/api/confessions/${confession._id}/like`);
      setLiked(data.liked);
      setLikes((prev: number) => data.liked ? prev + 1 : prev - 1);
    } catch {
      // silent
    }
  };

  const handleReport = async () => {
    if (reported || reporting) return;
    if (!window.confirm('Report this confession for violating community rules?')) return;
    setReporting(true);
    try {
      await axios.post(`/api/confessions/${confession._id}/report`);
      setReported(true);
    } catch {
      // silent
    } finally {
      setReporting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this confession? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/confessions/${confession._id}`);
      onDelete(confession._id);
    } catch {
      // silent
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/60 w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
          👤
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-300">Anonymous</p>
          <p className="text-[11px] text-slate-600">{timeAgo(confession.createdAt)}</p>
        </div>
        {isAdmin && (
          <span className="text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
            ADMIN
          </span>
        )}
      </div>

      {/* Text */}
      <p className="text-slate-200 text-[15px] leading-relaxed whitespace-pre-wrap mb-5">
        {confession.text}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-1 pt-3 border-t border-slate-800/60">
        {/* Like */}
        <button
          onClick={handleLike}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium',
            liked ? 'text-red-400 bg-red-400/10' : 'text-slate-500 hover:text-red-400 hover:bg-slate-800'
          )}
        >
          <Heart className={clsx('w-4 h-4', liked && 'fill-current')} />
          <span>{likes}</span>
        </button>

        {/* Comment */}
        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-500 hover:text-primary-400 hover:bg-slate-800"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{confession.commentsCount}</span>
          {showComments ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
        </button>

        <div className="flex-1" />

        {/* Report */}
        <button
          onClick={handleReport}
          disabled={reported || reporting}
          title={reported ? 'Already reported' : 'Report'}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm',
            reported ? 'text-slate-600 cursor-not-allowed' : 'text-slate-600 hover:text-amber-400 hover:bg-slate-800'
          )}
        >
          <Flag className="w-4 h-4" />
          {reported && <span className="text-[11px]">Reported</span>}
        </button>

        {/* Admin: Delete + Ban */}
        {isAdmin && (
          <button
            onClick={handleDelete}
            title="Delete confession"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-slate-600 hover:text-red-400 hover:bg-red-400/10"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Comments section */}
      {showComments && (
        <ConfessionComments confessionId={confession._id} onComment={() => {}} />
      )}
    </div>
  );
};

export default ConfessionCard;
