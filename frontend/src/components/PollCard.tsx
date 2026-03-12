import React, { useState } from 'react';
import { clsx } from 'clsx';
import { ThumbsUp, Flag, Trash2, ChevronDown } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PollCardProps {
  poll: any;
  onVote?: (pollId: string, poll: any) => void;
  onDelete?: (pollId: string) => void;
  onReport?: (pollId: string) => void;
}

const PollCard: React.FC<PollCardProps> = ({ poll, onVote, onDelete, onReport }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showResults, setShowResults] = useState(poll.has_voted);

  const creatorName = poll.is_anonymous ? 'Anonymous' : poll.creator?.name || 'Unknown User';
  const creatorAvatar = poll.is_anonymous ? null : poll.creator?.profile_picture;

  const isExpired = poll.status === 'expired';
  const isCreator = !poll.is_anonymous && user?._id === poll.creator?._id;

  const handleVote = async (optionIndex: number) => {
    if (poll.has_voted || loading || isExpired) return;
    
    try {
      setLoading(true);
      const response = await api.post(`/api/polls/${poll._id}/vote`, {
        selected_option: optionIndex,
      });
      onVote?.(poll._id, response.data.poll);
      setShowResults(true);
    } catch (error: any) {
      console.error('Error voting:', error);
      alert(error.response?.data?.message || 'Failed to vote');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this poll?')) return;
    
    try {
      await api.delete(`/api/polls/${poll._id}`);
      onDelete?.(poll._id);
    } catch (error: any) {
      console.error('Error deleting poll:', error);
      alert(error.response?.data?.message || 'Failed to delete poll');
    }
  };

  const handleReport = async () => {
    if (!reportReason) {
      alert('Please select a reason');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/api/polls/${poll._id}/report`, { reason: reportReason });
      alert('Poll reported successfully');
      setShowReport(false);
      setReportReason('');
    } catch (error: any) {
      console.error('Error reporting poll:', error);
      alert(error.response?.data?.message || 'Failed to report poll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/30 rounded-2xl p-6 shadow-lg backdrop-blur-sm mb-4 hover:border-slate-600/50 transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          {creatorAvatar && (
            <img
              src={creatorAvatar}
              alt={creatorName}
              className="w-10 h-10 rounded-full object-cover border border-slate-700"
            />
          )}
          <div>
            <p className="text-sm font-medium text-white">{creatorName}</p>
            <p className="text-xs text-slate-400">
              {new Date(poll.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {isExpired && (
            <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs font-medium">
              Expired
            </span>
          )}
          {isCreator && (
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition"
              title="Delete poll"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Question */}
      <h3 className="text-lg font-semibold text-white mb-4">{poll.question}</h3>

      {/* Options - Voting Phase */}
      {!poll.has_voted && !isExpired && (
        <div className="space-y-2 mb-4">
          {poll.options.map((option: any, idx: number) => (
            <button
              key={idx}
              onClick={() => handleVote(idx)}
              disabled={loading}
              className={clsx(
                'w-full p-3 rounded-lg text-left font-medium transition',
                'border border-slate-600 hover:border-primary-500 hover:bg-slate-700/50',
                'text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {option.text}
            </button>
          ))}
        </div>
      )}

      {/* Options - Results Phase */}
      {(poll.has_voted || isExpired || showResults) && (
        <div className="space-y-3 mb-4">
          {poll.results &&
            poll.results.map((result: any, idx: number) => {
              const isSelected = poll.user_vote === result.index;
              const percentage = parseFloat(result.percentage);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={clsx('text-sm font-medium', isSelected ? 'text-primary-400' : 'text-slate-200')}>
                      {result.text}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary-300">{result.percentage}%</span>
                      {isSelected && <ThumbsUp className="w-4 h-4 text-primary-400" />}
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={clsx(
                        'h-full transition-all duration-300',
                        isSelected ? 'bg-primary-500' : 'bg-primary-600/60'
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400">{result.votes} vote{result.votes !== 1 ? 's' : ''}</p>
                </div>
              );
            })}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/30">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{poll.total_votes} vote{poll.total_votes !== 1 ? 's' : ''}</span>
          {poll.hide_results_until_voted && !poll.has_voted && (
            <span className="text-slate-500">• Results hidden until you vote</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!poll.has_voted && !showResults && !isExpired && (
            <button
              onClick={() => setShowResults(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-slate-300 transition"
              disabled={poll.hide_results_until_voted && !poll.has_voted}
            >
              View results <ChevronDown className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => setShowReport(!showReport)}
            className="p-1.5 hover:bg-red-500/20 rounded text-red-400 transition"
            title="Report poll"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Report Modal */}
      {showReport && (
        <div className="mt-4 p-4 bg-slate-700/50 rounded-lg border border-red-500/30">
          <label className="block text-sm font-medium text-white mb-2">Report Reason</label>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full mb-3 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
          >
            <option value="">Select a reason...</option>
            <option value="inappropriate_content">Inappropriate Content</option>
            <option value="spam">Spam</option>
            <option value="harassment">Harassment</option>
            <option value="misleading">Misleading Information</option>
            <option value="other">Other</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={handleReport}
              disabled={!reportReason || loading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 px-3 py-2 rounded font-medium text-white text-sm transition"
            >
              Report
            </button>
            <button
              onClick={() => {
                setShowReport(false);
                setReportReason('');
              }}
              className="flex-1 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded font-medium text-white text-sm transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollCard;
