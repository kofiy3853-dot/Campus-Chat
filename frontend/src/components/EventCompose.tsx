import React, { useState } from 'react';
import { X, Calendar, MapPin, AlignLeft, Tag, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';

interface EventComposeProps {
  onClose: () => void;
  onCreated: (event: any) => void;
}

const CATEGORIES = ['Academic', 'Social', 'Sports', 'Clubs', 'Career'];

const EventCompose: React.FC<EventComposeProps> = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    dateTime: '',
    category: 'Social',
    image: '',
    maxAttendees: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.dateTime || !formData.location) {
      return setError('Please fill in all required fields.');
    }

    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/api/events', {
        ...formData,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined
      });
      onCreated(data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Post Campus Event</h2>
            <p className="text-xs text-slate-500 mt-1">Get the student community together</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 text-slate-600 hover:text-white hover:bg-slate-800 rounded-2xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Event Title</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Annual Tech Hackathon"
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 transition-all"
            />
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Date & Time</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="datetime-local"
                  name="dateTime"
                  value={formData.dateTime}
                  onChange={handleChange}
                  title="Event Date and Time"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 outline-none focus:border-primary-500/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Campus Hall, Room 3"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-primary-500/50"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Description</label>
            <div className="relative">
              <AlignLeft className="absolute left-4 top-4 w-4 h-4 text-slate-600" />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="What is this event about?"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-primary-500/50 resize-none"
              />
            </div>
          </div>

          {/* Category & Image URL */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Category</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  title="Event Category"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 outline-none focus:border-primary-500/50 appearance-none"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Image URL</label>
              <div className="relative">
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-primary-500/50"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-400 font-medium animate-pulse">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl border border-slate-800 text-slate-500 text-sm font-bold hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-4 rounded-2xl bg-primary-600 text-white text-sm font-black shadow-lg shadow-primary-900/40 hover:bg-primary-500 hover:shadow-primary-900/60 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventCompose;
