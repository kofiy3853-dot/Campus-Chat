import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const ChatWindow = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const [msgRes, convRes] = await Promise.all([
          axios.get(`/api/chat/messages/${id}`),
          axios.get(`/api/chat/conversations`)
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

    socket.on('receive_message', messageHandler);
    socket.on('typing_start', typingHandler);
    socket.on('typing_stop', typingStopHandler);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('receive_message', messageHandler);
      socket.off('typing_start', typingHandler);
      socket.off('typing_stop', typingStopHandler);
    };
  }, [socket, id, user?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const handleSend = async (messageText: string, mediaUrl?: string, mediaType?: string) => {
    try {
      const otherParticipant = conversation?.participants.find((p: any) => p._id !== user?._id);
      const { data } = await axios.post('/api/chat/send', {
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

  if (!id || id === 'null') return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0F1D] text-slate-500">
        <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-4 border border-slate-800">
            <span className="text-3xl opacity-20">👋</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Select a Conversation</h3>
        <p className="max-w-xs text-center">Pick a friend or start a new chat to begin messaging.</p>
    </div>
  );

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#0A0F1D]">
      <div className="flex flex-col items-center gap-4 text-slate-500 font-medium">
        Loading...
      </div>
    </div>
  );

  const otherUser = conversation?.participants.find((p: any) => p._id !== user?._id);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0F1D] relative overflow-hidden">
      {/* Header component */}
      <ChatHeader user={otherUser} isTyping={isTyping} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-2 scrollbar-hide bg-[url('/grid.svg')] bg-center bg-fixed">
        <div className="flex flex-col justify-end min-h-full">
           {messages.length === 0 && (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-600 mb-10">
                   <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-4 border border-slate-800">
                       <span className="text-3xl">👋</span>
                   </div>
                   <p className="text-sm font-medium uppercase tracking-widest bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800">Start of your conversation with {otherUser?.name || 'Friend'}</p>
               </div>
           )}
           {messages.map((msg, index) => (
            <ChatMessage 
              key={msg._id || index} 
              message={msg} 
              isMe={msg.sender_id._id === user?._id || msg.sender_id === user?._id} 
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
