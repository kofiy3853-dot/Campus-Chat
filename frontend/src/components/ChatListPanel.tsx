import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Plus, Users, MessageSquare } from 'lucide-react';
import api from '../services/api';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import Skeleton from './Skeleton';
import UserSearchModal from './UserSearchModal';
import NotificationCenter from './NotificationCenter';
import { getMediaUrl } from '../utils/imageUrl';
import CreateGroupModal from './CreateGroupModal';

interface ChatListPanelProps {
  className?: string;
}

const ChatListPanel: React.FC<ChatListPanelProps> = ({ className }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const endpoint = activeTab === 'chats' ? '/api/chat/conversations' : '/api/groups';
        const response = await api.get(endpoint);
        setItems(response.data);
      } catch (err) {
        console.error('Failed to fetch chat list. This may be due to an expired session or network issue:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user, activeTab]);

  const filteredItems = items.filter((item: any) => {
    const name = activeTab === 'chats' 
      ? item.participants?.find((p: any) => p._id !== user?._id)?.name 
      : item.group_name;
    return name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className={clsx("w-full md:w-80 bg-white flex flex-col border-r border-gray-100 h-full p-6 space-y-6 pb-20 md:pb-6", className)}>
        <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32 bg-gray-50" />
            <Skeleton className="h-10 w-10 bg-gray-50" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl bg-gray-50" />
        <div className="space-y-4 pt-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex gap-4 p-2">
                    <Skeleton variant="circle" className="w-12 h-12 shrink-0 bg-gray-50" />
                    <div className="flex-1 space-y-2 py-1">
                        <Skeleton className="h-4 w-3/4 bg-gray-50" />
                        <Skeleton className="h-3 w-1/2 bg-gray-50" />
                    </div>
                </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("w-full md:w-80 bg-white flex flex-col border-r border-gray-100 h-full", className)}>
      {/* Header */}
      <div className="p-4 md:p-6 flex flex-col gap-3 md:gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold text-gray-800 tracking-tight">Messages</h2>
          <div className="flex gap-2 items-center">
            <NotificationCenter />
            <button 
              onClick={() => {
                if (activeTab === 'groups') {
                  setIsCreateGroupOpen(true);
                } else {
                  setIsSearchOpen(true);
                }
              }}
              title={activeTab === 'groups' ? "Create Group" : "New Chat"} 
              className="p-1.5 md:p-2 bg-gray-50 border border-gray-100 rounded-xl text-sky-500 hover:bg-gray-100 shadow-sm transition-colors"
            >
              <Plus className="w-5 h-5 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100">
          <button
            onClick={() => setActiveTab('chats')}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-1.5 md:py-2 px-3 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all",
              activeTab === 'chats' 
                ? "bg-white text-sky-500 shadow-sm" 
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Directs
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-1.5 md:py-2 px-3 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all",
              activeTab === 'groups' 
                ? "bg-white text-sky-500 shadow-sm" 
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Groups
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl py-2.5 md:py-3 pl-10 md:pl-11 pr-4 text-xs md:text-sm text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40 outline-none transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 md:px-3 pb-24 md:pb-6 space-y-0.5 md:space-y-1 scrollbar-hide">
        {filteredItems.map((item: any) => {
          const isGroup = activeTab === 'groups';
          const participants = item.participants || [];
          const otherParticipant = isGroup ? null : participants.find((p: any) => p?._id !== user?._id);
          const name = isGroup ? item.group_name : (otherParticipant?.name || 'Unknown User');
          const avatar = isGroup ? null : otherParticipant?.profile_picture;
          const status = isGroup ? null : otherParticipant?.status;

          if (!item._id) return null;

          return (
            <NavLink
              key={item._id}
              to={isGroup ? `/dashboard/groups/${item._id}` : `/dashboard/chat/${item._id}`}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 md:gap-4 p-2.5 md:p-4 rounded-xl md:rounded-2xl group relative transition-colors",
                isActive 
                  ? "bg-sky-50 shadow-sm" 
                  : "hover:bg-gray-50"
              )}
            >
              <div className="relative shrink-0">
                {isGroup ? (
                   <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-sky-50 flex items-center justify-center text-base md:text-lg font-bold text-sky-500 border border-sky-100">
                    {name?.[0] || '?'}
                  </div>
                ) : (
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-gray-200 bg-gray-100">
                      <img 
                        src={getMediaUrl(otherParticipant?.profile_picture) || `https://ui-avatars.com/api/?name=${otherParticipant?.name}`} 
                        alt={otherParticipant?.name} 
                        className="w-full h-full object-cover" 
                      />
                  </div>
                )}
                {status === 'online' && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-[2.5px] md:border-[3px] border-white"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5 md:mb-1">
                  <h4 className={clsx(
                    "font-bold truncate text-sm md:text-base text-gray-800"
                  )}>{name}</h4>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {item.last_message_time ? new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500 truncate leading-snug">
                    {item.last_message?.message_text || (isGroup ? `${item.members?.length || 0} members` : 'Start a conversation')}
                  </p>
                  {item.unread_count > 0 && (
                    <span className="bg-sky-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg shadow-sky-500/20">
                      {item.unread_count}
                    </span>
                  )}
                </div>
              </div>

              {/* Active Indicator Bar Overlay */}
              <div className={clsx(
                "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sky-400 rounded-r-full opacity-0",
                "group-[.active]:opacity-100"
              )} />
            </NavLink>
          );
        })}
      </div>
      
      <UserSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />

      <CreateGroupModal 
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />
    </div>
  );
};

export default ChatListPanel;
