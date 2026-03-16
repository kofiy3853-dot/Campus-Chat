import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { db } from '../db/db';

interface Conversation {
  _id: string;
  participants: any[];
  last_message: any;
  updatedAt: string;
  type?: 'chat' | 'group';
  group_name?: string;
}

interface ChatContextType {
  conversations: Conversation[];
  loading: boolean;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const { user } = useAuth();

  // Load from local DB on mount
  useEffect(() => {
    if (!user) return;
    const loadFromDB = async () => {
      try {
        const localConvs = await db.conversations.orderBy('last_message_time').reverse().toArray();
        if (localConvs.length > 0) {
          setConversations(localConvs as any);
        }
      } catch (err) {
        console.error('Failed to load local conversations:', err);
      }
    };
    loadFromDB();
  }, [user]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      // Don't set loading true if we already have local data to keep it fast
      // but maybe we should for initial mount?
      const { data } = await api.get('/api/chat/conversations');
      setConversations(data);
      
      // Persist to local DB
      await db.transaction('rw', db.conversations, async () => {
        await db.conversations.clear();
        await db.conversations.bulkPut(data.map((c: any) => ({
          ...c,
          last_message_time: c.last_message?.timestamp || c.updatedAt,
          type: c.group_name ? 'group' : 'chat'
        })));
      });
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = async (message: any) => {
      // Update local state and DB
      const conversationId = message.conversation_id || message.group_id;
      
      setConversations(prev => {
        const index = prev.findIndex(c => c._id === conversationId);
        if (index === -1) {
          fetchConversations(); // New one, refresh all
          return prev;
        }
        const newItems = [...prev];
        newItems[index] = { 
          ...newItems[index], 
          last_message: message, 
          updatedAt: message.timestamp 
        };
        // Move to top
        const item = newItems.splice(index, 1)[0];
        newItems.unshift(item);
        return newItems;
      });

      // Update local DB
      try {
        const conv = await db.conversations.get(conversationId);
        if (conv) {
          await db.conversations.update(conversationId, {
            last_message: message,
            last_message_time: message.timestamp,
            updatedAt: message.timestamp
          });
        }
      } catch (err) {
        console.error('Failed to update local conversation in DB:', err);
      }
    };

    socket.on('receive_message', handleNewMessage);
    socket.on('receive_group_message', handleNewMessage);

    return () => {
      socket.off('receive_message', handleNewMessage);
      socket.off('receive_group_message', handleNewMessage);
    };
  }, [socket, fetchConversations]);

  return (
    <ChatContext.Provider value={{ conversations, loading, refreshConversations: fetchConversations }}>
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
