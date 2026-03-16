import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../firebase';
import api from '../services/api';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission | 'prompt' | 'granted' | 'denied'>(
    Capacitor.isNativePlatform() ? 'prompt' : (typeof Notification !== 'undefined' ? Notification.permission : 'denied')
  );
  const [token, setToken] = useState<string | null>(null);

  const requestPermission = async () => {
    // 1. Handle Native Platforms (Android/iOS)
    if (Capacitor.isNativePlatform()) {
      try {
        let permStatus = await PushNotifications.checkPermissions();
        
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === 'granted') {
          setPermission('granted');
          await PushNotifications.register();
          
          // Add registration listeners
          PushNotifications.addListener('registration', async ({ value }) => {
            console.log('[Push] Native Registration Token:', value);
            setToken(value);
            await api.post('/api/notifications/device-token', {
              token: value,
              device_type: Capacitor.getPlatform() === 'ios' ? 'mobile' : 'mobile' // Backend expects 'mobile' or 'web' based on model
            });
          });

          PushNotifications.addListener('registrationError', (error) => {
            console.error('[Push] Native Registration Error:', error);
          });

          // Handle foreground notifications
          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('[Push] Native Notification Received:', notification);
          });

          // Handle notification click
          PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
            console.log('[Push] Native Notification Clicked:', notification);
            const data = notification.data;
            if (data?.conversation_id) {
              window.location.href = `/dashboard/chat/${data.conversation_id}`;
            }
          });
        } else {
          setPermission('denied');
        }
      } catch (err) {
        console.error('[Push] Native Permission Error:', err);
      }
      return;
    }

    // 2. Handle Web Platform
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
    // Check permission on mount
    if (Capacitor.isNativePlatform()) {
      PushNotifications.checkPermissions().then(res => {
        setPermission(res.receive as any);
        if (res.receive === 'granted') {
          PushNotifications.register();
        }
      });
    } else if (typeof Notification !== 'undefined' && permission === 'granted') {
      requestPermission();
    }

    let unsubscribeFirebase: () => void = () => {};

    const setupWebListener = async () => {
      if (Capacitor.isNativePlatform()) return;
      const messagingInstance = await messaging();
      if (messagingInstance) {
        unsubscribeFirebase = onMessage(messagingInstance, (payload) => {
          console.log('Foreground message received (Web):', payload);
        });
      }
    };

    setupWebListener();

    return () => {
      unsubscribeFirebase();
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, []);

  return { permission, token, requestPermission };
};
