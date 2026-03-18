# 🔧 Fix 404 Error - Backend Connection Issue

**Date**: March 13, 2026  
**Issue**: Failed to load resource: the server responded with a status of 404  
**Cause**: Frontend cannot reach backend API  

---

## 🎯 Quick Fix

### Option 1: Local Development (Recommended)

#### Step 1: Update Backend .env
File: `backend/.env`

```env
PORT=5000
MONGODB_URI=mongodb+srv://kofiy3853_db_user:Nharnah12@cluster0.kckospz.mongodb.net/?appName=Cluster0
REDIS_URL=rediss://default:gQAAAAAAARSRAAIncDEzMjMzMTRmNzgwYTU0MGNiYWNkYzM0YTkxYTA0NWJhOXAxNzA4MDE@absolute-tomcat-70801.upstash.io:6379
NODE_ENV=development
```

**Changes:**
- `PORT=5000` (changed from 6000)
- `NODE_ENV=development` (changed from production)

#### Step 2: Update Frontend .env.local
Create file: `frontend/.env.local`

```env
VITE_API_URL=http://localhost:5000
```

**Why:** This overrides `.env.production` during development

#### Step 3: Start Backend
```bash
npm run dev --prefix backend
```

**Expected output:**
```
[Server] Listening on port 5000 (on all interfaces)
[Server] MongoDB connected
[Server] Redis connection task finished
```

#### Step 4: Start Frontend
```bash
npm run dev --prefix frontend
```

**Expected output:**
```
VITE v6.4.1 building for production...
Local: http://localhost:5173/
```

#### Step 5: Test Login
1. Open http://localhost:5173
2. Go to login page
3. Try to login
4. Should work now!

---

### Option 2: Production Deployment

If you want to deploy to production:

#### Step 1: Deploy Backend
```bash
# Build backend
npm run build --prefix backend

# Deploy to Render, Heroku, or your hosting
# Get the deployed URL (e.g., https://campus-chat-dhlr.onrender.com)
```

#### Step 2: Update Frontend .env.production
File: `frontend/.env.production`

```env
VITE_API_URL=https://campus-chat-dhlr.onrender.com
```

**Replace** `https://campus-chat-dhlr.onrender.com` with your actual backend URL

#### Step 3: Build Frontend
```bash
npm run build --prefix frontend
```

#### Step 4: Deploy Frontend
Deploy the `frontend/dist` folder to your hosting

---

## 🔍 Diagnosis

### Check 1: Is Backend Running?
```bash
# Try to access backend directly
curl http://localhost:5000

# Expected response:
# Campus Chat API is running...
```

### Check 2: Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Try to login
4. Look for failed requests
5. Check the URL being called

**Example:**
- ❌ Wrong: `https://campus-chat-dhlr.onrender.com/api/auth/login` (404)
- ✅ Correct: `http://localhost:5000/api/auth/login` (200)

### Check 3: Check Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for error messages

**Common errors:**
- `VITE_API_URL is not defined` → Missing .env.local
- `404 Not Found` → Backend not running or wrong URL
- `CORS error` → Backend CORS not configured

---

## 📋 Complete Setup Guide

### For Local Development

#### 1. Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies (if not done)
npm install

# Create/update .env
# PORT=5000
# NODE_ENV=development
# MONGODB_URI=your_mongodb_uri
# REDIS_URL=your_redis_url

# Start backend
npm run dev
```

#### 2. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies (if not done)
npm install

# Create .env.local
# VITE_API_URL=http://localhost:5000

# Start frontend
npm run dev
```

#### 3. Test
- Open http://localhost:5173
- Try to login
- Check DevTools Network tab
- Should see successful API calls

---

## 🐛 Troubleshooting

### Problem: Still Getting 404

**Solution 1: Check Backend is Running**
```bash
# In new terminal
npm run dev --prefix backend

# Should see:
# [Server] Listening on port 5000
```

**Solution 2: Check Frontend .env.local**
```bash
# File: frontend/.env.local
VITE_API_URL=http://localhost:5000
```

**Solution 3: Clear Cache**
```bash
# Stop frontend dev server (Ctrl+C)
# Delete node_modules/.vite
# Restart: npm run dev --prefix frontend
```

**Solution 4: Check Port**
```bash
# Make sure port 5000 is not in use
# If it is, change to different port:
# backend/.env: PORT=5001
# frontend/.env.local: VITE_API_URL=http://localhost:5001
```

### Problem: CORS Error

**Solution:**
Check `backend/src/server.ts`:
```tsx
const allowedOrigins = [
  'http://localhost:5173',  // Add this
  'http://localhost:3000',
];
```

### Problem: MongoDB Connection Error

**Solution:**
Check `backend/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0
```

Make sure:
- Username and password are correct
- IP address is whitelisted in MongoDB Atlas
- Connection string is valid

---

## ✅ Verification Checklist

### Backend
- [ ] Backend running on port 5000
- [ ] MongoDB connected
- [ ] Redis connected
- [ ] No error messages
- [ ] Can access http://localhost:5000

### Frontend
- [ ] Frontend running on port 5173
- [ ] .env.local created with VITE_API_URL
- [ ] No error messages
- [ ] Can access http://localhost:5173

### Network
- [ ] POST /api/auth/login returns 200
- [ ] Response contains token
- [ ] No CORS errors
- [ ] No 404 errors

### Browser
- [ ] No console errors
- [ ] Network tab shows successful requests
- [ ] LocalStorage has token and user
- [ ] Can login successfully

---

## 🚀 Next Steps

1. **Update backend/.env**
   - Change PORT to 5000
   - Change NODE_ENV to development

2. **Create frontend/.env.local**
   - Add VITE_API_URL=http://localhost:5000

3. **Start backend**
   ```bash
   npm run dev --prefix backend
   ```

4. **Start frontend**
   ```bash
   npm run dev --prefix frontend
   ```

5. **Test login**
   - Open http://localhost:5173
   - Try to login
   - Should work!

---

## 📞 Still Not Working?

### Check These Files
1. `backend/.env` - PORT and NODE_ENV
2. `frontend/.env.local` - VITE_API_URL
3. `backend/src/server.ts` - CORS configuration
4. `frontend/src/services/api.ts` - API baseURL

### Enable Debug Logging
Add to `frontend/src/services/api.ts`:
```tsx
console.log('API URL:', API_URL);
console.log('Making request to:', config.url);
```

### Check Network Requests
1. Open DevTools (F12)
2. Network tab
3. Try to login
4. Click on POST request
5. Check:
   - Request URL
   - Request headers
   - Response status
   - Response body

---

## 📊 Environment Configuration

### Development
```
Backend:  http://localhost:5000
Frontend: http://localhost:5173
.env:     backend/.env (PORT=5000, NODE_ENV=development)
.env:     frontend/.env.local (VITE_API_URL=http://localhost:5000)
```

### Production
```
Backend:  https://your-backend.onrender.com
Frontend: https://your-frontend.vercel.com
.env:     backend/.env (PORT=5000, NODE_ENV=production)
.env:     frontend/.env.production (VITE_API_URL=https://your-backend.onrender.com)
```

---

**Status**: Fix Guide Ready  
**Last Updated**: March 13, 2026
