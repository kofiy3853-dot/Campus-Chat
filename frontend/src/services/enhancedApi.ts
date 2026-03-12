import api from './api';

// Message Services
export const messageService = {
  search: (conversationId: string, query?: string, messageType?: string) =>
    api.get('/api/chat/search', {
      params: { conversationId, query, messageType },
    }),

  editMessage: (messageId: string, message_text: string) =>
    api.put(`/api/chat/messages/${messageId}`, { message_text }),

  deleteMessage: (messageId: string) =>
    api.delete(`/api/chat/messages/${messageId}`),

  addReaction: (messageId: string, emoji: string) =>
    api.post(`/api/chat/messages/${messageId}/reaction`, { emoji }),
};

// User Services
export const userService = {
  blockUser: (userId: string) =>
    api.post(`/api/chat/block/${userId}`),

  getBlockedUsers: () =>
    api.get('/api/chat/blocked-users'),
};

// Notification Services
export const notificationService = {
  getNotifications: () =>
    api.get('/api/notifications'),

  getUnreadCount: () =>
    api.get('/api/notifications/unread-count'),

  markAsRead: (notificationId: string) =>
    api.put(`/api/notifications/${notificationId}/read`),

  markAllAsRead: () =>
    api.put('/api/notifications/read-all'),

  deleteNotification: (notificationId: string) =>
    api.delete(`/api/notifications/${notificationId}`),

  registerDeviceToken: (token: string, device_type: 'web' | 'mobile' | 'desktop' = 'web') =>
    api.post('/api/notifications/device-token', { token, device_type }),

  updatePreferences: (preferences: {
    email_notifications?: boolean;
    browser_notifications?: boolean;
  }) =>
    api.put('/api/notifications/preferences', preferences),
};

// Rate limiting aware functions
export const createRateLimitedSearch = (conversationId: string) => {
  let lastSearch = 0;
  const DEBOUNCE_MS = 500;

  return (query?: string, messageType?: string) => {
    const now = Date.now();
    if (now - lastSearch < DEBOUNCE_MS) {
      return null;
    }
    lastSearch = now;
    return messageService.search(conversationId, query, messageType);
  };
};
