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
    <div className="group bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-sky-500/5 transition-all duration-300 flex flex-col">
      <div className="relative h-48 md:h-56 overflow-hidden">
        <SafeImage 
          src={item.image} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-4 right-4 px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-white/20">
          <span className="text-sm font-black text-sky-500">${item.price}</span>
        </div>
        <div className="absolute top-4 left-4">
          <span className="text-[10px] font-black uppercase tracking-widest bg-slate-800/80 backdrop-blur-md text-white px-3 py-1 rounded-full">
            {item.category}
          </span>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full border border-slate-100 overflow-hidden">
             <SafeImage 
               src={item.sellerId?.profile_picture} 
               alt={item.sellerId?.name} 
               fallback={`https://ui-avatars.com/api/?name=${item.sellerId?.name}`}
               className="w-full h-full object-cover"
             />
          </div>
          <span className="text-[10px] font-bold text-slate-400 truncate">{item.sellerId?.name}</span>
        </div>

        <h3 className="text-lg font-black text-slate-800 mb-6 truncate group-hover:text-sky-500 transition-colors">{item.title}</h3>
        
        <button 
          onClick={() => onMessageSeller(item.sellerId?._id)}
          className="w-full py-3 bg-slate-50 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-sky-500 hover:text-white transition-all shadow-sm active:scale-95 mt-auto"
        >
          <MessageSquare className="w-4 h-4" /> Message Seller
        </button>
      </div>
    </div>
  );
};

export default MarketplaceCard;
