import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Search, Plus, Tag, Package } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
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

  // Handle ?compose=true query param
  const location = useLocation();
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('compose') === 'true') {
      setIsComposeOpen(true);
      // Optional: clear the query param after opening to avoid re-opening on manual refresh
      // window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search]);

  const handleCloseCompose = () => {
    setIsComposeOpen(false);
    // Remove the ?compose=true from the URL when closing the modal
    if (location.search.includes('compose=true')) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.delete('compose');
      const newSearch = searchParams.toString();
      navigate(location.pathname + (newSearch ? `?${newSearch}` : ''), { replace: true });
    }
  };

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

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    try {
      // Optimistic upate
      setItems((prev) => prev.filter((item) => item._id !== itemId));
      
      await api.delete(`/api/marketplace/${itemId}`);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
      // Revert optimistic update on failure (optional, but good for UX)
      fetchItems();
    }
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
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-purple-50 px-4 py-4 md:px-6 md:py-6 z-30">
        <div className="max-w-6xl mx-auto w-full">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h1 className="text-xl md:text-2xl font-black text-[#6d28d9] tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-[#6d28d9] fill-[#6d28d9]" /> 
              CampusMarket
            </h1>
            <div className="flex items-center gap-4">
              <button className="text-slate-400 hover:text-[#6d28d9] transition-colors p-1" aria-label="Search">
                 <Search className="w-5 h-5" />
              </button>
              <button className="relative text-[#6d28d9] hover:text-[#5b21b6] transition-colors p-1" aria-label="Cart">
                 <ShoppingBag className="w-5 h-5" />
                 <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#6d28d9] rounded-full border-2 border-white"></span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative group">
              <div className="relative flex items-center bg-[#f5eeff] rounded-full px-5 py-3 shadow-inner group-focus-within:ring-2 ring-purple-500/20 transition-all duration-300">
                <Search className="w-4 h-4 mr-3 text-[#a78bfa]" />
                <input 
                  type="text" 
                  placeholder="what are you looking for today?"
                  className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-[#6d28d9] placeholder:text-[#a78bfa]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Category Pills (Unified Mobile & Desktop) */}
              {CATEGORIES.map(cat => (
                 <button
                   key={cat}
                   onClick={() => setActiveCategory(cat)}
                   className={clsx(
                     "px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 border",
                     activeCategory === cat 
                      ? "bg-[#6d28d9] border-[#6d28d9] text-white shadow-lg shadow-purple-200/50" 
                      : "bg-white text-[#6d28d9] border-purple-100 hover:bg-[#f5eeff]"
                   )}
                 >
                   {cat === 'All' ? 'All Items' : cat}
                 </button>
              ))}
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

      <React.Suspense fallback={<div className="animate-pulse bg-slate-100 h-96 rounded-[2.5rem]" />}>
        <MarketplaceCompose 
          isOpen={isComposeOpen} 
          onClose={handleCloseCompose} 
          onSuccess={fetchItems}
        />
      </React.Suspense>

      </div>
  );
};

export default MarketplacePage;
