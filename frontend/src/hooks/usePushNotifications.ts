import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../firebase';
import api from '../services/api';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied' as NotificationPermission
  );
  const [token, setToken] = useState<string | null>(null);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') {
      console.warn('Push notifications are not supported in this browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        const messagingInstance = await messaging();
        if (!messagingInstance) return;

        const fcmToken = await getToken(messagingInstance, {
          vapidKey: '0rhA5b6S0y1tBfQFhrHjx4PBrx4cf_r_79fe1YlLKDM'
        });
        
        if (fcmToken) {
          setToken(fcmToken);
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
    if (typeof Notification !== 'undefined' && permission === 'granted') {
      requestPermission();
    }

    let unsubscribe: () => void = () => {};

    const setupListener = async () => {
      const messagingInstance = await messaging();
      if (messagingInstance) {
        unsubscribe = onMessage(messagingInstance, (payload) => {
          console.log('Foreground message received:', payload);
        });
      }
    };

    setupListener();

    return () => unsubscribe();
  }, [permission]);

  return { permission, token, requestPermission };
};
