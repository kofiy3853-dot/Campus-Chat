# 🔐 Campus Chat - Login Troubleshooting Guide

**Date**: March 13, 2026  
**Issue**: Login not working  

---

## 🔍 Diagnosis Steps

### Step 1: Check Backend Server
```bash
# Verify backend is running
npm run dev --prefix backend

# Expected output:
# [Server] Listening on port 5000
# [Server] MongoDB connected
# [Server] Redis connection task finished
```

**Checklist:**
- [ ] Backend server started
- [ ] MongoDB connected
- [ ] Redis connected
- [ ] No error messages

### Step 2: Check Frontend Connection
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to login
4. Look for POST request to `/api/auth/login`

**Expected:**
- [ ] Request shows in Network tab
- [ ] Status code 200 (success) or 401 (wrong credentials)
- [ ] Response contains token

### Step 3: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Try to login
4. Look for error messages

**Common errors:**
- `CORS error` → Backend CORS not configured
- `Network error` → Backend not running
- `401 Unauthorized` → Wrong email/password
- `500 Internal Server Error` → Database issue

---

## 🐛 Common Issues & Solutions

### Issue 1: "Network Error" or "Cannot reach server"

**Cause**: Backend server not running or wrong URL

**Solution:**
```bash
# 1. Start backend
npm run dev --prefix backend

# 2. Check if running on port 5000
# Open http://localhost:5000 in browser
# Should see: "Campus Chat API is running..."

# 3. Check frontend API URL
# File: frontend/src/services/api.ts
# Should have: baseURL: 'http://localhost:5000'
```

### Issue 2: "Invalid email or password"

**Cause**: Wrong credentials or user doesn't exist

**Solution:**
```
Test users in database:
- Email: nharnahyhaw19@gmail.com
- Email: kofiy3853@gmail.com
- Email: olivia551719@gmail.com

Try registering a new account:
1. Go to /register page
2. Fill in form
3. Click "Create account"
4. Then try logging in
```

### Issue 3: "CORS Error"

**Cause**: Backend CORS not allowing frontend requests

**Solution:**
Check `backend/src/server.ts`:
```tsx
const allowedOrigins = [
  'http://localhost:5173',  // Frontend dev server
  'http://localhost:3000',
  'https://campus-chat-fjxp.vercel.app',
];

// Should include your frontend URL
```

### Issue 4: "500 Internal Server Error"

**Cause**: Database connection issue or server error

**Solution:**
```bash
# 1. Check MongoDB connection
# In backend/src/server.ts, look for:
# [Server] MongoDB connected

# 2. Check .env file
# backend/.env should have:
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key

# 3. Check logs
# Look at backend console for error messages
```

### Issue 5: "Token not saved" or "Still on login page after login"

**Cause**: Token not being stored in localStorage

**Solution:**
Check `frontend/src/context/AuthContext.tsx`:
```tsx
const login = (userData: any) => {
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('token', userData.token);
  setUser(userData);
};
```

Verify in DevTools:
1. Open DevTools (F12)
2. Go to Application tab
3. Click Local Storage
4. Check if `token` and `user` are saved

---

## 🔧 Step-by-Step Debug Process

### Step 1: Verify Backend is Running
```bash
npm run dev --prefix backend
```

**Expected output:**
```
[Server] Listening on port 5000 (on all interfaces)
[Server] Connecting to Redis...
[Server] Connecting to MongoDB...
[Server] MongoDB connected
[Server] Redis connection task finished
```

### Step 2: Test Login Endpoint with cURL
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nharnahyhaw19@gmail.com","password":"your_password"}'
```

**Expected response:**
```json
{
  "_id": "...",
  "name": "Ofosu Stephen",
  "email": "nharnahyhaw19@gmail.com",
  "token": "eyJhbGc..."
}
```

### Step 3: Check Frontend API Configuration
File: `frontend/src/services/api.ts`

```tsx
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Step 4: Monitor Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Try to login
4. Look for POST `/api/auth/login`
5. Check:
   - Request headers
   - Request body
   - Response status
   - Response body

### Step 5: Check Browser Storage
1. Open DevTools (F12)
2. Go to Application tab
3. Click Local Storage
4. Check for:
   - `token` key
   - `user` key

---

## 📋 Checklist for Login to Work

### Backend Requirements
- [ ] Backend server running on port 5000
- [ ] MongoDB connected
- [ ] Redis connected (or fallback working)
- [ ] JWT_SECRET configured in .env
- [ ] CORS configured for frontend URL
- [ ] Auth routes registered
- [ ] Auth controller implemented
- [ ] User model has comparePassword method

### Frontend Requirements
- [ ] Frontend running on port 5173
- [ ] API baseURL set to http://localhost:5000
- [ ] AuthContext implemented
- [ ] Login page component created
- [ ] localStorage working
- [ ] Token stored after login
- [ ] User redirected to dashboard

### Database Requirements
- [ ] MongoDB running
- [ ] Database has users collection
- [ ] User has email and password_hash fields
- [ ] Password is hashed (bcrypt)

---

## 🧪 Test Login Flow

### Test 1: Register New User
1. Go to http://localhost:5173/register
2. Fill in form:
   - Name: Test User
   - Email: test@example.com
   - Student ID: 12345
   - Password: password123
   - Department: CS
   - Level: 100
3. Click "Create account"
4. Should see success message
5. Should be redirected to dashboard

### Test 2: Login with New User
1. Go to http://localhost:5173/login
2. Enter:
   - Email: test@example.com
   - Password: password123
3. Click "Sign In"
4. Should see loading spinner
5. Should be redirected to dashboard
6. Should see user name in profile

### Test 3: Login with Existing User
1. Go to http://localhost:5173/login
2. Enter:
   - Email: nharnahyhaw19@gmail.com
   - Password: (try common passwords)
3. Click "Sign In"
4. If fails, try registering new account

---

## 🔐 Password Reset

If you forgot the password for existing users:

### Option 1: Register New Account
1. Go to /register
2. Create new account with different email
3. Use that account to login

### Option 2: Reset in Database
```bash
# Connect to MongoDB
# Find user by email
# Update password_hash with new hashed password
# (Requires MongoDB access)
```

---

## 📊 Login Flow Diagram

```
User enters email/password
         ↓
Frontend sends POST /api/auth/login
         ↓
Backend receives request
         ↓
Backend queries MongoDB for user
         ↓
User found? → No → Return 401 "Invalid email or password"
         ↓ Yes
Compare password with hash
         ↓
Password matches? → No → Return 401 "Invalid email or password"
         ↓ Yes
Generate JWT token
         ↓
Return user data + token
         ↓
Frontend stores token in localStorage
         ↓
Frontend stores user in localStorage
         ↓
Frontend redirects to /dashboard
         ↓
Dashboard loads with user data
```

---

## 🆘 Still Not Working?

### Check These Files
1. **Backend**
   - `backend/src/controllers/authController.ts` - Login logic
   - `backend/src/routes/authRoutes.ts` - Routes
   - `backend/src/models/User.ts` - User model
   - `backend/.env` - Configuration

2. **Frontend**
   - `frontend/src/pages/Login.tsx` - Login page
   - `frontend/src/context/AuthContext.tsx` - Auth context
   - `frontend/src/services/api.ts` - API configuration

### Enable Debug Logging
Add to `backend/src/controllers/authController.ts`:
```tsx
console.log('[Auth] Login attempt for:', email);
console.log('[Auth] User found:', user);
console.log('[Auth] Password match:', isMatch);
console.log('[Auth] Token generated:', token);
```

Then check backend console for detailed logs.

### Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Try to login
4. Click on POST `/api/auth/login`
5. Check:
   - Request URL
   - Request headers
   - Request body
   - Response status
   - Response body

---

## 📞 Quick Fixes

### Fix 1: Backend Not Running
```bash
npm run dev --prefix backend
```

### Fix 2: Frontend Not Running
```bash
npm run dev --prefix frontend
```

### Fix 3: Wrong API URL
Edit `frontend/src/services/api.ts`:
```tsx
baseURL: 'http://localhost:5000'
```

### Fix 4: MongoDB Not Connected
Check `backend/.env`:
```
MONGODB_URI=mongodb://...
```

### Fix 5: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty cache and hard refresh"

---

## ✅ Success Indicators

Login is working when:
- ✅ No error messages in console
- ✅ POST request returns 200 status
- ✅ Response contains token
- ✅ Token stored in localStorage
- ✅ User redirected to dashboard
- ✅ User name displayed in profile
- ✅ Can send messages
- ✅ Can view chats

---

## 📋 Final Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] MongoDB connected
- [ ] Redis connected
- [ ] .env configured
- [ ] CORS configured
- [ ] User exists in database
- [ ] Password correct
- [ ] No console errors
- [ ] Network request successful
- [ ] Token stored in localStorage
- [ ] User redirected to dashboard

---

**Status**: Troubleshooting Guide Ready  
**Last Updated**: March 13, 2026
