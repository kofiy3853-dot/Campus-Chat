import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const GroupWindow = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setLoading(true);
        const [msgRes, groupRes] = await Promise.all([
          api.get(`/api/groups/messages/${id}`),
          api.get(`/api/groups`)
        ]);
        setMessages(msgRes.data || []);
        const currentGroup = groupRes.data.find((g: any) => g._id === id);
        setGroup(currentGroup);
      } catch (err) {
        console.error('Error fetching group data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id && id !== 'null') fetchGroupData();
  }, [id]);

  useEffect(() => {
    if (!socket || !id || id === 'null') return;

    const joinRoom = () => socket.emit('join_room', id);
    joinRoom();
    socket.on('connect', joinRoom); // re-join after backend restart / reconnect

    const messageHandler = (message: any) => {
      setMessages(prev => {
        const incomingId = String(message._id);
        if (prev.some(m => String(m._id) === incomingId)) return prev;
        return [...prev, message];
      });
    };

    socket.on('receive_group_message', messageHandler);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('receive_group_message', messageHandler);
    };
  }, [socket, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const handleSend = async (messageText: string, mediaUrl?: string, mediaType?: string) => {
    try {
      const { data } = await api.post(`/api/groups/send`, {
        groupId: id,
        message_text: messageText,
        media_url: mediaUrl,
        message_type: mediaType || 'text',
      });

      socket?.emit('send_group_message', { ...data, roomId: id });
      setMessages(prev => [...prev, data]);
    } catch (err) {
      console.error('Error sending group message:', err);
    }
  };

  const handleTyping = () => {
    // Group typing indicator logic could be added here
  };

  if (!id || id === 'null') return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white text-gray-400">
        <Users className="w-16 h-16 mb-4 opacity-10" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">No Group Selected</h3>
        <p className="max-w-xs text-center">Select a group from the sidebar to start collaborating.</p>
    </div>
  );

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4 text-gray-400 font-medium">
            Loading...
        </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      {/* Reusing ChatHeader with Group data */}
      <ChatHeader 
        user={{
            name: group?.group_name || 'Unnamed Group',
            profile_picture: null,
            status: 'online',
            isGroup: true,
            memberCount: group?.members?.length || 0
        }} 
        isTyping={false} 
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-32 md:pb-32 space-y-6 scrollbar-hide bg-slate-50/30">
        <div className="flex flex-col justify-end min-h-full space-y-1">
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 mb-10">
                <div className="w-20 h-20 rounded-[2rem] bg-gray-50 flex items-center justify-center mb-4 border border-gray-100 text-3xl font-bold text-sky-400 shadow-xl shadow-sky-400/5">
                    {group?.group_name?.[0] || '?'}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">{group?.group_name || 'Group Hub'}</h3>
                <p className="text-sm font-medium opacity-60">This is the beginning of the {group?.group_name || 'shared'} story.</p>
            </div>
            
            {messages.map((msg, index) => (
                <div key={msg._id || index} className="group/msg relative">
                    {! (msg.sender_id._id === user?._id || msg.sender_id === user?._id) && (
                        <span className="text-[10px] font-bold text-slate-500 ml-4 mb-0.5 block uppercase tracking-wider">{msg.sender_id?.name}</span>
                    )}
                    <ChatMessage 
                        message={msg} 
                        isMe={msg.sender_id._id === user?._id || msg.sender_id === user?._id} 
                    />
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput onSend={handleSend} onTyping={handleTyping} />
    </div>
  );
};

export default GroupWindow;
