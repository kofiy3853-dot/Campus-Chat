import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useUnread } from '../context/UnreadContext';
import api from '../services/api';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ProfileView from './ProfileView';
import { db } from '../db/db';

const GroupWindow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { setUnread } = useUnread();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const markAsRead = async () => {
    if (!id || id === 'null') return;
    try {
      await api.post(`/api/groups/messages/${id}/read`);
      setUnread(0);
    } catch (err) {
      console.error('Error marking group messages as read:', err);
    }
  };

  useEffect(() => {
    const fetchGroupData = async () => {
      if (id === 'mock-1') {
        setError('This is a demo group and cannot be loaded.');
        setLoading(false);
        return;
      }
      try {
        setError(null);

        // Load local messages first
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

        const [msgRes, groupRes] = await Promise.all([
          api.get(`/api/groups/messages/${id}`),
          api.get(`/api/groups`)
        ]);

        const remoteMsgs = msgRes.data || [];
        setMessages(remoteMsgs);

        // Cache messages
        if (id && id !== 'null') {
          await db.transaction('rw', db.messages, async () => {
            await db.messages.where('conversation_id').equals(id).delete();
            await db.messages.bulkAdd(remoteMsgs.map((m: any) => ({ ...m, conversation_id: id })));
          });
        }

        const currentGroup = groupRes.data.find((g: any) => g._id === id);
        if (!currentGroup) throw new Error('Group not found');
        setGroup(currentGroup);
        markAsRead();
      } catch (err: any) {
        console.error('Error fetching group data:', err);
        if (messages.length === 0) {
           setError(err.response?.data?.message || 'Failed to load group');
        }
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

    const messageHandler = async (message: any) => {
      const incomingId = String(message._id);
      setMessages(prev => {
        if (prev.some(m => String(m._id) === incomingId)) return prev;
        const newMessages = [...prev, message];
        return newMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      });

      // Cache incoming message
      try {
        await db.messages.put({ ...message, conversation_id: id });
      } catch (err) {
        console.error('Failed to cache group message:', err);
      }

      // Mark as read if from someone else
      if (message.sender_id?._id !== user?._id && message.sender_id !== user?._id) {
        markAsRead();
      }
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
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: any = {
      _id: tempId,
      conversation_id: id,
      sender_id: user,
      message_text: messageText,
      media_url: mediaUrl,
      message_type: mediaType || 'text',
      timestamp: new Date().toISOString(),
      delivery_status: 'pending'
    };

    // 1. Update UI instantly
    setMessages(prev => [...prev, optimisticMessage]);

    // 2. Persist to local DB as pending
    await db.messages.put(optimisticMessage);

    try {
      const { data } = await api.post(`/api/groups/send`, {
        groupId: id,
        message_text: messageText,
        media_url: mediaUrl,
        message_type: mediaType || 'text',
      });

      // 3. Update UI
      setMessages(prev => prev.map(m => m._id === tempId ? data : m));

      // 4. Update local DB
      await db.transaction('rw', db.messages, async () => {
        await db.messages.delete(tempId);
        await db.messages.put({ ...data, conversation_id: id });
      });

      socket?.emit('send_group_message', { ...data, roomId: id });
    } catch (err) {
      console.error('Error sending group message, queuing:', err);
      
      // 5. Add to offline queue
      await db.offline_queue.add({
        type: 'send_message',
        data: {
          tempId,
          conversation_id: id,
          groupId: id,
          message_text: messageText,
          media_url: mediaUrl,
          message_type: mediaType || 'text',
          isGroup: true
        },
        timestamp: new Date().toISOString()
      });
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
    // We rely on the backend's socket broadcast from deleteGroupMessage
    // No need for manual state update here if we use the socket handler
    // but we can keep it for optimistic UI if needed
    setMessages(prev => prev.map(m => 
      m._id === messageId ? { ...m, is_deleted: true, message_text: 'This message was deleted' } : m
    ));
  };

  if (!id || id === 'null') return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white text-gray-400">
        <Users className="w-16 h-16 mb-4 opacity-10" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">No Group Selected</h3>
        <p className="max-w-xs text-center">Select a group from the sidebar to start collaborating.</p>
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
        onProfileClick={() => setIsProfileOpen(true)}
      />

      <ProfileView 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        targetId={id!}
        isGroup={true}
        groupData={group}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-32 md:pb-32 space-y-6 scrollbar-hide bg-slate-50/30">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
             <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-2" />
             Synchronizing Hub...
          </div>
        ) : (
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
        )}
      </div>

      <ChatInput onSend={handleSend} onTyping={handleTyping} />
    </div>
  );
};

export default GroupWindow;
