import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Trash2, Loader2, Search, Edit3, X, MoreVertical, Shield, UserX, Flag, Pin, CheckCircle2 } from 'lucide-react';
import ProfileView from './ProfileView';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useUnread } from '../context/UnreadContext';
import api from '../services/api';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import MessageSearch from './MessageSearch';
import { db } from '../db/db';
import { useToast } from '../context/ToastContext';

const ChatWindow = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { setUnread } = useUnread();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [activeMessage, setActiveMessage] = useState<any>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [reply, setReply] = useState<any>(null);
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
      setError(null);
      setSearchResults(null);
      setIsSearchOpen(false);

      // Load from local DB first for instant display
      if (id && id !== 'null') {
        const localMsgs = await db.messages.where('conversation_id').equals(id).sortBy('timestamp');
        if (localMsgs.length > 0) {
          setMessages(localMsgs);
          setLoading(false); // We have data, hide spinner
        } else {
          setLoading(true); // No data, show spinner
        }
      } else {
        setLoading(true);
      }

      const [msgRes, convRes] = await Promise.all([
        api.get(`/api/chat/messages/${id}`),
        api.get(`/api/chat/conversations`)
      ]);
      
      const remoteMsgs = msgRes.data;
      setMessages(remoteMsgs);

      // Cache messages to local DB
      if (id && id !== 'null') {
        await db.transaction('rw', db.messages, async () => {
          // Find which messages to add (don't clear everything to preserve 'pending' local ones if any)
          // For now, simple clear and refresh for simplicity, but in future reconcile
          await db.messages.where('conversation_id').equals(id).delete();
          await db.messages.bulkAdd(remoteMsgs.map((m: any) => ({ ...m, conversation_id: id })));
        });
      }

      const currentConv = convRes.data.find((c: any) => c._id === id);
      if (!currentConv) {
        throw new Error('Conversation not found');
      }
      setConversation(currentConv);
      markAsRead();
      setUnread(0);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      // Only show error if we have NO messages at all (using functional update check if needed or just removing the length check)
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

    const messageHandler = async (message: any) => {
      const incomingId = String(message._id);
      setMessages(prev => {
        if (prev.some(m => String(m._id) === incomingId)) return prev;
        const newMessages = [...prev, message];
        return newMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      });

      // Persist to local DB
      try {
        await db.messages.put({ ...message, conversation_id: id });
      } catch (err) {
        console.error('Failed to cache incoming message:', err);
      }

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
        setMessages(prev => prev.filter(m => String(m._id) !== String(data.messageId)));
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
    socket.on('group_message_deleted', deleteHandler);
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
      socket.off('group_message_deleted', deleteHandler);
      socket.off('messages_read', messagesReadHandler);
      socket.off('user_status_change', statusHandler);
    };
  }, [socket, id, user?._id, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  useEffect(() => {
    const closeMenuHandler = () => setActiveMessage(null);
    window.addEventListener('click', closeMenuHandler);
    return () => window.removeEventListener('click', closeMenuHandler);
  }, []);

  const handleSend = async (messageText: string, mediaUrl?: string, mediaType?: string, replyTo?: string) => {
    try {
      if (editingMessage) {
        const { data } = await api.put(`/api/chat/messages/${editingMessage._id}`, { 
          message_text: messageText 
        });
        setMessages(prev => prev.map(m => m._id === editingMessage._id ? data : m));
        socket?.emit('message_edited', { 
          messageId: editingMessage._id, 
          message_text: messageText, 
          roomId: id 
        });
        setEditingMessage(null);
        return;
      }

      const otherParticipant = conversation.participants.find((p: any) => p._id !== user?._id);
      if (!otherParticipant) return;

      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: any = {
        _id: tempId,
        conversation_id: id,
        sender_id: user,
        message_text: messageText,
        media_url: mediaUrl,
        message_type: mediaType || 'text',
        timestamp: new Date().toISOString(),
        delivery_status: 'pending',
        reply_to: reply // Optimistic reply info
      };

      // 1. Update UI instantly
      setMessages(prev => [...prev, optimisticMessage]);
      setReply(null); // Clear reply state after sending

      // 2. Persist to local DB as pending
      await db.messages.put(optimisticMessage);

      try {
        if (!navigator.onLine) {
          throw new Error('OFFLINE_MODE');
        }

        const { data } = await api.post('/api/chat/send', {
          recipientId: otherParticipant._id,
          message_text: messageText,
          media_url: mediaUrl,
          message_type: mediaType || 'text',
          replyTo: replyTo,
        });

        // 3. Update UI with confirmed data (replace temp message)
        setMessages(prev => prev.map(m => m._id === tempId ? data : m));

        // 4. Update local DB
        await db.transaction('rw', db.messages, async () => {
          await db.messages.delete(tempId);
          await db.messages.put({ ...data, conversation_id: id });
        });

        socket?.emit('send_message', { ...data, roomId: id });
        socket?.emit('typing_stop', { roomId: id, userId: user?._id });
      } catch (err: any) {
        if (err.message === 'OFFLINE_MODE' || !navigator.onLine) {
          showToast('info', 'Message Saved Offline', 'It will send when connection returns.');
        } else {
          console.error('Error sending message:', err);
        }
        
        // 5. Add to offline queue
        await db.offline_queue.add({
          type: 'send_message',
          data: {
            tempId,
            conversation_id: id,
            recipientId: otherParticipant._id,
            message_text: messageText,
            media_url: mediaUrl,
            message_type: mediaType || 'text',
            isGroup: false
          },
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Critical error in handleSend:', err);
    }
  };

  const handleTyping = () => {
    socket?.emit('typing_start', { roomId: id, userId: user?._id });
  };

  const onReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      // Call API for persistence
      await api.post(`/api/chat/messages/${messageId}/reaction`, { emoji });
      
      // Emit socket for real-time update to others
      socket?.emit('message_reaction', { messageId, emoji, roomId: id, userId: user?._id });
      
      // Update local state
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
    } catch (err: any) {
      console.error('Reaction error:', err);
    }
  }, [socket, id, user?._id]);

  const onEdit = useCallback((messageId: string, newText: string) => {
    socket?.emit('message_edited', { messageId, message_text: newText, roomId: id });
    setMessages(prev => prev.map(m => 
      m._id === messageId ? { ...m, message_text: newText, edited_at: new Date() } : m
    ));
  }, [socket, id]);

  const onDelete = useCallback(async (messageId: string) => {
    try {
      const isGroup = !!conversation?.group_name; // Check if it's a group
      const endpoint = isGroup 
        ? `/api/groups/messages/${messageId}` 
        : `/api/chat/messages/${messageId}`;
        
      await api.delete(endpoint);
      setMessages(prev => prev.filter(m => m._id !== messageId));
      
      const socketEvent = isGroup ? 'group_message_deleted' : 'message_deleted';
      socket?.emit(socketEvent, { messageId, roomId: id });
    } catch (err: any) {
      console.error('Delete message error:', err);
      alert(`Delete failed: ${err.response?.data?.message || err.message}`);
    }
  }, [conversation?.group_name, id, socket]);

  const handleMenuOpen = useCallback((message: any, position: { x: number, y: number }) => {
    setActiveMessage(message);
    setMenuPosition(position);
  }, []);

  const handleSwipe = useCallback((msg: any) => {
    setReply(msg);
    setEditingMessage(null);
  }, []);

  if (!id || id === 'null') return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white text-gray-400">
        <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
            <span className="text-3xl opacity-20">👋</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Select a Conversation</h3>
        <p className="max-w-xs text-center">Pick a friend or start a new chat to begin messaging.</p>
    </div>
  );  if (error) return (
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

  const otherUser = conversation?.participants?.find((p: any) => p._id !== user?._id);

  const displayMessages = searchResults || messages;

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      {/* Header component */}
      <ChatHeader 
        user={otherUser} 
        isTyping={isTyping} 
        onSearchToggle={() => setIsSearchOpen(!isSearchOpen)} 
        onProfileClick={() => setIsProfileOpen(true)}
      />

      <ProfileView 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        targetId={otherUser?._id}
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
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
            <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-2" />
            Synchronizing...
          </div>
        ) : (
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
                onMenuOpen={handleMenuOpen}
                onSwipe={handleSwipe}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatInput 
        onSend={handleSend} 
        onTyping={handleTyping} 
        editingValue={editingMessage?.message_text}
        onCancelEdit={() => setEditingMessage(null)}
        reply={reply}
        onCancelReply={() => setReply(null)}
      />

      {/* Action Menu */}
      {activeMessage && (
        <div 
          className="message-menu"
          style={{ 
            top: `${Math.max(20, Math.min(menuPosition.y, window.innerHeight - 100))}px`, 
            left: `${Math.max(100, Math.min(menuPosition.x, window.innerWidth - 100))}px` 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Reactions */}
          <div className="flex gap-0.5 mr-2 pr-2 border-r border-slate-100">
            {['👍', '❤️', '🔥'].map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  onReaction(activeMessage._id, emoji);
                  setActiveMessage(null);
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
              setActiveMessage(null);
            }}
          >
            😀
          </button>

          {(activeMessage.sender_id?._id === user?._id || activeMessage.sender_id === user?._id) && !activeMessage.is_deleted && (
            <>
              <button 
                title="Edit"
                onClick={() => {
                  setEditingMessage(activeMessage);
                  setActiveMessage(null);
                }}
              >
                ✏️
              </button>
              <button 
                className="delete"
                title="Delete"
                onClick={() => {
                  onDelete(activeMessage._id);
                  setActiveMessage(null);
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
