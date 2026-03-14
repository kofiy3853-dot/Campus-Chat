import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  ChevronLeft, 
  MessageSquare, 
  Users, 
  Megaphone, 
  Calendar, 
  Ghost, 
  Check, 
  Trash2, 
  Clock 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { clsx } from 'clsx';
import Skeleton from '../components/Skeleton';
import { getMediaUrl } from '../utils/imageUrl';

interface Notification {
  _id: string;
  type: 'message' | 'group_invite' | 'announcement' | 'event_update' | 'confession_reply' | 'event_created' | 'group_join';
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  sender_id?: { _id: string; name: string; profile_picture: string };
  data?: any;
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (socket) {
      socket.on('notification', (newNotification: Notification) => {
        setNotifications((prev) => [newNotification, ...prev]);
      });
    }

    return () => {
      if (socket) {
        socket.off('notification');
      }
    };
  }, [socket]);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Navigation logic based on type
    switch (notification.type) {
      case 'message':
        if (notification.data?.conversation_id) {
          navigate(`/dashboard/chat/${notification.data.conversation_id}`);
        }
        break;
      case 'group_invite':
      case 'group_join':
        if (notification.data?.group_id) {
          navigate(`/dashboard/groups/${notification.data.group_id}`);
        }
        break;
      case 'event_update':
      case 'event_created':
        navigate('/dashboard/events');
        break;
      case 'confession_reply':
        navigate('/dashboard/confessions');
        break;
      case 'announcement':
        navigate('/dashboard/announcements');
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-5 h-5 text-sky-500" />;
      case 'group_invite':
      case 'group_join':
        return <Users className="w-5 h-5 text-orange-500" />;
      case 'announcement':
        return <Megaphone className="w-5 h-5 text-blue-500" />;
      case 'event_update':
      case 'event_created':
        return <Calendar className="w-5 h-5 text-green-500" />;
      case 'confession_reply':
        return <Ghost className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSecs < 60) return 'just now';
    if (diffInSecs < 3600) return `${Math.floor(diffInSecs / 60)}m ago`;
    if (diffInSecs < 86400) return `${Math.floor(diffInSecs / 3600)}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-slate-100 px-4 py-4 flex items-center gap-4 z-10 shrink-0">
        <button 
          onClick={() => navigate('/dashboard')}
          title="Back to Dashboard"
          className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-sky-500 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Notifications</h1>
        </div>
        {notifications.some(n => !n.read) && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-sky-100 transition-colors"
          >
            <Check className="w-4 h-4" /> Mark all read
          </button>
        )}
      </header>

      {/* List */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {loading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-3xl" />
          ))
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mb-6 text-slate-300">
              <Bell className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">No notifications yet</h3>
            <p className="text-sm text-slate-400 max-w-[240px]">We'll let you know when something important happens!</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleNotificationClick(n)}
              className={clsx(
                "p-5 rounded-[2rem] border transition-all cursor-pointer group hover:scale-[1.01] active:scale-[0.99] relative",
                !n.read 
                  ? "bg-white border-sky-100 shadow-lg shadow-sky-500/5 ring-4 ring-sky-500/5" 
                  : "bg-slate-50/50 border-slate-100 opacity-80 hover:opacity-100"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon/Avatar Container */}
                <div className="relative shrink-0">
                  <div className={clsx(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    !n.read ? "bg-white shadow-sm" : "bg-slate-100"
                  )}>
                    {n.sender_id ? (
                      <img 
                        src={getMediaUrl(n.sender_id.profile_picture) || `https://ui-avatars.com/api/?name=${n.sender_id.name}&background=0EA5E9&color=fff`} 
                        alt={n.sender_id.name}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      getNotificationIcon(n.type)
                    )}
                  </div>
                  {/* Small Type Icon if it's a user action */}
                  {n.sender_id && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white shadow-md border border-slate-50 flex items-center justify-center">
                      {getNotificationIcon(n.type)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={clsx(
                      "text-sm font-black tracking-tight truncate pr-4",
                      !n.read ? "text-slate-800" : "text-slate-500"
                    )}>
                      {n.title}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {getTimeAgo(n.created_at)}
                    </span>
                  </div>
                  <p className={clsx(
                    "text-xs leading-relaxed line-clamp-2",
                    !n.read ? "text-slate-600 font-medium" : "text-slate-400"
                  )}>
                    {n.body}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={(e) => deleteNotification(n._id, e)}
                    className="p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {!n.read && (
                    <div className="w-2.5 h-2.5 bg-sky-500 rounded-full shadow-lg shadow-sky-500/50 self-end m-2"></div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default NotificationsPage;
