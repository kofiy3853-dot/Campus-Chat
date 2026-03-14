import React, { useState, useRef } from 'react';
import { X, Camera, Tag, DollarSign, Package, Loader2 } from 'lucide-react';
import api from '../services/api';

interface MarketplaceComposeProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = ['Electronics', 'Books', 'Furniture', 'Clothing', 'Services', 'Other'];

const MarketplaceCompose: React.FC<MarketplaceComposeProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('General');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !price || !image) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', image);
      
      const { data: uploadRes } = await api.post('/api/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await api.post('/api/marketplace', {
        title,
        description,
        price: parseFloat(price),
        image_url: uploadRes.url,
        category
      });

      onSuccess();
      onClose();
      setTitle('');
      setDescription('');
      setPrice('');
      setImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Failed to post item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Post New Item</h2>
          <button 
            onClick={onClose} 
            title="Close modal"
            className="p-2 hover:bg-slate-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="relative group flex flex-col items-center justify-center h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden hover:border-sky-300">
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => { setImage(null); setImagePreview(null); }}
                  title="Remove image"
                  className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full shadow-sm text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload item image"
                className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-sky-500 transition-colors"
              >
                <div className="p-4 rounded-full bg-white shadow-sm ring-1 ring-slate-100" title="Camera icon">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider">Add Item Image</span>
              </button>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" title="Hidden image input" />
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you selling?"
                title="Item title"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/20"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Price"
                  title="Item price"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/20"
                  required
                />
              </div>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  title="Item category"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium appearance-none focus:ring-2 focus:ring-sky-500/20"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your item..."
              title="Item description"
              rows={3}
              className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/20 resize-none"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-sky-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-sky-200 hover:bg-sky-600 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5" /> : 'Create Listing'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MarketplaceCompose;
