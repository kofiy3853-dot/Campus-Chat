import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Flag, Trash2, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface LostFoundCardProps {
  post: any;
  onDelete?: (postId: string) => void;
  onResolve?: (postId: string) => void;
  onContact?: (postId: string) => void;
}

const LostFoundCard: React.FC<LostFoundCardProps> = ({ post, onDelete, onResolve, onContact }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showImage, setShowImage] = useState(false);

  const isCreator = user?._id === post.creator?._id;
  const categoryColors: any = {
    electronics: 'bg-blue-500/20 text-blue-300',
    stationery: 'bg-purple-500/20 text-purple-300',
    personal: 'bg-pink-500/20 text-pink-300',
    miscellaneous: 'bg-gray-500/20 text-gray-300',
  };

  const statusColors: any = {
    lost: 'bg-red-500/20 text-red-300',
    found: 'bg-green-500/20 text-green-300',
  };

  const handleResolve = async () => {
    try {
      setLoading(true);
      await api.post(`/api/lost-found/${post._id}/resolve`);
      onResolve?.(post._id);
    } catch (error: any) {
      console.error('Error resolving:', error);
      alert(error.response?.data?.message || 'Failed to resolve');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      setLoading(true);
      await api.delete(`/api/lost-found/${post._id}`);
      onDelete?.(post._id);
    } catch (error: any) {
      console.error('Error deleting:', error);
      alert(error.response?.data?.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/api/lost-found/${post._id}/contact`);
      onContact?.(post._id);
      alert(`Contact request recorded! You can reach the poster.`);
    } catch (error: any) {
      console.error('Error contacting:', error);
      alert(error.response?.data?.message || 'Failed to record contact');
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason) {
      alert('Please select a reason');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/api/lost-found/${post._id}/report`, { reason: reportReason });
      alert('Post reported successfully');
      setShowReport(false);
      setReportReason('');
    } catch (error: any) {
      console.error('Error reporting:', error);
      alert(error.response?.data?.message || 'Failed to report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={clsx(
      'bg-slate-800/80 border border-slate-700/30 rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm mb-4 transition',
      post.is_resolved && 'opacity-75'
    )}>
      {/* Image and Status */}
      <div className="relative h-48 bg-slate-700 overflow-hidden">
        {post.image_url ? (
          <>
            <img
              src={post.image_thumbnail || post.image_url}
              alt={post.title}
              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition"
              onClick={() => setShowImage(true)}
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            <span className="text-4xl">📦</span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={clsx('px-3 py-1 rounded-full text-xs font-semibold capitalize', statusColors[post.status])}>
            {post.status}
          </span>
        </div>

        {/* Resolved Badge */}
        {post.is_resolved && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-full text-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5" /> Resolved
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute bottom-3 left-3">
          <span className={clsx('px-3 py-1 rounded-full text-xs font-semibold capitalize', categoryColors[post.category])}>
            {post.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{post.title}</h3>
            <p className="text-sm text-slate-400 mt-1">
              Posted by <span className="font-medium text-slate-300">{post.creator?.name}</span>
            </p>
          </div>

          {isCreator && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition disabled:opacity-50"
              title="Delete post"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-slate-300 text-sm mb-4 line-clamp-2">{post.description}</p>

        {/* Location and Date */}
        <div className="space-y-2 mb-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600/30">
          <div className="flex items-start gap-2">
            <span className="text-slate-400 text-sm font-medium min-w-fit">📍 Location:</span>
            <span className="text-slate-300 text-sm">
              {post.location.building}
              {post.location.room && ` - ${post.location.room}`}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <span className="text-slate-300 text-sm">
              {new Date(post.date).toLocaleDateString()} {new Date(post.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
          <span>👁️ {post.contact_count} contact{post.contact_count !== 1 ? 's' : ''}</span>
          <span>📅 {new Date(post.created_at).toLocaleDateString()}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!post.is_resolved && (
            <button
              onClick={handleContact}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg transition text-sm"
            >
              <MessageSquare className="w-4 h-4" /> Contact Poster
            </button>
          )}

          {isCreator && !post.is_resolved && (
            <button
              onClick={handleResolve}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-lg transition text-sm"
            >
              <CheckCircle className="w-4 h-4" /> Mark Resolved
            </button>
          )}

          {!isCreator && (
            <button
              onClick={() => setShowReport(!showReport)}
              className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition"
              title="Report post"
            >
              <Flag className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Report Modal */}
        {showReport && (
          <div className="mt-4 p-4 bg-slate-700/50 rounded-lg border border-red-500/30">
            <label className="block text-sm font-medium text-white mb-2">Report Reason</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              aria-label="Report reason"
              className="w-full mb-3 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
            >
              <option value="">Select a reason...</option>
              <option value="spam">Spam</option>
              <option value="inappropriate">Inappropriate Content</option>
              <option value="false_info">False Information</option>
              <option value="harassment">Harassment</option>
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

      {/* Image Viewer */}
      {showImage && post.image_url && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImage(false)}
        >
          <img src={post.image_url} alt={post.title} className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
};

export default LostFoundCard;
