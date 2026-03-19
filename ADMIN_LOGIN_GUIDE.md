# 👨‍💼 Admin Login & Access Guide

**Date**: March 13, 2026  
**Status**: ✅ Complete  

---

## 🔐 Admin Credentials

### Known Admin Users in Database

```
Email: admin@hms.com
ID: 696dde141a37a3ae0d875087
```

### Other Test Users (Regular Users)
```
Email: nharnahyhaw19@gmail.com
Name: Ofosu Stephen

Email: kofiy3853@gmail.com
Name: Junior Prime

Email: olivia551719@gmail.com
Name: Nana yaw
```

---

## 🚀 How to Login as Admin

### Step 1: Go to Login Page
```
http://localhost:5173/login
```

### Step 2: Enter Admin Credentials
```
Email: admin@hms.com
Password: [Try common passwords or check database]
```

### Step 3: Click Sign In
- Wait for authentication
- Should redirect to dashboard

### Step 4: Access Admin Dashboard
```
http://localhost:5173/dashboard/admin
```

---

## ⚠️ If Login Fails

### Issue: "Invalid email or password"

**Solution 1: Check Password**
- Try common passwords: `password`, `admin123`, `123456`
- Check database for password hash
- Reset password in database if needed

**Solution 2: Create New Admin User**
```bash
# Connect to MongoDB
# Find admin@hms.com user
# Update role to "admin"
# Or create new user with admin role
```

**Solution 3: Promote Existing User**
1. Login as regular user
2. Ask another admin to promote you
3. Or use database to set role: "admin"

---

## 🔧 How to Create Admin User

### Method 1: Database Update
```javascript
// MongoDB
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)
```

### Method 2: Register & Promote
1. Register new account
2. Login as existing admin
3. Go to admin dashboard
4. Find new user
5. Click Crown icon to promote

### Method 3: Direct Database Insert
```javascript
db.users.insertOne({
  name: "Admin User",
  email: "admin@example.com",
  student_id: "00001",
  password_hash: "[hashed_password]",
  role: "admin",
  department: "Admin",
  level: "Admin",
  status: "online",
  isBanned: false
})
```

---

## 🔑 Password Reset

### If You Forgot Admin Password

**Option 1: Reset in Database**
```javascript
// MongoDB
const bcrypt = require('bcryptjs');
const newPassword = await bcrypt.hash('newpassword123', 10);

db.users.updateOne(
  { email: "admin@hms.com" },
  { $set: { password_hash: newPassword } }
)
```

**Option 2: Create New Admin Account**
1. Register new account
2. Update role to admin in database
3. Use new account to login

**Option 3: Contact System Administrator**
- Ask for password reset
- Verify identity
- Get temporary password

---

## 🎯 Admin Dashboard Access

### URL
```
http://localhost:5173/dashboard/admin
```

### Requirements
- ✅ Must be logged in
- ✅ User role must be "admin"
- ✅ Account must not be banned

### What You Can Do
- ✅ View all users
- ✅ Search users
- ✅ Ban/unban users
- ✅ Promote/demote users
- ✅ Delete users
- ✅ View statistics

---

## 🔍 Verify Admin Status

### Check in Frontend
1. Login with admin account
2. Go to `/dashboard/admin`
3. If you see admin dashboard → You're admin ✅
4. If you see "Access Denied" → You're not admin ❌

### Check in Database
```javascript
// MongoDB
db.users.findOne({ email: "admin@hms.com" })

// Look for:
// "role": "admin"
// "isBanned": false
```

### Check in Browser Console
```javascript
// Open DevTools (F12)
// Go to Console
// Type:
JSON.parse(localStorage.getItem('user'))

// Look for:
// "role": "admin"
```

---

## 🚨 Troubleshooting

### Issue 1: Cannot Access Admin Dashboard
**Cause**: Not logged in or not admin  
**Solution**:
1. Login first
2. Check if role is "admin"
3. Promote account if needed

### Issue 2: "Access Denied" Message
**Cause**: User role is not "admin"  
**Solution**:
1. Ask another admin to promote you
2. Or update database directly
3. Or create new admin account

### Issue 3: Admin Account Banned
**Cause**: Account was banned  
**Solution**:
1. Ask another admin to unban
2. Or update database: `isBanned: false`
3. Or create new admin account

### Issue 4: Forgot Admin Password
**Cause**: Password lost  
**Solution**:
1. Reset in database
2. Or create new admin account
3. Or ask system administrator

### Issue 5: Delete Function Not Working
**Cause**: Possible issues:
- User ID invalid
- User not found
- Permission denied
- Network error

**Solution**:
1. Check browser console for error
2. Check backend logs
3. Verify user exists
4. Try again

---

## 🔐 Security Best Practices

### For Admin Accounts
- ✅ Use strong passwords
- ✅ Don't share credentials
- ✅ Change password regularly
- ✅ Monitor admin actions
- ✅ Audit user changes

### For Admin Dashboard
- ✅ Only promote trusted users
- ✅ Ban users who violate policies
- ✅ Delete accounts carefully
- ✅ Document all actions
- ✅ Review logs regularly

---

## 📋 Admin Checklist

### Initial Setup
- [ ] Identify admin user in database
- [ ] Verify admin role is set
- [ ] Test login with admin account
- [ ] Access admin dashboard
- [ ] Verify all functions work

### Regular Maintenance
- [ ] Review user list
- [ ] Check for banned users
- [ ] Monitor admin count
- [ ] Audit recent changes
- [ ] Update security settings

### Troubleshooting
- [ ] Check database for admin users
- [ ] Verify role is "admin"
- [ ] Check if account is banned
- [ ] Review error messages
- [ ] Check backend logs

---

## 🔌 API Endpoints (Admin Only)

### Get All Users
```
GET /api/admin/users
Authorization: Bearer [token]
```

### Get Statistics
```
GET /api/admin/stats
Authorization: Bearer [token]
```

### Delete User
```
DELETE /api/admin/users/:id
Authorization: Bearer [token]
```

### Ban/Unban User
```
PATCH /api/admin/users/:id/ban
Authorization: Bearer [token]
```

### Promote/Demote User
```
PATCH /api/admin/users/:id/promote
Authorization: Bearer [token]
```

---

## 📊 Admin User Database Schema

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  student_id: String,
  password_hash: String,
  department: String,
  level: String,
  profile_picture: String,
  status: String,
  last_seen: Date,
  role: "admin",           // Must be "admin"
  isBanned: false,         // Must be false
  blocked_users: [],
  notification_preferences: {},
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎓 Files Related to Admin

### Frontend
- `frontend/src/pages/AdminPage.tsx` - Admin dashboard UI
- `frontend/src/context/AuthContext.tsx` - Auth context

### Backend
- `backend/src/controllers/adminController.ts` - Admin functions
- `backend/src/routes/adminRoutes.ts` - Admin routes
- `backend/src/middleware/adminMiddleware.ts` - Admin authorization
- `backend/src/models/User.ts` - User model with role field

---

## ✅ Verification Steps

### Step 1: Verify Admin User Exists
```javascript
// MongoDB
db.users.findOne({ role: "admin" })
// Should return admin user
```

### Step 2: Verify Admin Can Login
1. Go to login page
2. Enter admin credentials
3. Should redirect to dashboard

### Step 3: Verify Admin Dashboard Works
1. Go to `/dashboard/admin`
2. Should see admin dashboard
3. Should see user list and statistics

### Step 4: Verify Admin Functions Work
1. Try to search users
2. Try to ban a user
3. Try to promote a user
4. Try to delete a user (cancel before confirming)

---

## 🎉 Summary

### Admin Login
- Email: `admin@hms.com`
- Password: [Check database or reset]
- URL: `http://localhost:5173/login`

### Admin Dashboard
- URL: `http://localhost:5173/dashboard/admin`
- Requires: Admin role
- Features: Manage users, ban, promote, delete

### If Issues
- Check database for admin users
- Verify role is "admin"
- Reset password if needed
- Create new admin account if necessary

---

**Last Updated**: March 13, 2026  
**Status**: ✅ Complete
