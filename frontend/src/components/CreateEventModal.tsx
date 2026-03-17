import React, { useState } from 'react';
import { X, Calendar, MapPin, AlignLeft, Image as ImageIcon, Loader2, Send } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: string;
  onSuccess: () => void;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, clubId, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !date || !location) {
      showToast('error', 'Required Fields', 'Please fill in all required event details');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('date', date);
    formData.append('location', location);
    if (image) formData.append('image', image);

    try {
      await api.post(`/api/clubs/${clubId}/events`, formData);
      showToast('success', 'Event Created!', 'Your event has been scheduled.');
      onSuccess();
      onClose();
      // Reset
      setTitle('');
      setDescription('');
      setDate('');
      setLocation('');
      setImage(null);
    } catch (error: any) {
      showToast('error', 'Failed', error.response?.data?.message || 'Error creating event');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white">
                <Calendar className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Schedule Event</h2>
            </div>
            <button onClick={onClose} title="Close" className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Event Title"
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-500 focus:bg-white font-bold transition-all"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                   <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                    type="datetime-local"
                    title="Event Date and Time"
                    aria-label="Event Date and Time"
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-500 focus:bg-white font-bold transition-all text-sm"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="relative">
                   <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                    type="text"
                    placeholder="Location"
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-500 focus:bg-white font-bold transition-all"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="relative">
                <AlignLeft className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                <textarea 
                  placeholder="Event Description & Agenda"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-500 focus:bg-white font-medium min-h-[120px] transition-all resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <input 
                  type="file" 
                  id="event-image"
                  className="hidden"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  accept="image/*"
                />
                <label 
                  htmlFor="event-image"
                  className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
                >
                  <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600 truncate max-w-[150px]">
                    {image ? image.name : 'Event Poster'}
                  </span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-blue-200"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Set Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEventModal;
