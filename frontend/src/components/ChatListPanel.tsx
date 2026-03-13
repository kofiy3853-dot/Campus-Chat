import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Plus, Users, MessageSquare } from 'lucide-react';
import api from '../services/api';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import Skeleton from './Skeleton';
import UserSearchModal from './UserSearchModal';
import NotificationCenter from './NotificationCenter';

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
      <div className={clsx("w-full md:w-80 bg-slate-950 flex flex-col border-r border-slate-800/50 h-full p-6 space-y-6 pb-20 md:pb-6", className)}>
        <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-10" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="space-y-4 pt-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex gap-4 p-2">
                    <Skeleton variant="circle" className="w-12 h-12 shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("w-full md:w-80 bg-slate-950 flex flex-col border-r border-slate-800/50 h-full", className)}>
      {/* Header */}
      <div className="p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">Messages</h2>
          <div className="flex gap-2 items-center">
            <NotificationCenter />
            <button 
              onClick={() => setIsSearchOpen(true)}
              title="New Chat" 
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-primary-500 hover:bg-slate-800 shadow-sm"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-900/50 rounded-2xl border border-slate-800/50">
          <button
            onClick={() => setActiveTab('chats')}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-medium",
              activeTab === 'chats' 
                ? "bg-slate-800 text-primary-400 shadow-sm" 
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Directs
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-medium",
              activeTab === 'groups' 
                ? "bg-slate-800 text-primary-400 shadow-sm" 
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Users className="w-4 h-4" />
            Groups
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800/50 rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-300 placeholder:text-slate-600 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/40 outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-24 md:pb-6 space-y-1 scrollbar-hide">
        {filteredItems.map((item: any) => {
          const isGroup = activeTab === 'groups';
          const otherParticipant = isGroup ? null : item.participants?.find((p: any) => p._id !== user?._id);
          const name = isGroup ? item.group_name : otherParticipant?.name;
          const avatar = isGroup ? null : otherParticipant?.profile_picture;
          const status = isGroup ? null : otherParticipant?.status;

          return (
            <NavLink
              key={item._id}
              to={isGroup ? `/dashboard/groups/${item._id}` : `/dashboard/chat/${item._id}`}
              className={({ isActive }) => clsx(
                "flex items-center gap-4 p-4 rounded-2xl group relative",
                isActive 
                  ? "bg-primary-500/10 shadow-sm" 
                  : "hover:bg-slate-900/50"
              )}
            >
              <div className="relative shrink-0">
                {isGroup ? (
                   <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 flex items-center justify-center text-lg font-bold text-primary-400 border border-primary-500/20">
                    {name?.[0] || '?'}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-800 group-hover:border-slate-700 bg-slate-800">
                    <img src={avatar || `https://ui-avatars.com/api/?name=${name || 'User'}`} alt={name || 'User'} />
                  </div>
                )}
                {status === 'online' && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-[3px] border-slate-950"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className={clsx(
                    "font-bold truncate",
                    "text-slate-200 group-hover:text-white"
                  )}>{name}</h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {item.last_message_time ? new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500 truncate leading-snug">
                    {item.last_message?.message_text || (isGroup ? `${item.members?.length || 0} members` : 'Start a conversation')}
                  </p>
                  {item.unread_count > 0 && (
                    <span className="bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg shadow-primary-500/20">
                      {item.unread_count}
                    </span>
                  )}
                </div>
              </div>

              {/* Active Indicator Bar Overlay */}
              <div className={clsx(
                "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] opacity-0",
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
    </div>
  );
};

export default ChatListPanel;
