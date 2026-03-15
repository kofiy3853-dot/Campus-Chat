import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import api from '../services/api';

interface UnreadContextType {
  unread: number;
  setUnread: (count: number) => void;
  refreshUnreadCount: () => void;
}

// Global AudioContext must be unlocked by a user gesture on mobile
let globalAudioCtx: any = null;
let audioUnlocked = false;

if (typeof window !== 'undefined') {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (AudioContextClass) {
    globalAudioCtx = new AudioContextClass();
  }
}

const unlockAudio = () => {
  if (audioUnlocked || !globalAudioCtx) return;
  try {
    // Play silent buffer to unlock the audio instance (Fixes iOS Safari/Mobile Chrome)
    const buffer = globalAudioCtx.createBuffer(1, 1, 22050);
    const source = globalAudioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(globalAudioCtx.destination);
    source.start(0);
    if (globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume();
    }
    audioUnlocked = true;
  } catch (e) {
    console.warn("Failed to unlock audio context", e);
  } finally {
    document.removeEventListener('touchstart', unlockAudio);
    document.removeEventListener('click', unlockAudio);
  }
};

if (typeof document !== 'undefined') {
  document.addEventListener('touchstart', unlockAudio, { once: true });
  document.addEventListener('click', unlockAudio, { once: true });
}

const playNotificationSound = () => {
  try {
    if (!globalAudioCtx) return;
    if (globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume();
    }
    
    // Create a smooth, pleasant double chime ("Ding-Ding")
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = globalAudioCtx.createOscillator();
      const gain = globalAudioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      // Soft attack, smooth decay
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(globalAudioCtx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    playTone(1318.51, globalAudioCtx.currentTime, 0.4); // E6
    playTone(1760.00, globalAudioCtx.currentTime + 0.15, 0.6); // A6
  } catch (err) {
    console.log("Audio playback failed:", err);
  }
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
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.requestPermissions();
    } else if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
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
        if (Capacitor.isNativePlatform()) {
          LocalNotifications.schedule({
            notifications: [{
              title: "Campus Chat",
              body: message?.text || "You received a new message",
              id: new Date().getTime(),
              schedule: { at: new Date(Date.now() + 100) }
            }]
          }).catch(err => console.error("Native push failed:", err));
        } else {
          playNotificationSound();
          if (document.visibilityState === 'hidden' && "Notification" in window && Notification.permission === "granted") {
            new Notification("Campus Chat", {
              body: message?.text || "You received a new message",
            });
          }
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
