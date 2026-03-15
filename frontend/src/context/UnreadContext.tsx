import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import api from '../services/api';

interface UnreadContextType {
  unread: number;
  setUnread: (count: number) => void;
  refreshUnreadCount: () => void;
}

const UnreadContext = createContext<UnreadContextType | undefined>(undefined);

export const UnreadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unread, setUnread] = useState(0);
  const { user } = useAuth();
  const { socket } = useSocket();

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/api/chat/unread/count');
      setUnread(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (msg: any) => {
      // If we are not in the conversation, increment (simple fallback)
      // The notification system is the source of truth now
    };

    const handleMessagesRead = () => {
      refreshUnreadCount();
    };

    const handleNotification = (notification: any) => {
      if (notification.type === 'message') {
        refreshUnreadCount();
      }
    };

    socket.on('receive_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('notification', handleNotification);

    return () => {
      socket.off('receive_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('notification', handleNotification);
    };
  }, [socket, user, refreshUnreadCount]);

  return (
    <UnreadContext.Provider value={{ unread, setUnread, refreshUnreadCount }}>
      {children}
    </UnreadContext.Provider>
  );
};

export const useUnread = () => {
  const context = useContext(UnreadContext);
  if (context === undefined) {
    throw new Error('useUnread must be used within an UnreadProvider');
  }
  return context;
};
