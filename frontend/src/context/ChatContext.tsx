import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

interface ChatContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket } = useSocket();
  const { user } = useAuth();

  const refreshUnreadCount = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/api/chat/unread-count');
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    if (user) {
      refreshUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      // Increment unread count if the message is for the current user 
      // and they are not the sender
      if (user && message.recipient_id === user._id && message.sender_id !== user._id) {
        setUnreadCount(prev => prev + 1);
      }
    };

    const handleMessagesRead = () => {
      // Re-fetch count when messages are marked as read
      refreshUnreadCount();
    };

    socket.on('receive_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('receive_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, user]);

  return (
    <ChatContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
