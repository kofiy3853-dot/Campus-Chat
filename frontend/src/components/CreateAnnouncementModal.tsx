import React, { useState } from 'react';
import { X, Megaphone, Image as ImageIcon, Pin, Loader2, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      showToast('error', 'Required Fields', 'Title and content are required');
      return;
    }

    try {
      setLoading(true);
      let imageUrl = '';

      if (image) {
        const formData = new FormData();
        formData.append('image', image);
        const uploadRes = await api.post('/api/announcements/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadRes.data.url;
      }

      await api.post('/api/announcements/create', {
        title,
        content,
        image: imageUrl,
        pinned: isPinned
      });

      showToast('success', 'Announcement Created', 'Your announcement has been posted successfully!');
      setTitle('');
      setContent('');
      setImage(null);
      setImagePreview(null);
      setIsPinned(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', 'Creation Failed', err.response?.data?.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-xl rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col pt-[var(--safe-area-inset-top)] pb-[var(--safe-area-inset-bottom)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="p-8 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-100">
                <Megaphone className="w-6 h-6 text-[#6d28d9]" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  Broadcast Update <Sparkles className="w-4 h-4 text-[#6d28d9] fill-[#6d28d9]" />
                </h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Official Campus Alert</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              aria-label="Close modality"
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Title</label>
              <input 
                type="text"
                placeholder="e.g. Exam Timetable Released"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-[#6d28d9] focus:ring-4 focus:ring-purple-500/5 transition-all font-bold text-slate-800 placeholder:text-slate-300"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Content</label>
              <textarea 
                rows={4}
                placeholder="What's happening? Provide more details here..."
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-[#6d28d9] focus:ring-4 focus:ring-purple-500/5 transition-all font-medium text-slate-600 placeholder:text-slate-300 resize-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Attachment</label>
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => document.getElementById('announcement-image')?.click()}
                >
                  <div className="absolute inset-0 bg-purple-500/5 blur-lg opacity-0 group-hover:opacity-100 transition-all"></div>
                  <div className="relative flex items-center gap-3 px-6 py-4 bg-white border border-slate-100 rounded-2xl group-hover:border-purple-200 transition-all">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-[#6d28d9]" />
                    )}
                    <span className="text-sm font-bold text-slate-500 group-hover:text-slate-800">
                      {image ? image.name : 'Append Visual'}
                    </span>
                  </div>
                  <input 
                    id="announcement-image"
                    type="file"
                    accept="image/*"
                    aria-label="Upload announcement image"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              <div className="w-auto">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Status</label>
                <button
                  type="button"
                  onClick={() => setIsPinned(!isPinned)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all font-black uppercase tracking-widest text-[10px] ${
                    isPinned 
                    ? 'bg-purple-100 border-[#6d28d9] text-[#6d28d9]' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-purple-100 hover:text-[#6d28d9]'
                  }`}
                >
                  <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-[#6d28d9]' : ''}`} />
                  {isPinned ? 'Pinned' : 'Highlight'}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-[#6d28d9] hover:bg-[#5b21b6] text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Transmitting...
                  </>
                ) : (
                  <>
                    <Megaphone className="w-4 h-4 fill-current" />
                    Broadcast Now
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAnnouncementModal;
