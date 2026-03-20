import React, { useState } from 'react';
import { Heart, MessageCircle, Flag, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../services/api';
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
  const isKofi = currentUser?.email === 'nharnahyhaw19@gmail.com';
  const isAuthor = confession.isMine || confession.userId?._id === currentUser?._id || confession.userId === currentUser?._id;

  const handleLike = async () => {
    try {
      const { data } = await api.post(`/api/confessions/${confession._id}/like`);
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
      await api.post(`/api/confessions/${confession._id}/report`);
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
      await api.delete(`/api/confessions/${confession._id}`);
      onDelete(confession._id);
    } catch (error: any) {
      console.error('Error deleting confession:', error);
      alert(`Deletion failed: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="bg-white border border-purple-100/60 rounded-[2rem] overflow-hidden shadow-[0_4px_20px_rgba(109,40,217,0.03)] hover:shadow-[0_8px_30px_rgba(109,40,217,0.06)] hover:-translate-y-1 transition-all duration-300 p-7 flex flex-col gap-5">
      {/* Top Section */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6d28d9] to-[#4c1d95] flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm">
            👤
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-[#4c1d95] tracking-tight">Anonymous</p>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{timeAgo(confession.createdAt)}</p>
          </div>
        </div>
        {isAdmin && (
          <span className="text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
            ADMIN
          </span>
        )}
      </div>

      {/* Text */}
      <p className="text-[#1e1b4b]/80 text-[15px] leading-relaxed font-medium whitespace-pre-wrap mb-2">
        {confession.text}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-1 pt-3 border-t border-gray-50 transition-none">
        {/* Like */}
        <button
          onClick={handleLike}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-none',
            liked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-gray-50'
          )}
        >
          <Heart className={clsx('w-4 h-4', liked && 'fill-current')} />
          <span>{likes}</span>
        </button>

        {/* Comment */}
        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-slate-400 hover:text-[#6d28d9] hover:bg-purple-50 transition-all"
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
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-none',
            reported ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
          )}
        >
          <Flag className="w-4 h-4" />
          {reported && <span className="text-[11px]">Reported</span>}
        </button>

        {/* Delete button for author, admin or kofi */}
        {(isAdmin || isAuthor || isKofi) && (
          <button
            onClick={handleDelete}
            title="Delete confession"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-none"
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
