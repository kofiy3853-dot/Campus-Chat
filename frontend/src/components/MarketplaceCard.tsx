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
  const isAdmin = user?.role === 'admin';
  const isKofi = user?.email === 'nharnahyhaw19@gmail.com';
  const isSeller = user?._id === (item.sellerId?._id || item.seller_id?._id || item.sellerId || item.seller_id);
  const canDelete = isSeller || isAdmin || isKofi;

  return (
    <div className="market-card bg-white rounded-[2.5rem] shadow-sm border border-purple-50 hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-200 transition-all duration-300 flex flex-col h-full overflow-hidden">
      <div className="relative h-[200px] w-full bg-[#fdfaff] group">
        {/* Handle multiple images or single image_url */}
        {Array.isArray(item.image) && item.image.length > 0 ? (
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
            src={item.image || item.image_url} 
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
        <div className="absolute bottom-4 left-4 px-4 py-2 bg-[#6d28d9] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl z-10 border border-white/20">
          ₵{item.price}
        </div>
      </div>
      
      <div className="flex flex-col flex-1 p-4 pt-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-base font-black text-slate-800 truncate flex-1">
            {item.title}
          </h3>
          <span className="shrink-0 text-[9px] font-black uppercase tracking-widest bg-[#f5eeff] text-[#6d28d9] px-2 py-1 rounded-lg border border-purple-100">
            {item.condition || 'NEW'}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-4 mt-auto">
          <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-100 shrink-0">
            <SafeImage 
              src={item.sellerId?.profile_picture || item.seller_id?.profile_picture} 
              alt={item.sellerId?.name || item.seller_id?.name} 
              fallback={`https://ui-avatars.com/api/?name=${item.sellerId?.name || item.seller_id?.name}`}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs font-bold text-slate-400 truncate">
            {item.sellerId?.name || item.seller_id?.name || 'Unknown'}
          </span>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          {canDelete ? (
            <>
              {isSeller && (
                <button 
                  onClick={() => { /* Edit functionality to be connected if available */ console.log("Edit clicked"); }}
                  className="flex-[2] py-3.5 bg-white text-[#6d28d9] border border-purple-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#f5eeff] transition-all shadow-sm"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button 
                  onClick={() => onDelete?.(item._id)}
                  className="flex-1 py-3.5 bg-rose-500 text-white rounded-2xl flex items-center justify-center hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 active:scale-95"
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
              className="w-full py-4 bg-[#6d28d9] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#5b21b6] transition-all shadow-xl shadow-purple-500/20 active:scale-95"
            >
              <MessageSquare className="w-4 h-4 fill-current" /> 
              <span>Contact Seller</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

MarketplaceCard.displayName = 'MarketplaceCard';

export default MarketplaceCard;
