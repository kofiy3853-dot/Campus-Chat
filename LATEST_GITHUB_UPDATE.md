# ✅ Latest GitHub Update - iPhone Fixes Pushed

**Date**: March 19, 2026  
**Status**: ✅ Successfully Pushed to GitHub  
**Commit**: `3f85222`  

---

## 📤 What Was Just Pushed

### New Commit
```
Commit: 3f85222
Message: fix: resolve iPhone connectivity issues by enabling Socket.IO polling fallback, increasing rate limits, and adding server pre-warming
Files Changed: 5
```

### Files Modified
1. **backend/src/middleware/rateLimitMiddleware.ts**
   - Increased general rate limit to 300 req/min for campus networks.

2. **frontend/src/context/SocketContext.tsx**
   - Enabled `polling` as a fallback transport for Socket.IO.

3. **frontend/src/services/api.ts**
   - Added `preWarmServer` logic to handle Render cold starts.
   - Improved timeout logging.

4. **frontend/src/App.tsx**
   - Integrated `preWarmServer` on app mount.

5. **frontend/index.html**
   - Enhanced diagnostic error alerts with device/platform info.

---

## ✅ Summary of Fixes
- ✅ **Mobile Connectivity**: Socket.IO now falls back to polling if WebSockets are blocked.
- ✅ **Cold Start Resilience**: Server is "pre-warmed" immediately on app load.
- ✅ **Campus Support**: Higher rate limits for shared IP environments.
- ✅ **Better Debugging**: Diagnostic alerts now show device context.

**Status**: ✅ All Changes Pushed Successfully
