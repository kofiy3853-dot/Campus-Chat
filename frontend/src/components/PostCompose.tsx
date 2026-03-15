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
  const [contactNumber, setContactNumber] = useState('');
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
      const payload = {
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
        contact_number: contactNumber.trim() || undefined,
      };
      const response = await api.post('/api/lost-found', payload);

      onPostCreated?.(response.data);

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('miscellaneous');
      setStatus('lost');
      setBuilding('');
      setRoom('');
      setDate(new Date().toISOString().slice(0, 16));
      setContactNumber('');
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-50 px-8 py-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Post Lost or Found Item</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">Help the campus find their stuff</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors" title="Close dialog" aria-label="Close dialog">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs text-red-600 font-semibold animate-pulse flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
              {error}
            </div>
          )}

          {/* Row 1: Status and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                title="Select item status"
                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-800 appearance-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="lost">🔍 Lost Item</option>
                <option value="found">✅ Found Item</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                title="Select item category"
                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-800 appearance-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="electronics">💻 Electronics</option>
                <option value="stationery">📝 Stationery</option>
                <option value="personal">👜 Personal</option>
                <option value="miscellaneous">📦 Miscellaneous</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div className="relative">
            <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">Item Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Black iPhone 13"
              maxLength={100}
              className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/20 shadow-inner shadow-slate-200/50"
            />
            <div className={`absolute bottom-4 right-4 text-[11px] font-black tracking-widest px-2 py-1 rounded-full ${title.length > 90 ? 'text-amber-500 bg-amber-50' : 'text-slate-400 bg-white shadow-sm'}`}>
              {title.length}/100
            </div>
          </div>

          {/* Description */}
          <div className="relative">
            <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the item in detail (color, brand, condition, etc.)"
              maxLength={1000}
              rows={4}
              className="w-full bg-slate-50 border-none rounded-3xl px-5 py-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/20 resize-none shadow-inner shadow-slate-200/50"
            />
            <div className={`absolute bottom-4 right-4 text-[11px] font-black tracking-widest px-2 py-1 rounded-full ${description.length > 900 ? 'text-amber-500 bg-amber-50' : 'text-slate-400 bg-white shadow-sm'}`}>
              {description.length}/1000
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">Building/Place</label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="e.g., Science Block A"
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">Room (Optional)</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g., 201"
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>
          
          {/* Contact Number */}
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">Contact Number (Optional)</label>
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="e.g., +234 812 345 6789"
              className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">Photo (Optional)</label>
            <div className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-3xl p-6 transition-colors hover:border-sky-300 hover:bg-sky-50/30">
              {imageUrl ? (
                <div className="space-y-4">
                  <img src={getMediaUrl(imageUrl)} alt="Preview" className="max-h-48 rounded-2xl object-cover ring-1 ring-slate-100 shadow-sm mx-auto" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('');
                      setImageThumbnail('');
                    }}
                    className="w-full py-3 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-2xl text-xs font-black tracking-widest uppercase transition-colors"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer py-4">
                  <div className="p-4 bg-white rounded-full shadow-sm ring-1 ring-slate-100 mb-3 text-slate-400 group-hover:text-sky-500 transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                    {uploading ? 'Uploading...' : 'Add Item Image'}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">JPG, PNG, GIF (Max 10MB)</span>
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
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl border border-transparent bg-slate-50 text-slate-500 hover:text-slate-700 text-sm font-black tracking-widest uppercase hover:bg-slate-100 transition-all flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 py-4 rounded-2xl bg-sky-500 text-white text-sm font-black tracking-widest uppercase shadow-lg shadow-sky-200 hover:bg-sky-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Creating...
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
