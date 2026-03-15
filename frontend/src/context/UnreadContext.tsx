import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import api from '../services/api';

interface UnreadContextType {
  unread: number;
  setUnread: (count: number) => void;
  refreshUnreadCount: () => void;
}

const playNotificationSound = () => {
  const audio = new Audio("/sounds/notification.mp3");
  audio.play().catch((err) => {
    console.log("Sound blocked by browser or missing file:", err);
  });
};

const UnreadContext = createContext<UnreadContextType | undefined>(undefined);

export const UnreadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unread, setUnread] = useState(0);
  const { user } = useAuth();
  const { socket } = useSocket();

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/api/chat/unread-count');
      console.log('UnreadContext: Fetched count', data.unread);
      setUnread(data.unread || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!socket || !user) {
      console.log('UnreadContext: Socket or user missing', { hasSocket: !!socket, hasUser: !!user });
      return;
    }

    console.log('UnreadContext: Initializing socket listeners for user', user._id);

    const handleNewMessage = (message?: any) => {
      console.log('UnreadContext: receive_message/receive_group_message event received');
      
      const isMine = message?.sender?._id === user._id || message?.sender === user._id;
      if (!isMine) {
        playNotificationSound();
        if (document.visibilityState === 'hidden' && "Notification" in window && Notification.permission === "granted") {
          new Notification("Campus Chat", {
            body: message?.text || "You received a new message",
          });
        }
      }

      refreshUnreadCount();
    };

    const handleMessagesRead = () => {
      console.log('UnreadContext: messages_read event received');
      refreshUnreadCount();
    };

    const handleNotification = (notification: any) => {
      console.log('UnreadContext: notification event received', notification);
      
      // Optimistically increment unread count for messages
      if (notification.type === 'message') {
        setUnread(prev => prev + 1);
      }
      
      // Still refresh from API to ensure sync (background)
      refreshUnreadCount();
    };

    socket.on('receive_message', handleNewMessage);
    socket.on('receive_group_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('notification', handleNotification);

    return () => {
      socket.off('receive_message', handleNewMessage);
      socket.off('receive_group_message', handleNewMessage);
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
