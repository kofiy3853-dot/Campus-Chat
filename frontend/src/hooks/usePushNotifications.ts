import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../firebase';
import api from '../services/api';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>(Notification.permission);
  const [token, setToken] = useState<string | null>(null);

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        // Replace with your actual VAPID key
        const fcmToken = await getToken(messaging, {
          vapidKey: 'YOUR_VAPID_KEY'
        });
        
        if (fcmToken) {
          setToken(fcmToken);
          // Register the token with your backend
          await api.post('/api/notifications/device-token', {
            token: fcmToken,
            device_type: 'web'
          });
        }
      }
    } catch (error) {
      console.error('An error occurred while requesting notification permission:', error);
    }
  };

  useEffect(() => {
    if (permission === 'granted') {
      requestPermission();
    }

    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      // You can trigger a custom UI notification here if you want
    });

    return () => unsubscribe();
  }, []);

  return { permission, token, requestPermission };
};
