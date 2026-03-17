import React, { useState } from 'react';
import { X, Image as ImageIcon, Loader2, Megaphone, Send } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: string;
  onSuccess: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, clubId, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'post' | 'announcement'>('post');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      showToast('error', 'Required Fields', 'Please fill in the title and content');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('type', type);
    if (image) formData.append('image', image);

    try {
      await api.post(`/api/clubs/${clubId}/posts`, formData);
      showToast('success', 'Published!', `Your ${type} has been shared with the community.`);
      onSuccess();
      onClose();
      // Reset form
      setTitle('');
      setContent('');
      setType('post');
      setImage(null);
    } catch (error: any) {
      showToast('error', 'Failed to Post', error.response?.data?.message || 'Something went wrong');
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
              <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white">
                <Megaphone className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Create Club Update</h2>
            </div>
            <button 
              onClick={onClose}
              title="Close"
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-100">
              <button
                type="button"
                onClick={() => setType('post')}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  type === 'post' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Standard Post
              </button>
              <button
                type="button"
                onClick={() => setType('announcement')}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  type === 'announcement' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Announcement
              </button>
            </div>

            <div className="space-y-4">
              <input 
                type="text"
                placeholder="Ex. Exciting News for Next Week!"
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-green-500 focus:bg-white font-bold transition-all"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea 
                placeholder="Share the details with your community..."
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-green-500 focus:bg-white font-medium min-h-[150px] transition-all resize-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <input 
                  type="file" 
                  id="post-image"
                  className="hidden"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  accept="image/*"
                />
                <label 
                  htmlFor="post-image"
                  className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-all group"
                >
                  <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-green-500" />
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-green-600">
                    {image ? image.name : 'Attach Image'}
                  </span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-slate-200"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Publish Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
