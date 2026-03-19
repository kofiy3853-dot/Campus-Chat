import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Search, Plus, Tag, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import MarketplaceCard from '../components/MarketplaceCard';
const MarketplaceCompose = React.lazy(() => import('../components/MarketplaceCompose'));
import Skeleton from '../components/Skeleton';
import { clsx } from 'clsx';
import { useSocket } from '../context/SocketContext';

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const CATEGORIES = ['All', 'Electronics', 'Books', 'Furniture', 'Clothing', 'Services', 'Other'];

const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Debounce search query to reduce API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeCategory !== 'All') params.append('category', activeCategory);
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
      
      const { data } = await api.get(`/api/marketplace?${params.toString()}`);
      setItems(data);
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeCategory, debouncedSearchQuery]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_marketplace_item', (newItem: any) => {
      // Check if it matches active category
      if (activeCategory !== 'All' && newItem.category !== activeCategory) return;
      
      setItems(prev => {
        if (prev.find(i => i._id === newItem._id)) return prev;
        return [newItem, ...prev];
      });
    });

    socket.on('marketplace_item_removed', (data: { itemId: string }) => {
      setItems(prev => prev.filter(i => i._id !== data.itemId));
    });

    return () => {
      socket.off('new_marketplace_item');
      socket.off('marketplace_item_removed');
    };
  }, [socket, activeCategory]);

  const handleDelete = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item._id !== itemId));
    // Optionally call API to delete from backend
    // api.delete(`/api/marketplace/${itemId}`).catch(err => {
    //   console.error('Error deleting item:', err);
    // });
  };

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
    <div className="flex flex-col h-full bg-[#FCFAFF] dark:bg-slate-900 relative">
      {/* Header */}
      <header className="sticky top-0 bg-[#FCFAFF]/95 dark:bg-slate-900/90 backdrop-blur-xl border-b border-[#F3E8FF] dark:border-slate-800 px-4 py-4 md:px-6 md:py-6 z-30">
        <div className="max-w-6xl mx-auto w-full">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h1 className="text-xl md:text-2xl font-black text-[#4F23C0] dark:text-purple-400 tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-[#4F23C0] dark:text-purple-400 fill-[#4F23C0] dark:fill-purple-400" /> 
              CampusMarket
            </h1>
            <div className="flex items-center gap-4">
              <button className="text-slate-400 hover:text-[#4F23C0] transition-colors p-1" aria-label="Search">
                 <Search className="w-5 h-5" />
              </button>
              <button className="relative text-[#4F23C0] hover:text-[#6A35FF] transition-colors p-1" aria-label="Cart">
                 <ShoppingBag className="w-5 h-5" />
                 <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#6A35FF] rounded-full border-2 border-white dark:border-slate-900"></span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative group">
              <div className="relative flex items-center bg-[#F3E8FF] dark:bg-slate-800/50 rounded-full px-5 py-3 shadow-inner group-focus-within:ring-2 ring-[#6A35FF]/20 transition-all duration-300">
                <Search className="w-4 h-4 mr-3 text-[#B092FA]" />
                <input 
                  type="text" 
                  placeholder="what are you looking for today?"
                  className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-[#4F23C0] dark:text-purple-300 placeholder:text-[#B092FA]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Category Pills (Unified Mobile & Desktop) */}
            <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
              {CATEGORIES.map(cat => (
                 <button
                   key={cat}
                   onClick={() => setActiveCategory(cat)}
                   className={clsx(
                     "px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300",
                     activeCategory === cat 
                      ? "bg-[#6A35FF] text-white shadow-md shadow-[#6A35FF]/30" 
                      : "bg-[#FFFFFF] dark:bg-slate-800 text-[#6A35FF] dark:text-purple-400 border border-[#F3E8FF] dark:border-slate-700 hover:bg-[#F3E8FF] dark:hover:bg-slate-700"
                   )}
                 >
                   {cat === 'All' ? 'All Items' : cat}
                 </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto px-4 py-6 md:px-6 md:py-8 layout-content">
        <div className="max-w-6xl mx-auto pb-32">
          
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
                    onDelete={handleDelete}
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
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button for Post Item */}
      <button
        onClick={() => setIsComposeOpen(true)}
        className="absolute bottom-24 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-[#6A35FF] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#6A35FF]/40 hover:scale-105 active:scale-95 transition-all z-40"
        aria-label="Post Item"
      >
        <Plus className="w-6 h-6" />
      </button>

      <React.Suspense fallback={<div className="animate-pulse bg-slate-100 h-96 rounded-[2.5rem]" />}>
        <MarketplaceCompose 
          isOpen={isComposeOpen} 
          onClose={() => setIsComposeOpen(false)} 
          onSuccess={fetchItems}
        />
      </React.Suspense>

      </div>
  );
};

export default MarketplacePage;
