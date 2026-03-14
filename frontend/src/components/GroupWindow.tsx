import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const GroupWindow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (id === 'mock-1') {
        setError('This is a demo group and cannot be loaded.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const [msgRes, groupRes] = await Promise.all([
          api.get(`/api/groups/messages/${id}`),
          api.get(`/api/groups`)
        ]);
        setMessages(msgRes.data || []);
        const currentGroup = groupRes.data.find((g: any) => g._id === id);
        if (!currentGroup) throw new Error('Group not found');
        setGroup(currentGroup);
      } catch (err: any) {
        console.error('Error fetching group data:', err);
        setError(err.response?.data?.message || 'Failed to load group');
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
      const incomingId = String(message._id);
      setMessages(prev => {
        if (prev.some(m => String(m._id) === incomingId)) return prev;
        const newMessages = [...prev, message];
        return newMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      });
    };

    socket.on('receive_group_message', messageHandler);

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

    socket.on('group_message_reaction', reactionHandler);
    socket.on('group_message_edited', editHandler);
    socket.on('group_message_deleted', deleteHandler);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('receive_group_message', messageHandler);
      socket.off('group_message_reaction', reactionHandler);
      socket.off('group_message_edited', editHandler);
      socket.off('group_message_deleted', deleteHandler);
    };
  }, [socket, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    socket?.emit('typing_start', { roomId: id, userId: user?._id });
  };

  const onReaction = (messageId: string, emoji: string) => {
    // The ChatMessage component handles the API call, we just need to broadcast
    socket?.emit('group_message_reaction', { messageId, emoji, roomId: id, userId: user?._id });
  };

  const onEdit = (messageId: string, newText: string) => {
    socket?.emit('group_message_edited', { messageId, message_text: newText, roomId: id });
    setMessages(prev => prev.map(m => 
      m._id === messageId ? { ...m, message_text: newText, edited_at: new Date() } : m
    ));
  };

  const onDelete = (messageId: string) => {
    socket?.emit('group_message_deleted', { messageId, roomId: id });
    setMessages(prev => prev.map(m => 
      m._id === messageId ? { ...m, is_deleted: true, message_text: '[Message deleted]' } : m
    ));
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

  if (error) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white text-gray-400">
        <Users className="w-16 h-16 mb-4 opacity-10" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Oops!</h3>
        <p className="max-w-xs text-center mb-6">{error}</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition-colors"
        >
          Back to Dashboard
        </button>
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
            
            {messages.map((msg, index) => {
                const senderId = typeof msg.sender_id === 'object' ? msg.sender_id?._id : msg.sender_id;
                const isMe = senderId === user?._id;
                const senderName = typeof msg.sender_id === 'object' ? msg.sender_id?.name : 'User';

                return (
                    <div key={msg._id || index} className="group/msg relative">
                    <ChatMessage 
                        message={msg} 
                        isMe={isMe} 
                        onReaction={onReaction}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput onSend={handleSend} onTyping={handleTyping} />
    </div>
  );
};

export default GroupWindow;
