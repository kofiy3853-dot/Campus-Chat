import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Search, Plus, Users, MessageSquare, Check, CheckCheck } from 'lucide-react';
import api from '../services/api';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { db } from '../db/db';
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
  const { socket } = useSocket();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  const fetchData = async () => {
    try {
      // Load from local DB first
      const collection = db.conversations.where('type').equals(activeTab === 'chats' ? 'chat' : 'group');
      const localItems = await collection.toArray();
      localItems.sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());
      if (localItems.length > 0) {
        setItems(localItems);
        setLoading(false);
      }

      const endpoint = activeTab === 'chats' ? '/api/chat/conversations' : '/api/groups';
      const response = await api.get(endpoint);
      const data = response.data;
      setItems(data);

      // Cache to local DB
      await db.transaction('rw', db.conversations, async () => {
        // Find existing items of THIS type and update/add
        await db.conversations.where('type').equals(activeTab === 'chats' ? 'chat' : 'group').delete();
        await db.conversations.bulkPut(data.map((item: any) => ({
          ...item,
          type: activeTab === 'chats' ? 'chat' : 'group',
          last_message_time: item.last_message?.timestamp || item.updatedAt
        })));
      });
    } catch (err) {
      console.error('Failed to fetch chat list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user, activeTab]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (message: any) => {
      setItems(prev => {
        const conversationId = message.conversation_id || message.group_id;
        const index = prev.findIndex(item => item._id === conversationId);
        
        if (index === -1) {
          // New conversation not in list, refetch entire list to get metadata
          fetchData();
          return prev;
        }

        const newItems = [...prev];
        const item = { ...newItems[index] };
        
        // Update unread count if we are not currently in this conversation
        const isActive = location.pathname.includes(item._id);
        if (!isActive && message.sender_id?._id !== user._id && message.sender_id !== user._id) {
          item.unread_count = (item.unread_count || 0) + 1;
        }

        item.last_message = message;
        item.last_message_time = message.timestamp;

        // Move to top
        newItems.splice(index, 1);
        newItems.unshift(item);
        return newItems;
      });
    };

    const handleStatusChange = (data: any) => {
      setItems((prev: any[]) => prev.map(item => {
        if (activeTab === 'chats') {
          const participants = item.participants?.map((p: any) => 
            p._id === data.userId ? { ...p, status: data.status, last_seen: data.last_seen } : p
          );
          return { ...item, participants };
        }
        return item;
      }));
    };

    const handleNotification = (notification: any) => {
      if (notification.type !== 'message') return;

      setItems(prev => {
        const conversationId = notification.data?.conversation_id || notification.data?.group_id;
        const index = prev.findIndex(item => item._id === conversationId);
        
        if (index === -1) {
          fetchData(); // New conversation, refresh list
          return prev;
        }

        const newItems = [...prev];
        const item = { ...newItems[index] };
        
        // Update unread count if we are not currently in this conversation
        const isActive = location.pathname.includes(item._id);
        if (!isActive) {
          item.unread_count = (item.unread_count || 0) + 1;
        }

        // Optimistically update last message preview info
        item.last_message = {
          message_text: notification.body,
          timestamp: new Date().toISOString(),
          sender_id: notification.sender_id?._id || notification.sender_id
        };
        item.last_message_time = item.last_message.timestamp;

        // Move to top
        newItems.splice(index, 1);
        newItems.unshift(item);
        return newItems;
      });
    };

    socket.on('receive_message', handleNewMessage);
    socket.on('receive_group_message', handleNewMessage);
    socket.on('user_status_change', handleStatusChange);
    socket.on('notification', handleNotification);

    return () => {
      socket.off('receive_message', handleNewMessage);
      socket.off('receive_group_message', handleNewMessage);
      socket.off('user_status_change', handleStatusChange);
      socket.off('notification', handleNotification);
    };
  }, [socket, user, location.pathname, activeTab]);

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
                "flex items-center gap-4 p-4 rounded-2xl group relative transition-all duration-200 border border-transparent",
                isActive 
                  ? "bg-sky-50/80 shadow-sm border-sky-100/50" 
                  : "hover:bg-gray-50/80"
              )}
            >
              {/* Left Column: Avatar */}
              <div className="relative shrink-0">
                {isGroup ? (
                   <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-sky-200">
                    {name?.[0] || '?'}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white group-hover:border-sky-100 bg-gray-100 shadow-md transition-colors">
                      <img 
                        src={getMediaUrl(otherParticipant?.profile_picture) || `https://ui-avatars.com/api/?name=${otherParticipant?.name}`} 
                        alt={otherParticipant?.name} 
                        className="w-full h-full object-cover" 
                      />
                  </div>
                )}
                {status === 'online' && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-3 border-white shadow-sm animate-pulse-slow"></div>
                )}
              </div>

              {/* Middle Column: Chat Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold truncate text-base text-gray-800 mb-1 group-hover:text-sky-600 transition-colors">
                  {name}
                </h4>
                <div className="flex items-center gap-1.5 min-w-0">
                  {item.last_message && (item.last_message.sender_id?._id === user?._id || item.last_message.sender_id === user?._id) && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] font-bold text-sky-500/80 uppercase tracking-tight">You:</span>
                      {item.last_message.delivery_status === 'read' ? (
                        <CheckCheck className="w-3 h-3 text-sky-400" strokeWidth={3} />
                      ) : (
                        <Check className="w-3 h-3 text-gray-300" strokeWidth={3} />
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 truncate leading-snug font-medium">
                    {item.last_message?.message_text || (isGroup ? `${item.members?.length || 0} members` : 'Start a conversation')}
                  </p>
                </div>
              </div>

              {/* Right Column: Meta */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {item.last_message_time ? new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
                {item.unread_count > 0 && (
                  <span className="bg-sky-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg min-w-[20px] text-center shadow-lg shadow-sky-500/30 animate-in fade-in zoom-in duration-300">
                    {item.unread_count}
                  </span>
                )}
              </div>

              {/* Active Indicator */}
              <div className={clsx(
                "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-sky-500 rounded-r-full transition-all duration-300",
                "opacity-0 scale-y-50 group-[.active]:opacity-100 group-[.active]:scale-y-100"
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
