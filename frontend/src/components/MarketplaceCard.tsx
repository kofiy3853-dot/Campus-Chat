import React from 'react';
import { MessageSquare, Trash2, User, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SafeImage from './SafeImage';

interface MarketplaceCardProps {
  item: any;
  onMessageSeller: (sellerId: string) => void;
  onDelete?: (itemId: string) => void;
}

const MarketplaceCard: React.FC<MarketplaceCardProps> = React.memo(({ item, onMessageSeller, onDelete }) => {
  const { user } = useAuth();

  return (
    <div className="market-card group bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-sky-500/10 transition-all duration-500 flex flex-col h-full">
      <div className="relative h-[180px] overflow-hidden">
        {/* Handle multiple images */}
        {Array.isArray(item.image) ? (
          <div className="grid grid-cols-2 gap-1 h-full">
            {item.image.slice(0, 4).map((img: string, index: number) => (
              <div key={index} className="relative overflow-hidden">
                <SafeImage 
                  src={img} 
                  alt={`${item.title} - Image ${index + 1}`} 
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
            ))}
          </div>
        ) : (
          <SafeImage 
            src={item.image} 
            alt={item.title} 
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        )}
        
        {/* Glassmorphism Price Tag */}
        <div className="absolute top-4 right-4 px-4 py-2 bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/40 ring-1 ring-black/5">
          <span className="text-sm font-black text-sky-600">₵{item.price}</span>
        </div>

        {/* Glassmorphism Category Tag */}
        <div className="absolute top-4 left-4">
          <span className="text-[10px] font-black uppercase tracking-widest bg-slate-900/40 backdrop-blur-md text-white px-4 py-1.5 rounded-xl border border-white/20">
            {item.category}
          </span>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      
      <div className="flex flex-col min-w-0 p-6 flex-1 bg-gradient-to-b from-white to-slate-50/30">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm">
            <SafeImage 
              src={item.sellerId?.profile_picture} 
              alt={item.sellerId?.name} 
              fallback={`https://ui-avatars.com/api/?name=${item.sellerId?.name}`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black text-slate-800 truncate leading-none">{item.sellerId?.name}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Seller</span>
          </div>
        </div>

        <h3 className="text-lg font-black text-slate-800 mb-6 truncate group-hover:text-sky-600 transition-colors leading-tight">
          {item.title}
        </h3>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={() => onMessageSeller(item.sellerId?._id)}
            className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-sky-500 transition-all duration-300 shadow-lg shadow-slate-200 hover:shadow-sky-200 active:scale-95 mt-auto"
          >
            <User className="w-4 h-4" /> 
            <span>Contact</span>
          </button>
          
          {/* Delete Button - Show only for item owner */}
          {user?._id === item.sellerId?._id && onDelete && (
            <button 
              onClick={() => onDelete(item._id)}
              className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-red-600 transition-all duration-300 shadow-lg shadow-red-200 active:scale-95 mt-auto"
            >
              <Trash2 className="w-4 h-4" /> 
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

MarketplaceCard.displayName = 'MarketplaceCard';

export default MarketplaceCard;
