import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { clsx } from 'clsx';

interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  sender_id?: { name: string; profile_picture: string };
}

const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Listen for real-time notifications
    if (socket) {
      socket.on('notification', (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      socket.on('notification_read', ({ notificationId }: { notificationId: string }) => {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      });

      socket.on('all_notifications_read', () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      });
    }

    return () => {
      if (socket) {
        socket.off('notification');
        socket.off('notification_read');
        socket.off('all_notifications_read');
      }
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/api/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/api/notifications/unread-count');
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const target = notifications.find((n) => n._id === notificationId);
      await api.delete(`/api/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      // Decrement badge if the deleted notification was unread
      if (target && !target.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'group_invite':
        return '👥';
      case 'announcement':
        return '📢';
      case 'event_update':
        return '📅';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2.5 text-gray-400 hover:text-sky-500 hover:bg-gray-50 rounded-xl transition-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="fixed md:absolute top-16 md:top-full right-4 md:right-0 mt-2 w-[calc(100vw-32px)] md:w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 max-h-[70vh] md:max-h-96 overflow-hidden flex flex-col transition-none">
          {/* Header */}
          <div className="bg-white border-b border-gray-50 p-4 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-gray-800 tracking-tight">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-bold text-sky-500 hover:text-sky-600 transition-none"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => {
                    if (!notification.read) markAsRead(notification._id);
                    // Navigation or details view could go here
                  }}
                  className={clsx(
                    'p-4 border-b border-gray-50 hover:bg-gray-50 transition-none cursor-pointer',
                    !notification.read && 'bg-sky-50/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className={clsx(
                          'font-semibold',
                          !notification.read ? 'text-gray-900' : 'text-gray-600'
                        )}>
                          {notification.title}
                        </p>
                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="text-gray-400 hover:text-red-500 p-1 transition-none"
                          title="Delete notification"
                          aria-label="Delete notification"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {notification.body}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-400">
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="text-xs text-sky-500 hover:text-sky-600 transition-none"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
