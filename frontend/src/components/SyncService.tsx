import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { db } from '../db/db';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const SyncService: React.FC = () => {
  const { connected } = useSocket();
  const { showToast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('info', 'Back Online', 'Synchronizing your messages...');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('info', 'Offline Mode', 'Your messages will be sent once you reconnect.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  useEffect(() => {
    if (isOnline && connected) {
      processOfflineQueue();
    }
  }, [isOnline, connected]);

  const processOfflineQueue = async () => {
    try {
      const pendingActions = await db.offline_queue.toArray();
      if (pendingActions.length === 0) return;

      console.log(`[SyncService] Processing ${pendingActions.length} offline actions...`);

      for (const action of pendingActions) {
        try {
          if (action.type === 'send_message') {
            const { conversation_id, message_text, media_url, message_type, recipientId, isGroup, groupId } = action.data;
            
            const endpoint = isGroup ? `/api/groups/send` : `/api/chat/send`;
            const payload = isGroup ? { groupId, message_text, media_url, message_type } : { recipientId, message_text, media_url, message_type };

            const { data } = await api.post(endpoint, payload);
            
            // Reconcile DB: Remove pending message and add real one (or update)
            // For now, our offline sending implementation is simple: we queue it and send it later.
            // If we implement optimistic UI, we'd need to replace the temporary ID.
            
            await db.messages.put({ ...data, conversation_id: isGroup ? groupId : conversation_id });
          }
          
          // Remove from queue after success
          await db.offline_queue.delete(action.id!);
        } catch (err) {
          console.error('[SyncService] Failed to process action:', action, err);
          // If it's a permanent error (e.g. 400), we might want to remove it anyway.
          // For now, keep it to retry later or until successful.
          break; // Stop processing for now to avoid hammering
        }
      }
    } catch (err) {
      console.error('[SyncService] Error in processOfflineQueue:', err);
    }
  };

  return null; // Background service
};

export default SyncService;
