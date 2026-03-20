import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Flag, Trash2, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../utils/imageUrl';
import SafeImage from './SafeImage';

interface LostFoundCardProps {
  post: any;
  onDelete?: (postId: string) => void;
  onResolve?: (postId: string) => void;
  onContact?: (postId: string) => void;
}

const LostFoundCard: React.FC<LostFoundCardProps> = ({ post, onDelete, onResolve, onContact }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showImage, setShowImage] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isKofi = user?.email === 'nharnahyhaw19@gmail.com';
  const isCreator = user?._id === (post.creator?._id || post.creator);
  const canDelete = isCreator || isAdmin || isKofi;
  const categoryColors: any = {
    electronics: 'bg-blue-50 text-sky-500',
    stationery: 'bg-purple-50 text-purple-500',
    personal: 'bg-pink-50 text-pink-500',
    miscellaneous: 'bg-gray-50 text-gray-500',
  };

  const statusColors: any = {
    lost: 'bg-red-50 text-red-500',
    found: 'bg-green-50 text-green-500',
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
      
      const posterEmail = response.data.poster_email;
      const posterNumber = response.data.contact_number;
      
      let message = `You can reach the poster at:\n\nEmail: ${posterEmail}`;
      if (posterNumber) {
        message += `\nPhone: ${posterNumber}`;
      }
      message += `\n\nWould you like to open a direct chat with them?`;

      if (confirm(message)) {
        navigate(`/dashboard/chat/${post.creator?._id || post.creator}`);
      }
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
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 mb-4">
      {/* Image and Status */}
      <div className="relative h-48 bg-gray-50 overflow-hidden transition-none">
        {post.image_url ? (
          <>
            <SafeImage
              src={post.image_thumbnail || post.image_url}
              alt={post.title}
              className="w-full h-full object-cover cursor-pointer transition-none"
              onClick={() => setShowImage(true)}
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-none" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200">
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
          <div className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-full text-xs font-semibold shadow-sm transition-none">
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
        <div className="flex items-start justify-between mb-3 transition-none">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800">{post.title}</h3>
            <p className="text-sm text-gray-400 mt-1">
              Posted by <span className="font-bold text-sky-500">{post.creator?.name}</span>
            </p>
          </div>

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-none disabled:opacity-50"
              title="Delete post"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.description}</p>
 
        {/* Location and Date */}
        <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-start gap-2">
            <span className="text-gray-400 text-sm font-bold min-w-fit">📍 Location:</span>
            <span className="text-gray-600 text-sm">
              {post.location.building}
              {post.location.room && ` - ${post.location.room}`}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <span className="text-gray-600 text-sm font-medium">
              {new Date(post.date).toLocaleDateString()} {new Date(post.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-400 mb-4 transition-none">
          <span>👁️ {post.contact_count} contact{post.contact_count !== 1 ? 's' : ''}</span>
          <span>📅 {new Date(post.created_at).toLocaleDateString()}</span>
        </div>

        <div className="flex gap-2 transition-none">
          {!post.is_resolved && (
            <button
              onClick={handleContact}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-sky-400 hover:bg-sky-500 disabled:opacity-50 text-white font-bold rounded-lg transition-none text-sm shadow-sm"
            >
              <MessageSquare className="w-4 h-4" /> Contact Poster
            </button>
          )}

          {isCreator && !post.is_resolved && (
            <button
              onClick={handleResolve}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold rounded-lg transition-none text-sm shadow-sm"
            >
              <CheckCircle className="w-4 h-4" /> Mark Resolved
            </button>
          )}

          {!isCreator && (
            <button
              onClick={() => setShowReport(!showReport)}
              className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-none"
              title="Report post"
            >
              <Flag className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Report Modal */}
        {showReport && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100 transition-none">
            <label className="block text-sm font-bold text-red-800 mb-2">Report Reason</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              aria-label="Report reason"
              className="w-full mb-3 bg-white border border-red-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-red-400 transition-none"
            >
              <option value="">Select a reason...</option>
              <option value="spam">Spam</option>
              <option value="inappropriate">Inappropriate Content</option>
              <option value="false_info">False Information</option>
              <option value="harassment">Harassment</option>
              <option value="other">Other</option>
            </select>

            <div className="flex gap-2 transition-none">
              <button
                onClick={handleReport}
                disabled={!reportReason || loading}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 px-3 py-2 rounded font-bold text-white text-sm transition-none"
              >
                Report
              </button>
              <button
                onClick={() => {
                  setShowReport(false);
                  setReportReason('');
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded font-bold text-gray-600 text-sm transition-none"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      {showImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowImage(false)}>
          <SafeImage 
            src={post.image_url} 
            alt={post.title} 
            className="max-w-full max-h-[90vh] object-contain rounded-lg" 
          />
        </div>
      )}
    </div>
  );
};

export default LostFoundCard;
