import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import MessageSearch from './MessageSearch';

const ChatWindow = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setSearchResults(null);
        setIsSearchOpen(false);
        const [msgRes, convRes] = await Promise.all([
          api.get(`/api/chat/messages/${id}`),
          api.get(`/api/chat/conversations`)
        ]);
        setMessages(msgRes.data);
        const currentConv = convRes.data.find((c: any) => c._id === id);
        setConversation(currentConv);
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id && id !== 'null') fetchMessages();
  }, [id]);

  useEffect(() => {
    if (!socket || !id || id === 'null') return;

    // Join room now, and re-join whenever the socket reconnects
    const joinRoom = () => socket.emit('join_room', id);
    joinRoom();
    socket.on('connect', joinRoom); // handles backend restarts / reconnects

    const messageHandler = (message: any) => {
      setMessages(prev => {
        // Deduplicate: sender already added this message optimistically
        const incomingId = String(message._id);
        if (prev.some(m => String(m._id) === incomingId)) return prev;
        return [...prev, message];
      });
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
        setMessages(prev => prev.map(m => {
          if (m._id === data.messageId) {
            const existing = m.reactions?.find((r: any) => (r.userId?._id || r.userId) === data.userId && r.emoji === data.emoji);
            const reactions = m.reactions || [];
            if (existing) {
              return { ...m, reactions: reactions.filter((r: any) => !((r.userId?._id || r.userId) === data.userId && r.emoji === data.emoji)) };
            } else {
              return { ...m, reactions: [...reactions, { userId: data.userId, emoji: data.emoji }] };
            }
          }
          return m;
        }));
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

    socket.on('receive_message', messageHandler);
    socket.on('typing_start', typingHandler);
    socket.on('typing_stop', typingStopHandler);
    socket.on('message_reaction', reactionHandler);
    socket.on('message_edited', editHandler);
    socket.on('message_deleted', deleteHandler);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('receive_message', messageHandler);
      socket.off('typing_start', typingHandler);
      socket.off('typing_stop', typingStopHandler);
      socket.off('message_reaction', reactionHandler);
      socket.off('message_edited', editHandler);
      socket.off('message_deleted', deleteHandler);
    };
  }, [socket, id, user?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const handleSend = async (messageText: string, mediaUrl?: string, mediaType?: string) => {
    try {
      const otherParticipant = conversation?.participants.find((p: any) => p._id !== user?._id);
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

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4 text-gray-400 font-medium">
        Loading...
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
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2 scrollbar-hide bg-white">
        <div className="flex flex-col justify-end min-h-full">
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
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input component */}
      <ChatInput onSend={handleSend} onTyping={handleTyping} />
    </div>
  );
};

export default ChatWindow;
