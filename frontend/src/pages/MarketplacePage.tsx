import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, Plus, Tag, Ghost, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import MarketplaceCard from '../components/MarketplaceCard';
import MarketplaceCompose from '../components/MarketplaceCompose';
import Skeleton from '../components/Skeleton';
import { clsx } from 'clsx';

const CATEGORIES = ['All', 'Electronics', 'Books', 'Furniture', 'Clothing', 'Services', 'Other'];

const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeCategory !== 'All') params.append('category', activeCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      const { data } = await api.get(`/api/marketplace?${params.toString()}`);
      setItems(data);
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchItems();
    }, 300);
    return () => clearTimeout(timer);
  }, [activeCategory, searchQuery]);

  const handleMessageSeller = async (sellerId: string) => {
    try {
      const { data } = await api.post('/api/chat/conversations', { participantId: sellerId });
      navigate(`/dashboard/chat/${data._id}`);
    } catch (error) {
      console.error('Error starting chat with seller:', error);
      alert('Could not open chat with seller.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-6 z-30">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                Marketplace <ShoppingBag className="w-5 h-5 text-sky-500 fill-sky-500" />
              </h1>
              <p className="text-sm text-slate-400 font-medium">Find deals from students on campus</p>
            </div>
            <button 
              onClick={() => setIsComposeOpen(true)}
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-sky-500 hover:shadow-sky-200 hover:-translate-y-1 transition-all"
            >
              <Plus className="w-4 h-4" /> Post Item
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative group flex-1">
              <div className="absolute inset-0 bg-sky-500/5 blur-xl group-focus-within:blur-2xl transition-all rounded-3xl opacity-0 group-focus-within:opacity-100"></div>
              <div className="relative flex items-center bg-white border border-slate-100 rounded-[2rem] px-6 py-4 shadow-sm group-focus-within:border-sky-200 transition-all duration-300">
                <Search className="w-6 h-6 mr-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search for books, tech, clothes..."
                  className="flex-1 bg-transparent border-none outline-none text-base font-medium text-slate-700 placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Categories Mobile */}
            <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1 md:hidden">
              {CATEGORIES.map(cat => (
                 <button
                   key={cat}
                   onClick={() => setActiveCategory(cat)}
                   className={clsx(
                     "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap border transition-all",
                     activeCategory === cat ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-400 border-slate-100"
                   )}
                 >
                   {cat}
                 </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto px-6 py-8">
        <div className="max-w-6xl mx-auto pb-32">
          {/* Categories Desktop */}
          <div className="hidden md:flex items-center gap-3 mb-8 overflow-x-auto no-scrollbar py-1">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center border border-sky-100 mr-2 shrink-0">
               <Tag className="w-5 h-5 text-sky-500" />
            </div>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={clsx(
                  "px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                  activeCategory === cat ? "bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-200" : "bg-white text-slate-400 border-slate-100 hover:border-sky-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-96 rounded-[2.5rem]" />)}
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map(item => (
                  <MarketplaceCard 
                    key={item._id} 
                    item={item} 
                    onMessageSeller={handleMessageSeller} 
                  />
                ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-[3rem]">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Package className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Empty Shelves</h3>
              <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto mt-2">No items found in this category. Why not be the first to post something?</p>
              <button 
                onClick={() => setIsComposeOpen(true)}
                className="mt-8 px-8 py-4 bg-sky-500 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl shadow-sky-200 hover:bg-sky-600 hover:-translate-y-1 transition-all"
              >
                Post an Item
              </button>
            </div>
          )}
        </div>
      </main>

      <MarketplaceCompose 
        isOpen={isComposeOpen} 
        onClose={() => setIsComposeOpen(false)} 
        onSuccess={fetchItems}
      />

      {/* Mobile Fab */}
      <button 
        onClick={() => setIsComposeOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-sky-500 text-white rounded-2xl shadow-xl shadow-sky-500/20 flex items-center justify-center md:hidden z-40 active:scale-90 transition-transform"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
};

export default MarketplacePage;
