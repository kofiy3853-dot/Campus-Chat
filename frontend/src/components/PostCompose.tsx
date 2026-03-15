import React, { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import api from '../services/api';
import { getMediaUrl } from '../utils/imageUrl';
import { compressImage } from '../utils/imageCompression';

interface PostComposeProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: any) => void;
}

const PostCompose: React.FC<PostComposeProps> = ({ isOpen, onClose, onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('miscellaneous');
  const [status, setStatus] = useState('lost');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [imageUrl, setImageUrl] = useState('');
  const [imageThumbnail, setImageThumbnail] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    try {
      setUploading(true);
      const file = await compressImage(originalFile);
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/lost-found/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setImageUrl(response.data.url);
      setImageThumbnail(response.data.url); // For now, same as full URL
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!title.trim()) {
      setError('Please enter an item title');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    if (!building.trim()) {
      setError('Please enter a location');
      return;
    }

    if (!date) {
      setError('Please select a date');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/api/lost-found', {
        title: title.trim(),
        description: description.trim(),
        category,
        status,
        location: {
          building: building.trim(),
          room: room.trim() || undefined,
        },
        date,
        image_url: imageUrl || null,
        image_thumbnail: imageThumbnail || null,
      });

      onPostCreated?.(response.data);

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('miscellaneous');
      setStatus('lost');
      setBuilding('');
      setRoom('');
      setDate(new Date().toISOString().slice(0, 16));
      setImageUrl('');
      setImageThumbnail('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Post Lost or Found Item</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition" title="Close dialog" aria-label="Close dialog">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Row 1: Status and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                title="Select item status"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
              >
                <option value="lost">🔍 Lost Item</option>
                <option value="found">✅ Found Item</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                title="Select item category"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
              >
                <option value="electronics">💻 Electronics</option>
                <option value="stationery">📝 Stationery</option>
                <option value="personal">👜 Personal</option>
                <option value="miscellaneous">📦 Miscellaneous</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Item Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Black iPhone 13"
              maxLength={100}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
            <p className="text-xs text-slate-400 mt-1">{title.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the item in detail (color, brand, condition, etc.)"
              maxLength={1000}
              rows={4}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">{description.length}/1000</p>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Building/Place</label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="e.g., Science Block A"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Room (Optional)</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g., 201"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Date & Time</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              title="Select date and time"
              placeholder="Select date and time"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Photo (Optional)</label>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-4">
              {imageUrl ? (
                <div className="space-y-3">
                  <img src={getMediaUrl(imageUrl)} alt="Preview" className="max-h-40 rounded-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('');
                      setImageThumbnail('');
                    }}
                    className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-300 px-3 py-2 rounded font-medium text-sm transition"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer py-6">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm text-slate-400 text-center">
                    {uploading ? 'Uploading...' : 'Click to upload image'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                    title="Upload image file"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">JPG, PNG, GIF (Max 10MB)</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                </>
              ) : (
                'Post Item'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostCompose;
