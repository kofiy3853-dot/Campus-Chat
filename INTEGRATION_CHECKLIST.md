# 🚀 Integration Checklist - Campus Chat Enhancements

## Backend Setup

- [ ] **Message Model Updates**
  - [ ] Added `reactions` array field
  - [ ] Added `edited_at` timestamp
  - [ ] Added `is_deleted` boolean
  - [ ] Added `media_thumbnail` field
  - [ ] File: `src/models/Message.ts`

- [ ] **User Model Updates**
  - [ ] Added `blocked_users` array
  - [ ] Added `notification_preferences` object
  - [ ] File: `src/models/User.ts`

- [ ] **New Models Created**
  - [ ] `Notification.ts` - Notification schema with 30-day TTL
  - [ ] `DeviceToken.ts` - Device token tracking

- [ ] **New Controllers**
  - [ ] `notificationController.ts` - 7 notification methods
  - [ ] `chatController.ts` - Updated with 6 new methods

- [ ] **New Routes**
  - [ ] `notificationRoutes.ts` - 7 new endpoints
  - [ ] `chatRoutes.ts` - Updated with 6 new endpoints

- [ ] **Middleware**
  - [ ] `rateLimitMiddleware.ts` - Rate limiting implementation
  - [ ] Applied to `server.ts`

- [ ] **Socket.io Updates**
  - [ ] `message_reaction` event
  - [ ] `message_edited` event
  - [ ] `message_deleted` event
  - [ ] `new_notification` event
  - [ ] Notification room joins

- [ ] **Server Configuration**
  - [ ] Import notification routes
  - [ ] Apply general rate limiter
  - [ ] Register notification endpoints

## Frontend Setup

- [ ] **Component Updates**
  - [ ] `ChatMessage.tsx` - Major refactor with:
    - [ ] Reaction picker UI
    - [ ] Edit message functionality
    - [ ] Delete message functionality
    - [ ] Reaction display
    - [ ] Image preview with thumbnail
    - [ ] Audio player support
    - [ ] Edit indicator

- [ ] **New Components Created**
  - [ ] `NotificationCenter.tsx` - Bell icon + dropdown
  - [ ] `MessageSearch.tsx` - Search UI with filters
  - [ ] `BlockList.tsx` - Block management modal

- [ ] **Service Layer**
  - [ ] `enhancedApi.ts` - New service functions for:
    - [ ] Message operations (search, edit, delete, react)
    - [ ] User operations (block)
    - [ ] Notification operations (get, mark read, delete)
    - [ ] Client-side rate limiting

## Integration Steps

- [ ] **Install/Build Backend**
  ```bash
  cd backend
  npm install
  npm run build
  ```

- [ ] **Database Indices** (Optional but recommended)
  ```javascript
  // MongoDB Compass or mongosh
  db.messages.createIndex({ "conversation_id": 1, "timestamp": -1 });
  db.messages.createIndex({ "message_text": "text" });
  db.notifications.createIndex({ "user_id": 1, "created_at": -1 });
  ```

- [ ] **Start Backend**
  ```bash
  npm run dev
  # or
  npm start
  ```

- [ ] **Test Backend Endpoints**
  - [ ] `GET /api/chat/search?conversationId=...&query=hello`
  - [ ] `POST /api/chat/messages/:id/reaction` with `{ emoji: "👍" }`
  - [ ] `PUT /api/chat/messages/:id` with new text
  - [ ] `DELETE /api/chat/messages/:id`
  - [ ] `GET /api/notifications`
  - [ ] `POST /api/chat/block/:userId`

- [ ] **Update Frontend**
  ```bash
  cd frontend
  npm install # if needed
  npm run dev
  ```

- [ ] **Add NotificationCenter to Layout**
  - In `NavSidebar.tsx` or header component:
  ```tsx
  import NotificationCenter from './NotificationCenter';
  
  // Add to header
  <NotificationCenter />
  ```

- [ ] **Verify Socket.io Events**
  - [ ] Open DevTools Console
  - [ ] Send message from one tab
  - [ ] Verify real-time reaction/edit/delete in other tab

## Testing Checklist

### Message Features
- [ ] Send and receive messages
- [ ] Add reaction to message
- [ ] Remove reaction by clicking same emoji
- [ ] Edit own message (shows pencil icon on hover)
- [ ] Delete own message (shows trash icon, soft deleted)
- [ ] Cannot edit/delete other users' messages
- [ ] Edited messages show "(edited)" indicator
- [ ] Deleted messages show "[Message deleted]" text

### Search Features
- [ ] Open search modal
- [ ] Search by text content
- [ ] Filter by message type (text/image/file/audio)
- [ ] Results appear in real-time
- [ ] Results count displays correctly
- [ ] Search respects rate limit (max 30/min)

### Blocking Features
- [ ] Block user from chat header or context menu
- [ ] Blocked user appears in Block List
- [ ] Unblock user from Block List
- [ ] Blocked users cannot message you
- [ ] Blocked conversation list updates

### Notifications
- [ ] Bell icon shows in header
- [ ] Unread count badge appears
- [ ] Click bell opens notification dropdown
- [ ] Notifications appear in real-time when new messages arrive
- [ ] Mark single notification as read
- [ ] Mark all notifications as read
- [ ] Delete notification
- [ ] Old notifications auto-delete after 30 days

### Image Preview
- [ ] Upload image to chat
- [ ] Thumbnail displays instead of full image initially
- [ ] Click image to see full size in new tab
- [ ] Hover shows preview effect
- [ ] Responsive on mobile/tablet

### Voice Messages
- [ ] Upload audio file to chat
- [ ] Audio player appears with controls
- [ ] Play/pause buttons work
- [ ] Seek bar works
- [ ] Volume control works
- [ ] Download option available

### Rate Limiting
- [ ] Send 5+ messages per second → 429 response
- [ ] Auth attempts > 5 in 15 min → 429 response
- [ ] Search > 30 times per minute → 429 response
- [ ] General endpoints > 100/min → 429 response

## Deployment Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] Backend environment variables set
- [ ] MongoDB indices created (recommended)
- [ ] Redis running (for rate limiting + presence)
- [ ] CORS origins updated in server.ts
- [ ] Frontend build completes: `npm run build`
- [ ] Build errors resolved
- [ ] Deploy to production servers
- [ ] Monitor error logs for issues
- [ ] Test in production environment
- [ ] Update documentation

## Rollback Steps (if needed)

If issues arise, rollback by:

1. **Backend**: Revert to previous commit or branch
2. **Frontend**: Revert to previous build
3. **Database**: No migrations needed (new fields are optional)
4. **Socket.io**: Old events still work, new ones ignored

---

## 📞 Support & Troubleshooting

### Common Issues

**Socket events not firing:**
- Ensure Socket.io connection is active
- Check browser console for connection errors
- Verify `userId` is passed in socket handshake

**Rate limit too strict:**
- Adjust limits in `rateLimitMiddleware.ts`
- Change `maxRequests` value for each limiter

**Notifications not appearing:**
- Check user is in notification room: `socket.join('notification:' + userId)`
- Verify notification is being created in database
- Check browser console for socket errors

**Reactions/edits not syncing:**
- Ensure socket event handlers are registered
- Check both clients are in same room
- Verify message ID is correct

---

**Status**: Ready for integration and testing
**Last Updated**: March 12, 2026
