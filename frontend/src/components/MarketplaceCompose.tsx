import React, { useState, useRef } from 'react';
import { X, Camera, Tag, Package, Plus, Loader2, ShoppingBag } from 'lucide-react';
import api from '../services/api';
import { compressImage } from '../utils/imageCompression';

interface MarketplaceComposeProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = ['Electronics', 'Books', 'Furniture', 'Clothing', 'Services', 'Other'];

const MarketplaceCompose: React.FC<MarketplaceComposeProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Other');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const compressedFile = await compressImage(file);
        newImages.push(compressedFile);
        newPreviews.push(URL.createObjectURL(compressedFile));
      }
    }

    setImages(prev => [...prev, ...newImages]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || images.length === 0) return;

    try {
      setLoading(true);
      
      // Upload all images
      const formData = new FormData();
      formData.append('title', title);
      formData.append('price', price);
      formData.append('category', category);
      
      // Append all images
      images.forEach((image, index) => {
        formData.append(`images`, image);
      });

      const response = await api.post('/api/marketplace', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Reset form state first
      setTitle('');
      setPrice('');
      setImages([]);
      setImagePreviews([]);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Then close modal and refresh list
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Failed to post item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#F3E8FF] dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <h2 className="text-2xl font-black text-[#4F23C0] dark:text-purple-400 tracking-tight flex items-center gap-2">
            <Plus className="w-6 h-6 p-1 bg-[#F3E8FF] dark:bg-purple-900/50 rounded-lg text-[#6A35FF] dark:text-purple-300" />
            Post New Item
          </h2>
          <button 
            onClick={onClose} 
            title="Close modal"
            className="p-2 hover:bg-[#F3E8FF] dark:hover:bg-slate-800 rounded-full transition-all group"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <label className="block text-xs font-black text-[#4F23C0] dark:text-purple-400 uppercase tracking-widest px-1">
              Photos <span className="text-slate-400 font-bold">(up to 5 images)</span>
            </label>
            
            {/* Image Preview Grid */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-[#F3E8FF] dark:border-slate-800">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <div className="flex items-center justify-center w-full">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center py-8 bg-[#FCFAFF] dark:bg-slate-800/50 hover:bg-[#F3E8FF] dark:hover:bg-slate-800 border-2 border-dashed border-[#B092FA]/30 rounded-[2rem] text-[#6A35FF] dark:text-purple-300 transition-all group"
              >
                <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-lg shadow-[#6A35FF]/10 mb-3 group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="font-black text-xs uppercase tracking-widest">Add Photos</span>
                {images.length > 0 && (
                  <span className="mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-tight">({images.length}/5 images)</span>
                )}
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              multiple
              className="hidden"
              title="Upload product images"
              aria-label="Upload product images"
            />
          </div>

          {/* Item Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Title */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-[#4F23C0] dark:text-purple-400 uppercase tracking-widest px-1">
                Title
              </label>
              <div className="relative group">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What are you selling?"
                  className="w-full px-5 py-4 bg-[#F3E8FF]/30 dark:bg-slate-800/50 border border-[#B092FA]/20 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-[#6A35FF]/10 focus:border-[#6A35FF]/40 outline-none text-sm font-semibold text-[#4F23C0] dark:text-purple-300 placeholder:text-[#B092FA]/60 transition-all"
                  required
                />
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-[#4F23C0] dark:text-purple-400 uppercase tracking-widest px-1">
                Price (₵)
              </label>
              <div className="relative group">
                <Tag className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B092FA]" />
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full pl-12 pr-5 py-4 bg-[#F3E8FF]/30 dark:bg-slate-800/50 border border-[#B092FA]/20 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-[#6A35FF]/10 focus:border-[#6A35FF]/40 outline-none text-sm font-semibold text-[#4F23C0] dark:text-purple-300 placeholder:text-[#B092FA]/60 transition-all"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-black text-[#4F23C0] dark:text-purple-400 uppercase tracking-widest px-1">
                Category
              </label>
              <div className="relative group">
                <Package className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B092FA]" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-[#F3E8FF]/30 dark:bg-slate-800/50 border border-[#B092FA]/20 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-[#6A35FF]/10 focus:border-[#6A35FF]/40 outline-none text-sm font-semibold text-[#4F23C0] dark:text-purple-300 appearance-none transition-all"
                  title="Select product category"
                  aria-label="Select product category"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-[#B092FA]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !title || !price || images.length === 0}
            className="w-full py-5 bg-[#6A35FF] hover:bg-[#4F23C0] disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-xs rounded-[1.5rem] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#6A35FF]/30 active:scale-95 mb-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Listing...</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5 fill-current" />
                <span>Publish Listing</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MarketplaceCompose;
