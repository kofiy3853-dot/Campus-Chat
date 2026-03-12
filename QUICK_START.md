# 🚀 Quick Start Guide - New Features

## 1️⃣ Start the Server

```bash
cd backend
npm run build
npm run dev     # or npm start for production
```

Expected output:
```
[Socket] Shared presence updated for [userId]
Redis connected successfully
Campus Chat API is running...
```

## 2️⃣ Start the Frontend

```bash
cd frontend
npm run dev
```

Access at: `http://localhost:5173`

---

## 3️⃣ Try Each Feature

### Feature 1: Send a Message
1. Log in with test account
2. Open a chat
3. Send a message
✅ Message appears in real-time

### Feature 2: Add a Reaction
1. Send or receive a message
2. **Hover over the message**
3. Click the **😊 Smile icon** in the popup menu
4. Select an emoji (👍 ❤️ 😂 😮 😢 🔥)
✅ Emoji reaction appears under message

### Feature 3: Edit a Message
1. Send a message
2. **Hover over it**
3. Click the **✏️ Pencil icon**
4. Edit the text
5. Click **Save**
✅ Message updates with "(edited)" indicator

### Feature 4: Delete a Message
1. Send a message
2. **Hover over it**
3. Click the **🗑️ Trash icon**
✅ Message shows "[Message deleted]"

### Feature 5: Search Messages
1. Open a chat
2. Click the **🔍 Search icon** (or use menu)
3. Type search query, e.g., "hello"
4. Optional: Filter by type (Text/Images/Files/Voice)
✅ Search results appear below

### Feature 6: Block a User
1. Open a conversation
2. Click the **⋯ More** menu on the chat header
3. Select "Block User"
✅ User is blocked, cannot message

### Feature 7: View Notifications
1. Look for the **🔔 Bell icon** in the top right
2. If you have unread notifications, a **red badge** shows the count
3. Click the bell to open the dropdown
4. Click a notification to mark it as read
✅ Notifications appear in real-time

### Feature 8: Upload an Image
1. Click the **📎 Attachment icon** in chat input
2. Select an image
3. Send the message
✅ Image shows as thumbnail, click to view full size

### Feature 9: Upload a Voice Message
1. Click the **🎤 Microphone icon** (if available)
2. Record or select an audio file
3. Send the message
✅ Audio player appears with controls

### Feature 10: Test Rate Limiting
⚠️ **For testing only** - Send 6 messages in 1 second:
```
Expected: 429 Too Many Requests error on 6th message
```

---

## 📋 What's Working

| Feature | Status | Location |
|---------|--------|----------|
| Message Reactions | ✅ | Chat message hover menu |
| Message Edit | ✅ | Chat message hover menu |
| Message Delete | ✅ | Chat message hover menu |
| Search Messages | ✅ | Chat header menu |
| Block User | ✅ | Chat header menu |
| View Blocked Users | ✅ | Settings → Block List |
| Notifications | ✅ | Top right bell icon |
| Image Thumbnail | ✅ | Chat message area |
| Voice Player | ✅ | Chat message area |
| Rate Limiting | ✅ | Automatic (429 response) |

---

## 🐛 If Something Doesn't Work

### Reactions Not Appearing
```javascript
// Open console (F12) and check:
// 1. Socket connected?
console.log(socket?.connected)

// 2. In the right room?
socket?.emit('join_room', conversationId)

// 3. Try adding reaction again
```

### Messages Not Editing
```javascript
// Check network tab in DevTools
// Should see PUT request to /api/chat/messages/:id
// Should return 200 with updated message
```

### Search Not Working
```javascript
// Check that conversationId is correct
// Should see GET request to /api/chat/search
// If 429: Too many searches, wait a minute
```

### Notifications Not Appearing
```javascript
// Check browser notification permissions
// Check that socket is connected to notification room
// Look for "notification" events in Socket.io tab (if available)
```

---

## 📱 UI Locations

### Header/Top Right
- 🔔 **Notifications** - Bell icon with unread count

### Chat Window Header
- ⋯ **More Options**
  - 🔍 Search
  - 🚫 Block User
  - ⚙️ Settings

### Message (On Hover)
- 😊 **Add Reaction** - Emoji picker
- ✏️ **Edit** - Edit message (own only)
- 🗑️ **Delete** - Delete message (own only)

### Chat Input
- 📎 **Attachment** - Upload image/file
- 🎤 **Record** - Voice message (if available)

---

## 🔧 Developer Console Tricks

### Check Socket Connection
```javascript
socket?.emit('message_reaction', { 
  messageId: 'xxx', 
  emoji: '👍', 
  roomId: 'conversation-id' 
})
```

### Manually Add Notification
```javascript
fetch('http://localhost:5000/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test',
    body: 'Test notification'
  })
})
```

### Check Rate Limit Status
```javascript
// Look at response headers for rate limit info
// Or open Network tab and see 429 responses
```

---

## ✨ Pro Tips

1. **Multiple Windows**: Open same chat in 2 browser windows
   - Send message in window 1
   - See reaction in real-time in window 2

2. **Test Blocking**: 
   - Block user A
   - They won't see your new messages
   - Unblock to restore

3. **Search Speed**:
   - Uses debounce (500ms) to avoid spam
   - Type slowly to see results update

4. **Notification Center**:
   - Bell shows unread count
   - Click "Mark all as read" to clear

5. **Image Uploads**:
   - Supports: JPG, PNG, GIF, WebP
   - Max 25MB per file
   - Thumbnail loads faster

---

## 📞 Need Help?

Check these files:
- `IMPLEMENTATION_GUIDE.md` - Detailed feature docs
- `INTEGRATION_CHECKLIST.md` - Troubleshooting guide
- `COMPLETION_SUMMARY.md` - Overview of all changes

---

**Happy testing! 🎉**

Last updated: March 12, 2026
