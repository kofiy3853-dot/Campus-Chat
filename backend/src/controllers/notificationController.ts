import { Response } from 'express';
import { AuthRequest } from '../types/express';
import Notification from '../models/Notification';
import User from '../models/User';
import DeviceToken from '../models/DeviceToken';

// Get user notifications
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await Notification.find({
      user_id: req.user.id,
    })
      .populate('sender_id', 'name profile_picture')
      .sort({ created_at: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  const { notificationId } = req.params;

  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true, read_at: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Broadcast update
    io.to(`notification:${req.user.id}`).emit('notification_read', { notificationId });

    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany(
      { user_id: req.user.id, read: false },
      { read: true, read_at: new Date() }
    );

    // Broadcast update
    io.to(`notification:${req.user.id}`).emit('all_notifications_read');

    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Delete notification
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  const { notificationId } = req.params;

  try {
    await Notification.findByIdAndDelete(notificationId);
    res.json({ message: 'Notification deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get unread notification count
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const count = await Notification.countDocuments({
      user_id: req.user.id,
      read: false,
    });

    res.json({ unread_count: count });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Register device token for push notifications
export const registerDeviceToken = async (req: AuthRequest, res: Response) => {
  const { token, device_type } = req.body;

  try {
    let deviceToken = await DeviceToken.findOne({ token });

    if (deviceToken) {
      deviceToken.user_id = req.user.id;
      deviceToken.device_type = device_type || 'web';
      deviceToken.is_active = true;
      deviceToken.last_used = new Date();
    } else {
      deviceToken = await DeviceToken.create({
        user_id: req.user.id,
        token,
        device_type: device_type || 'web',
      });
    }

    await deviceToken.save();
    res.status(201).json({ message: 'Device registered' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req: any, res: Response) => {
  const { email_notifications, browser_notifications } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email_notifications !== undefined) {
      user.notification_preferences.email_notifications = email_notifications;
    }

    if (browser_notifications !== undefined) {
      user.notification_preferences.browser_notifications = browser_notifications;
    }

    await user.save();
    res.json(user.notification_preferences);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

import { io } from '../server';
import admin from '../utils/firebaseAdmin';

// Create notification (internal helper)
export const createNotification = async (
  userId: string,
  type: 'message' | 'group_invite' | 'announcement' | 'event_update',
  title: string,
  body: string,
  data: any,
  senderId?: string
) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) return;

    const notification = await Notification.create({
      user_id: userId,
      sender_id: senderId,
      type,
      title,
      body,
      data,
    });

    // Populate sender info for the frontend
    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender_id', 'name profile_picture');

    // Broadcast real-time notification via Socket.IO
    if (io) {
      console.log(`[Notification] Emitting to notification:${userId} for type: ${type}`);
      io.to(`notification:${userId}`).emit('notification', populatedNotification);
    } else {
      console.error('[Notification] IO instance is UNDEFINED! Cannot broadcast notification.');
    }

    // --- Push Notifications via FCM ---
    const deviceTokens = await DeviceToken.find({ user_id: userId, is_active: true });
    const tokens = deviceTokens.map(dt => dt.token);

    if (tokens.length > 0 && admin.apps.length > 0) {
      const message = {
        notification: {
          title,
          body,
        },
        data: {
          ...data,
          type,
          click_action: '/dashboard/notifications', // Customize based on your routing
        },
        tokens,
      };

      try {
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`Successfully sent ${response.successCount} push notifications`);
        
        // Handle token invalidation if needed
        if (response.failureCount > 0) {
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const errorCode = resp.error?.code;
              if (errorCode === 'messaging/invalid-registration-token' || errorCode === 'messaging/registration-token-not-registered') {
                DeviceToken.updateOne({ token: tokens[idx] }, { is_active: false }).exec();
              }
            }
          });
        }
      } catch (pushError) {
        console.error('Error sending push notifications:', pushError);
      }
    }

    return populatedNotification;
  } catch (error: any) {
    console.error('Error creating notification:', error.message);
  }
};
