import React, { useState } from 'react';
import { X, Globe, Image as ImageIcon, Loader2, Sparkles, Shield, ShieldCheck, Plus } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { clsx } from 'clsx';

interface CreateClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateClubModal: React.FC<CreateClubModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Social');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const categories = ['Academic', 'Social', 'Cultural', 'Sports', 'Technology', 'Arts', 'Professional', 'Other'];

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
    if (!name || !category || !description) {
      showToast('error', 'Required Fields', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('visibility', visibility);
      if (image) {
        formData.append('profile_image', image);
      }

      await api.post('/api/clubs/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast('success', 'Club Created', `${name} has been successfully launched!`);
      // Reset form
      setName('');
      setCategory('Social');
      setDescription('');
      setVisibility('public');
      setImage(null);
      setImagePreview(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', 'Creation Failed', err.response?.data?.message || 'Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-xl rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col pt-[var(--safe-area-inset-top)] pb-[var(--safe-area-inset-bottom)]">
        <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="p-8 overflow-y-auto scrollbar-hide">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center border border-green-100">
                <Globe className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  Launch a Club <Sparkles className="w-4 h-4 text-green-500 fill-green-500" />
                </h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Start your community journey</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              title="Close modality"
              aria-label="Close modal"
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center mb-8">
              <div 
                className="relative group cursor-pointer"
                onClick={() => document.getElementById('club-image')?.click()}
              >
                <div className="w-24 h-24 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group-hover:border-green-300 transition-all">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300 group-hover:text-green-500 transition-colors" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-slate-100 group-hover:bg-green-500 group-hover:text-white transition-all">
                  <Plus className="w-4 h-4" />
                </div>
                <input 
                  id="club-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  aria-label="Upload club profile image"
                  title="Upload club profile image"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1" htmlFor="club-name-input">Club Name</label>
              <input 
                id="club-name-input"
                type="text"
                placeholder="e.g. Campus Tech Society"
                title="Enter club name"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-green-500 transition-all font-bold text-slate-800 placeholder:text-slate-300"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1" htmlFor="club-category-select">Category</label>
                <select 
                  id="club-category-select"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-green-500 transition-all font-bold text-slate-800 cursor-pointer"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  title="Select club category"
                  aria-label="Select club category"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Visibility</label>
                <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                  <button
                    type="button"
                    onClick={() => setVisibility('public')}
                    className={clsx(
                      "flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all",
                      visibility === 'public' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400"
                    )}
                  >
                    <Shield className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-widest">Public</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility('private')}
                    className={clsx(
                      "flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all",
                      visibility === 'private' ? "bg-white text-amber-600 shadow-sm" : "text-slate-400"
                    )}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-widest">Private</span>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1" htmlFor="club-desc-input">Mission / Description</label>
              <textarea 
                id="club-desc-input"
                rows={4}
                placeholder="What is the goal of this club? What do you do?"
                title="Enter club description"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-green-500 transition-all font-medium text-slate-600 placeholder:text-slate-300 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="pt-4 pb-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-green-600 hover:shadow-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    Create Community
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

export default CreateClubModal;
