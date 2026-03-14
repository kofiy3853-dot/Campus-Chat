import React from 'react';
import { Phone, Video, MoreVertical, Search, Users, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';
import { getMediaUrl } from '../utils/imageUrl';
import { formatLastSeen } from '../utils/time';

interface ChatHeaderProps {
  user: any;
  isTyping: boolean;
  onSearchToggle?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ user, isTyping, onSearchToggle }) => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 flex items-center justify-between z-50">
      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={() => navigate('/dashboard')}
          className="md:hidden p-1.5 -ml-1 text-gray-400 hover:text-sky-500 hover:bg-gray-50 rounded-xl transition-none"
          aria-label="Back to chats"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="relative group cursor-pointer">
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl overflow-hidden border-2 border-gray-100 group-hover:border-sky-300 bg-gray-50 flex items-center justify-center transition-none">
            {user?.isGroup ? (
                <Users className="w-5 h-5 md:w-6 md:h-6 text-sky-400" />
            ) : (
                <img src={getMediaUrl(user?.profile_picture) || `https://ui-avatars.com/api/?name=${user?.name || 'User'}`} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          {user?.status === 'online' && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-3.5 md:h-3.5 bg-green-500 rounded-full border-[2px] md:border-[3px] border-white"></div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-800 tracking-tight text-sm md:text-base truncate max-w-[120px] md:max-w-none">
            {user?.name || (user?.isGroup ? 'Unnamed Group' : 'Unknown User')}
          </h3>
          <p className="text-[10px] md:text-[11px] font-medium tracking-wide">
            {isTyping ? (
              <span className="text-sky-400 flex items-center gap-1">
                typing...
              </span>
            ) : (
              <span className={user?.status === 'online' ? "text-green-500" : "text-gray-400"}>
                {user?.isGroup 
                  ? `${user.memberCount} members` 
                  : (user?.status === 'online' ? 'Online' : `Last seen ${formatLastSeen(user?.last_seen)}`)}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <NotificationCenter />
        <button 
          aria-label="Search in chat" 
          onClick={onSearchToggle}
          className="p-2 md:p-2.5 text-gray-400 hover:text-sky-500 hover:bg-gray-50 rounded-xl transition-none"
        >
          <Search className="w-4.5 h-4.5 md:w-5 md:h-5" />
        </button>
        <button aria-label="Voice call" className="p-2 md:p-2.5 text-gray-400 hover:text-sky-500 hover:bg-gray-50 rounded-xl hidden md:block transition-none"><Phone className="w-5 h-5" /></button>
        <button aria-label="Video call" className="p-2 md:p-2.5 text-gray-400 hover:text-sky-500 hover:bg-gray-50 rounded-xl hidden md:block transition-none"><Video className="w-5 h-5" /></button>
        <div className="w-px h-6 bg-gray-100 mx-1 md:mx-2 hidden md:block"></div>
        <button aria-label="More options" className="p-2 md:p-2.5 text-gray-400 hover:text-sky-500 hover:bg-gray-50 rounded-xl transition-none"><MoreVertical className="w-4.5 h-4.5 md:w-5 md:h-5" /></button>
      </div>
    </header>
  );
};

export default ChatHeader;
