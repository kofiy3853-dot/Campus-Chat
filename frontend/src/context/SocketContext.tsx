import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

import { useToast } from './ToastContext';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  const userId = user?._id;

  useEffect(() => {
    if (!userId) return;

    const socketUrl = import.meta.env.VITE_API_URL || '/';
    const newSocket = io(socketUrl, {
      query: { userId },
      path: '/socket.io',
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('[Socket] Connected');
    });

    newSocket.on('disconnect', (reason) => {
      setConnected(false);
      console.warn('[Socket] Disconnected:', reason);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection Error:', error.message);
      // Fallback to polling if websocket fails explicitly
      const opts = newSocket.io.opts;
      if (opts && opts.transports && opts.transports.includes('websocket' as any)) {
        console.log('[Socket] Attempting polling fallback...');
      }
    });

    newSocket.on('notification', (data: any) => {
        // Only show toast if it's not a message from self (though server doesn't send such)
        // and if it's a new real-time event.
        showToast(
            data.type === 'message' ? 'message' : 'info',
            data.title,
            data.body
        );
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
