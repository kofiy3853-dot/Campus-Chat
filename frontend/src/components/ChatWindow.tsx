import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, MessageSquare, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useUnread } from '../context/UnreadContext';
import api from '../services/api';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import MessageSearch from './MessageSearch';

const ChatWindow = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { setUnread } = useUnread();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [activeMessage, setActiveMessage] = useState<any>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const markAsRead = useCallback(async () => {
    if (!id || id === 'null') return;
    try {
      await api.post(`/api/chat/conversations/${id}/read`);
      socket?.emit('messages_read', { roomId: id, userId: user?._id });
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [id, socket, user?._id]);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSearchResults(null);
      setIsSearchOpen(false);
      const [msgRes, convRes] = await Promise.all([
        api.get(`/api/chat/messages/${id}`),
        api.get(`/api/chat/conversations`)
      ]);
      setMessages(msgRes.data);
      const currentConv = convRes.data.find((c: any) => c._id === id);
      if (!currentConv) {
        throw new Error('Conversation not found');
      }
      setConversation(currentConv);
      markAsRead();
      setUnread(0);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [id, markAsRead]);

  useEffect(() => {
    if (id && id !== 'null') {
      fetchMessages();
    }
  }, [id, fetchMessages]);

  useEffect(() => {
    if (!socket || !id || id === 'null') return;

    const joinRoom = () => socket.emit('join_room', id);
    joinRoom();
    socket.on('connect', joinRoom);

    const messageHandler = (message: any) => {
      const incomingId = String(message._id);
      setMessages(prev => {
        if (prev.some(m => String(m._id) === incomingId)) return prev;
        const newMessages = [...prev, message];
        return newMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      });

      // Mark as read if from someone else
      if (message.sender_id?._id !== user?._id && message.sender_id !== user?._id) {
        markAsRead();
      }
    };

    const typingHandler = (data: any) => {
      if (data.roomId === id && data.userId !== user?._id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const typingStopHandler = (data: any) => {
      if (data.roomId === id) setIsTyping(false);
    };

    const reactionHandler = (data: any) => {
      if (data.roomId === id) {
        setMessages(prev => prev.map(m => 
          m._id === data.messageId ? { ...m, reactions: data.reactions } : m
        ));
      }
    };

    const editHandler = (data: any) => {
      if (data.roomId === id) {
        setMessages(prev => prev.map(m => 
          m._id === data.messageId ? { ...m, message_text: data.message_text, edited_at: new Date() } : m
        ));
      }
    };

    const deleteHandler = (data: any) => {
      if (data.roomId === id) {
        setMessages(prev => prev.map(m => 
          m._id === data.messageId ? { ...m, is_deleted: true, message_text: '[Message deleted]' } : m
        ));
      }
    };

    const messagesReadHandler = (data: any) => {
      if (data.roomId === id && data.userId !== user?._id) {
        setMessages(prev => prev.map(m => 
          (m.sender_id?._id === user?._id || m.sender_id === user?._id) 
            ? { ...m, delivery_status: 'read' } 
            : m
        ));
      }
    };

    const statusHandler = (data: any) => {
      setConversation((prev: any) => {
        if (!prev) return prev;
        const participants = prev.participants.map((p: any) => 
          p._id === data.userId ? { ...p, status: data.status, last_seen: data.last_seen } : p
        );
        return { ...prev, participants };
      });
    };

    socket.on('receive_message', messageHandler);
    socket.on('typing_start', typingHandler);
    socket.on('typing_stop', typingStopHandler);
    socket.on('message_reaction', reactionHandler);
    socket.on('message_edited', editHandler);
    socket.on('message_deleted', deleteHandler);
    socket.on('messages_read', messagesReadHandler);
    socket.on('user_status_change', statusHandler);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('receive_message', messageHandler);
      socket.off('typing_start', typingHandler);
      socket.off('typing_stop', typingStopHandler);
      socket.off('message_reaction', reactionHandler);
      socket.off('message_edited', editHandler);
      socket.off('message_deleted', deleteHandler);
      socket.off('messages_read', messagesReadHandler);
      socket.off('user_status_change', statusHandler);
    };
  }, [socket, id, user?._id, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const closeMenu = () => {
    setActiveMessage(null);
    setMenuPosition({ x: 0, y: 0 });
  };

  const handleSend = async (messageText: string, mediaUrl?: string, mediaType?: string) => {
    try {
      const otherParticipant = conversation?.participants.find((p: any) => p._id !== user?._id);
      
      if (!otherParticipant) {
        console.error('Recipient not found');
        return;
      }

      const { data } = await api.post('/api/chat/send', {
        recipientId: otherParticipant._id,
        message_text: messageText,
        media_url: mediaUrl,
        message_type: mediaType || 'text',
      });

      socket?.emit('send_message', { ...data, roomId: id });
      setMessages(prev => [...prev, data]);
      socket?.emit('typing_stop', { roomId: id, userId: user?._id });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleTyping = () => {
    socket?.emit('typing_start', { roomId: id, userId: user?._id });
  };

  const onReaction = (messageId: string, emoji: string) => {
    socket?.emit('message_reaction', { messageId, emoji, roomId: id, userId: user?._id });
    setMessages(prev => prev.map(m => {
      if (m._id === messageId) {
        const reactions = m.reactions || [];
        const existing = reactions.find((r: any) => (r.userId?._id || r.userId) === user?._id && r.emoji === emoji);
        if (existing) {
          return { ...m, reactions: reactions.filter((r: any) => !((r.userId?._id || r.userId) === user?._id && r.emoji === emoji)) };
        } else {
          return { ...m, reactions: [...reactions, { userId: user?._id, emoji }] };
        }
      }
      return m;
    }));
  };

  const onEdit = (messageId: string, newText: string) => {
    socket?.emit('message_edited', { messageId, message_text: newText, roomId: id });
    setMessages(prev => prev.map(m => 
      m._id === messageId ? { ...m, message_text: newText, edited_at: new Date() } : m
    ));
  };

  const onDelete = (messageId: string) => {
    socket?.emit('message_deleted', { messageId, roomId: id });
    setMessages(prev => prev.map(m => 
      m._id === messageId ? { ...m, is_deleted: true, message_text: '[Message deleted]' } : m
    ));
  };

  if (!id || id === 'null') return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white text-gray-400">
        <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
            <span className="text-3xl opacity-20">👋</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Select a Conversation</h3>
        <p className="max-w-xs text-center">Pick a friend or start a new chat to begin messaging.</p>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 text-center">
      <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mb-6 border border-red-100">
        <Loader2 className="w-10 h-10 animate-spin opacity-20" />
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-2">Something went wrong</h3>
      <p className="text-slate-400 max-w-[280px] mb-8">{error}</p>
      <button 
        onClick={() => fetchMessages()}
        className="px-6 py-3 bg-sky-500 text-white rounded-2xl font-black shadow-lg shadow-sky-500/20 hover:scale-105 active:scale-95 transition-all"
      >
        Try Again
      </button>
    </div>
  );

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4 text-slate-400 font-bold uppercase tracking-widest text-xs">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-2" />
        Loading Messages
      </div>
    </div>
  );

  const otherUser = conversation?.participants.find((p: any) => p._id !== user?._id);

  const displayMessages = searchResults || messages;

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      {/* Header component */}
      <ChatHeader 
        user={otherUser} 
        isTyping={isTyping} 
        onSearchToggle={() => setIsSearchOpen(!isSearchOpen)} 
      />

      {/* Search Bar */}
      {isSearchOpen && id && (
        <MessageSearch 
          conversationId={id} 
          onSearch={(results) => setSearchResults(results)} 
          onClose={() => {
            setIsSearchOpen(false);
            setSearchResults(null);
          }} 
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-32 md:pb-32 space-y-6 scrollbar-hide bg-slate-50/30">
        <div className="flex flex-col justify-end min-h-full space-y-1">
          {displayMessages.length === 0 && (
               <div className="flex-1 flex flex-col items-center justify-center text-gray-400 mb-10">
                   <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
                       <span className="text-3xl">👋</span>
                   </div>
                   <p className="text-sm font-medium uppercase tracking-widest bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100">
                     {searchResults ? 'No search results found' : `Start of your conversation with ${otherUser?.name || 'Friend'}`}
                   </p>
               </div>
           )}
           {displayMessages.map((msg, index) => (
            <ChatMessage 
              key={msg._id || index} 
              message={msg} 
              isMe={msg.sender_id?._id === user?._id || msg.sender_id === user?._id} 
              onReaction={onReaction}
              onEdit={onEdit}
              onDelete={onDelete}
              onMenuOpen={(message, position) => {
                setActiveMessage(message);
                setMenuPosition(position);
              }}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input component */}
      <ChatInput onSend={handleSend} onTyping={handleTyping} />

      {/* Action Menu Backdrop */}
      {activeMessage && (
        <div 
          className="fixed inset-0 z-[100] cursor-default"
          onClick={closeMenu}
          onContextMenu={(e) => {
            e.preventDefault();
            closeMenu();
          }}
        />
      )}

      {/* Action Menu */}
      {activeMessage && (
        <div 
          className="message-menu"
          style={{ 
            top: `${Math.max(20, Math.min(menuPosition.y, window.innerHeight - 100))}px`, 
            left: `${Math.max(100, Math.min(menuPosition.x, window.innerWidth - 100))}px` 
          }}
        >
          {/* Quick Reactions */}
          <div className="flex gap-0.5 mr-2 pr-2 border-r border-slate-100">
            {['👍', '❤️', '🔥'].map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  onReaction(activeMessage._id, emoji);
                  closeMenu();
                }}
                className="hover:scale-125 hover:rotate-3"
              >
                {emoji}
              </button>
            ))}
          </div>

          <button 
            title="React"
            onClick={() => {
              onReaction(activeMessage._id, '😀');
              closeMenu();
            }}
          >
            😀
          </button>

          {(activeMessage.sender_id?._id === user?._id || activeMessage.sender_id === user?._id) && !activeMessage.is_deleted && (
            <>
              <button 
                title="Edit"
                onClick={() => {
                  // Pass data back if needed, but for now just a placeholder
                  closeMenu();
                }}
              >
                ✏️
              </button>
              <button 
                className="delete"
                title="Delete"
                onClick={() => {
                  onDelete(activeMessage._id);
                  closeMenu();
                }}
              >
                🗑
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
