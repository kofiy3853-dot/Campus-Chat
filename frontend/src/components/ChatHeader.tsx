import React from 'react';
import { Phone, Video, MoreVertical, Search, Users, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ChatHeaderProps {
  user: any;
  isTyping: boolean;
  onSearchToggle?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ user, isTyping, onSearchToggle }) => {
  const navigate = useNavigate();

  return (
    <header className="px-4 md:px-8 py-4 border-b border-slate-800/50 bg-[#0A0F1D]/80 backdrop-blur-xl flex items-center justify-between z-10 sticky top-0">
      <div className="flex items-center gap-3 md:gap-4">
        <button 
          onClick={() => navigate('/dashboard')}
          className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl"
          aria-label="Back to chats"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="relative group cursor-pointer">
          <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-slate-800 group-hover:border-primary-500/50 bg-slate-800 flex items-center justify-center">
            {user?.isGroup ? (
                <Users className="w-6 h-6 text-primary-400" />
            ) : (
                <img src={user?.profile_picture || `https://ui-avatars.com/api/?name=${user?.name || 'User'}`} alt="" />
            )}
          </div>
          {user?.status === 'online' && (
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-[3px] border-[#0A0F1D]"></div>
          )}
        </div>
        <div>
          <h3 className="font-bold text-white tracking-tight">{user?.name || (user?.isGroup ? 'Unnamed Group' : 'Unknown User')}</h3>
          <p className="text-[11px] font-medium tracking-wide">
            {isTyping ? (
              <span className="text-primary-400 flex items-center gap-1">
                typing...
              </span>
            ) : (
              <span className={user?.status === 'online' ? "text-green-500/80" : "text-slate-500"}>
                {user?.isGroup ? `${user.memberCount} members` : (user?.status === 'online' ? 'Online' : 'Offline')}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          aria-label="Search in chat" 
          onClick={onSearchToggle}
          className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl"
        >
          <Search className="w-5 h-5" />
        </button>
        <button aria-label="Voice call" className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl"><Phone className="w-5 h-5" /></button>
        <button aria-label="Video call" className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl"><Video className="w-5 h-5" /></button>
        <div className="w-px h-6 bg-slate-800 mx-2"></div>
        <button aria-label="More options" className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl"><MoreVertical className="w-5 h-5" /></button>
      </div>
    </header>
  );
};

export default ChatHeader;
