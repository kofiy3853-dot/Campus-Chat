import { Request, Response } from 'express';
import Notification from '../models/Notification';
import User from '../models/User';
import DeviceToken from '../models/DeviceToken';

// Get user notifications
export const getNotifications = async (req: any, res: Response) => {
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
export const markNotificationAsRead = async (req: any, res: Response) => {
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

    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req: any, res: Response) => {
  try {
    await Notification.updateMany(
      { user_id: req.user.id, read: false },
      { read: true, read_at: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Delete notification
export const deleteNotification = async (req: any, res: Response) => {
  const { notificationId } = req.params;

  try {
    await Notification.findByIdAndDelete(notificationId);
    res.json({ message: 'Notification deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get unread notification count
export const getUnreadCount = async (req: any, res: Response) => {
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
export const registerDeviceToken = async (req: any, res: Response) => {
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

    return notification;
  } catch (error: any) {
    console.error('Error creating notification:', error.message);
  }
};
