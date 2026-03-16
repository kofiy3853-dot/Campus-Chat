import React from 'react';
import { ShoppingBag, MessageSquare, Tag, User } from 'lucide-react';
import SafeImage from './SafeImage';
import { clsx } from 'clsx';

interface MarketplaceCardProps {
  item: any;
  onMessageSeller: (sellerId: string) => void;
}

const MarketplaceCard: React.FC<MarketplaceCardProps> = ({ item, onMessageSeller }) => {
  return (
    <div className="market-card group bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-sky-500/10 transition-all duration-500 flex flex-col h-full">
      <div className="relative h-[180px] overflow-hidden">
        <SafeImage 
          src={item.image} 
          alt={item.title} 
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Glassmorphism Price Tag */}
        <div className="absolute top-4 right-4 px-4 py-2 bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/40 ring-1 ring-black/5">
          <span className="text-sm font-black text-sky-600">₵{item.price}</span>
        </div>

        {/* glassmorphism Category Tag */}
        <div className="absolute top-4 left-4">
          <span className="text-[10px] font-black uppercase tracking-widest bg-slate-900/40 backdrop-blur-md text-white px-4 py-1.5 rounded-xl border border-white/20">
            {item.category}
          </span>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      
      <div className="p-6 flex flex-col flex-1 bg-gradient-to-b from-white to-slate-50/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 bg-sky-500 rounded-full blur-sm opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative w-full h-full rounded-full border-2 border-white overflow-hidden shadow-sm">
               <SafeImage 
                 src={item.sellerId?.profile_picture} 
                 alt={item.sellerId?.name} 
                 fallback={`https://ui-avatars.com/api/?name=${item.sellerId?.name}`}
                 className="w-full h-full object-cover"
               />
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-black text-slate-800 truncate leading-none mb-0.5">{item.sellerId?.name}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Seller</span>
          </div>
        </div>

        <h3 className="text-lg font-black text-slate-800 mb-6 truncate group-hover:text-sky-600 transition-colors leading-tight">
          {item.title}
        </h3>
        
        <button 
          onClick={() => onMessageSeller(item.sellerId?._id)}
          className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2.5 hover:bg-sky-500 transition-all duration-300 shadow-lg shadow-slate-200 hover:shadow-sky-200 active:scale-95 mt-auto"
        >
          <MessageSquare className="w-4 h-4 stroke-[3px]" /> 
          <span>Message Seller</span>
        </button>
      </div>
    </div>
  );
};

export default MarketplaceCard;
