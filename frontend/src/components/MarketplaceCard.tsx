import React from 'react';
import { MessageSquare, Trash2, Heart } from 'lucide-react';
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
    <div className="market-card bg-white dark:bg-slate-800 rounded-[1.5rem] p-3 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:shadow-[#6A35FF]/10 transition-all duration-300 flex flex-col h-full">
      <div className="relative h-[200px] rounded-2xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-900 group">
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
        
        {/* Heart Icon (Top Right) */}
        <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors z-10" aria-label="Favorite">
          <Heart className="w-4 h-4 text-slate-700 hover:text-red-500 hover:fill-red-500 transition-colors" />
        </button>

        {/* Price Tag (Bottom Left) */}
        <div className="absolute bottom-3 left-3 px-3 py-1 bg-[#4F23C0] text-white rounded-full text-xs font-black shadow-lg z-10">
          ₵{item.price}
        </div>
      </div>
      
      <div className="flex flex-col flex-1 px-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-base font-black text-slate-800 dark:text-slate-200 truncate flex-1">
            {item.title}
          </h3>
          <span className="shrink-0 text-[9px] font-black uppercase tracking-widest bg-[#E8F8EE] text-[#00A843] dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-md">
            {item.condition || 'NEW'}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-4 mt-auto">
          <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-100 shrink-0">
            <SafeImage 
              src={item.sellerId?.profile_picture} 
              alt={item.sellerId?.name} 
              fallback={`https://ui-avatars.com/api/?name=${item.sellerId?.name}`}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
            {item.sellerId?.name || 'Unknown'}
          </span>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          {user?._id === item.sellerId?._id ? (
            <>
              <button 
                onClick={() => { /* Edit functionality to be connected if available */ console.log("Edit clicked"); }}
                className="flex-[2] py-2.5 bg-white dark:bg-slate-800 text-[#6A35FF] dark:text-purple-400 border border-[#6A35FF] dark:border-purple-400 rounded-[0.8rem] text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#F3E8FF] dark:hover:bg-slate-700 transition-all"
              >
                Edit
              </button>
              {onDelete && (
                <button 
                  onClick={() => onDelete?.(item._id)}
                  className="flex-1 py-2.5 bg-[#FF3B30] text-white rounded-[0.8rem] flex items-center justify-center hover:bg-red-600 transition-all shadow-md shadow-red-500/20"
                  aria-label="Delete item"
                  title="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <button 
              onClick={() => onMessageSeller(item.sellerId?._id)}
              className="w-full py-2.5 bg-[#6A35FF] text-white rounded-[0.8rem] text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#4F23C0] transition-all shadow-md shadow-[#6A35FF]/20"
            >
              <MessageSquare className="w-4 h-4 fill-current" /> 
              <span>Contact</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

MarketplaceCard.displayName = 'MarketplaceCard';

export default MarketplaceCard;
