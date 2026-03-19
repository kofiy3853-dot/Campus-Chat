import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus, Users, MessageSquare, Check, CheckCheck, Edit3 } from 'lucide-react';
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
import SafeImage from './SafeImage';

interface ChatListPanelProps {
  className?: string;
}

const ChatListPanel: React.FC<ChatListPanelProps> = ({ className }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch both directs and groups to unify them
      const [directsRes, groupsRes] = await Promise.all([
        api.get('/api/chat/conversations').catch(() => ({ data: [] })),
        api.get('/api/groups').catch(() => ({ data: [] }))
      ]);
      
      const directs = (directsRes.data || []).map((c: any) => ({ ...c, type: 'chat' }));
      const groups = (groupsRes.data || []).map((g: any) => ({ ...g, type: 'group' }));
      
      const unified = [...directs, ...groups].sort((a, b) => {
        const timeA = new Date(a.last_message?.timestamp || a.updatedAt).getTime();
        const timeB = new Date(b.last_message?.timestamp || b.updatedAt).getTime();
        return timeB - timeA;
      });

      setItems(unified);
    } catch (err) {
      console.error('Failed to fetch chat list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (message: any) => {
      setItems(prev => {
        const conversationId = message.conversation_id || message.group_id;
        const index = prev.findIndex(item => item._id === conversationId);
        
        if (index === -1) {
          fetchData();
          return prev;
        }

        const newItems = [...prev];
        const item = { ...newItems[index] };
        const isActive = location.pathname.includes(item._id);
        if (!isActive && message.sender_id?._id !== user._id && message.sender_id !== user._id) {
          item.unread_count = (item.unread_count || 0) + 1;
        }

        item.last_message = message;
        item.last_message_time = message.timestamp;
        newItems.splice(index, 1);
        newItems.unshift(item);
        return newItems;
      });
    };

    socket.on('receive_message', handleNewMessage);
    socket.on('receive_group_message', handleNewMessage);
    return () => {
      socket.off('receive_message', handleNewMessage);
      socket.off('receive_group_message', handleNewMessage);
    };
  }, [socket, user, location.pathname]);

  const filteredItems = useMemo(() => {
    return items.filter((item: any) => {
      const name = item.type === 'chat' 
        ? item.participants?.find((p: any) => p._id !== user?._id)?.name 
        : item.group_name;
      return name?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [items, searchQuery, user?._id]);

  // Extract online individuals and active groups for "Online Now"
  const onlineItems = useMemo(() => {
    const individuals = items
      .filter(item => item.type === 'chat')
      .map(item => item.participants?.find((p: any) => p._id !== user?._id))
      .filter(p => p && p.status === 'online');
    
    // De-duplicate by ID
    const uniqueIndividuals = Array.from(new Map(individuals.map(p => [p._id, p])).values());
    
    // Add groups that are "active" (optional mockup interpretation)
    const activeGroups = items.filter(item => item.type === 'group').slice(0, 2);
    
    return [...uniqueIndividuals, ...activeGroups];
  }, [items, user?._id]);

  if (loading) {
    return (
      <div className={clsx("w-full md:w-96 bg-[#fffbfe] flex flex-col h-full px-6 py-6 space-y-6 pb-24 md:pb-6", className)}>
        <Skeleton className="h-8 w-1/3 bg-purple-50 rounded-lg" />
        <Skeleton className="h-14 w-full rounded-[2rem] bg-purple-50" />
        <div className="flex gap-4 overflow-hidden">
           {[1,2,3,4].map(i => <Skeleton key={i} variant="circle" className="w-16 h-16 shrink-0 bg-purple-50" />)}
        </div>
        <div className="space-y-4 pt-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-[2rem] bg-purple-50" />)}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("w-full md:w-[400px] bg-[#fffbfe] flex flex-col h-full border-r border-purple-50", className)}>
      {/* Header */}
      <div className="p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full border border-purple-100 overflow-hidden bg-white shadow-sm ring-2 ring-purple-50">
                <SafeImage 
                  src={user?.profile_picture} 
                  fallback={`https://ui-avatars.com/api/?name=${user?.name}&background=f3e8ff&color=7c3aed`} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <h2 className="text-2xl font-black text-[#331c61] tracking-tight">Messages</h2>
          </div>
          <button 
            onClick={() => setIsSearchOpen(true)}
            aria-label="New Message"
            title="New Message"
            className="p-2.5 bg-white border border-purple-50 rounded-xl text-[#7c3aed] hover:bg-purple-50 shadow-sm transition-all"
          >
            <Edit3 className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#c084fc]" />
          <input
            type="text"
            placeholder="Search students or study groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f3e8ff] rounded-[2rem] py-4 pl-14 pr-6 text-sm font-medium text-[#7c3aed] placeholder:text-[#d8b4fe] focus:ring-2 focus:ring-[#c084fc]/50 outline-none transition-all"
          />
        </div>

        {/* Online Now */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#a78bfa] mb-4">Online Now</h3>
          <div className="flex overflow-x-auto gap-5 no-scrollbar pb-2">
            {onlineItems.length > 0 ? (
              onlineItems.map((item: any, idx) => {
                const isGroup = !!item.group_name;
                const name = isGroup ? item.group_name : item.name;
                const ringColor = idx % 3 === 0 ? 'ring-purple-400' : idx % 3 === 1 ? 'ring-green-400' : 'ring-orange-400';
                
                return (
                  <div 
                    key={item._id} 
                    onClick={() => navigate(isGroup ? `/dashboard/groups/${item._id}` : `/dashboard/chat/${item._id}`)}
                    className="flex flex-col items-center gap-2 cursor-pointer group"
                  >
                    <div className={clsx(
                      "w-16 h-16 rounded-full p-1 ring-2 transition-all group-hover:scale-105",
                      ringColor
                    )}>
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-slate-100 relative">
                        {isGroup ? (
                          <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                             <Users className="w-6 h-6 text-slate-400" />
                          </div>
                        ) : (
                          <SafeImage 
                            src={item.profile_picture} 
                            fallback={`https://ui-avatars.com/api/?name=${item.name}&background=f1f5f9&color=64748b`}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute bottom-0 right-1 w-4 h-4 bg-green-500 rounded-full border-[3px] border-white shadow-sm"></div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-[#7c3aed] transition-colors">{name.split(' ')[0]}</span>
                  </div>
                );
              })
            ) : (
              <div className="py-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">No friends online</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="flex-1 overflow-y-auto px-6 pb-28 md:pb-6 space-y-4 no-scrollbar">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#a78bfa] mb-2">Recent Conversations</h3>
        {filteredItems.map((item: any) => {
          const isGroup = item.type === 'group';
          const otherParticipant = isGroup ? null : item.participants?.find((p: any) => p?._id !== user?._id);
          const name = isGroup ? item.group_name : (otherParticipant?.name || 'Unknown User');
          
          return (
            <NavLink
              key={item._id}
              to={isGroup ? `/dashboard/groups/${item._id}` : `/dashboard/chat/${item._id}`}
              className={({ isActive }) => clsx(
                "flex items-center gap-4 p-5 rounded-[2rem] group relative transition-all duration-300 border border-transparent shadow-[0_4px_20px_rgba(0,0,0,0.02)]",
                isActive 
                  ? "bg-[#f3e8ff] border-purple-100 shadow-purple-500/5" 
                  : "bg-white hover:border-purple-50 hover:shadow-lg"
              )}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden border-2 border-white bg-slate-50 shadow-sm transition-transform group-hover:scale-105">
                  {isGroup ? (
                    <div className="w-full h-full bg-purple-50 flex items-center justify-center">
                       <MessageSquare className="w-8 h-8 text-purple-200" />
                    </div>
                  ) : (
                    <SafeImage 
                      src={otherParticipant?.profile_picture} 
                      fallback={`https://ui-avatars.com/api/?name=${otherParticipant?.name}&background=f8fafc&color=94a3b8`} 
                      className="w-full h-full object-cover" 
                    />
                  )}
                </div>
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-black truncate text-[#331c61] text-base mb-1">
                  {name}
                </h4>
                <p className={clsx(
                  "text-xs truncate leading-snug font-medium",
                  item.unread_count > 0 ? "text-slate-800 font-bold" : "text-slate-400"
                )}>
                  {item.last_message?.message_text || (isGroup ? `${item.members?.length || 0} members` : 'Start a conversation')}
                </p>
              </div>

              {/* Meta */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                  {item.last_message?.timestamp ? new Date(item.last_message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
                {item.unread_count > 0 && (
                  <span className="bg-[#7c3aed] text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full shadow-lg shadow-purple-500/30">
                    {item.unread_count}
                  </span>
                )}
              </div>
            </NavLink>
          );
        })}
      </div>
      
      <UserSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CreateGroupModal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} />
    </div>
  );
};

export default ChatListPanel;
