# 👨‍💼 Campus Chat - Admin Dashboard Guide

**Date**: March 13, 2026  
**Status**: ✅ Complete & Functional  
**Access**: Admin users only  

---

## 🎯 Overview

The Admin Dashboard is a comprehensive management interface for Campus Chat administrators to manage users, roles, and access control.

### Features
- ✅ View all users with pagination
- ✅ Search users by name, email, or student ID
- ✅ Ban/unban users
- ✅ Promote/demote users to admin
- ✅ Delete users
- ✅ View statistics (total users, banned users, admin count)
- ✅ Real-time updates

---

## 📍 Access

### URL
```
http://localhost:5173/dashboard/admin
```

### Requirements
- ✅ Must be logged in
- ✅ User role must be `admin`
- ✅ Access denied message if not admin

### How to Access
1. Login with admin account
2. Navigate to `/dashboard/admin`
3. Or click Admin link in navigation (if available)

---

## 🎨 Dashboard Layout

### Header
```
Admin Dashboard
Manage users, roles, and access
```

### Statistics Cards (3 columns)
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Total Users     │  │ Banned Users    │  │ Admin Users     │
│ [Number]        │  │ [Number]        │  │ [Number]        │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Search Bar
```
🔍 Search by name, email or student ID...
```

### Users Table
```
User | Student ID | Dept/Level | Role | Status | Actions
─────────────────────────────────────────────────────────
[User data rows with action buttons]
```

### Pagination
```
< Page 1 of 5 >
```

---

## 📊 Statistics

### Total Users
- Count of all users in the system
- Updated in real-time

### Banned Users
- Count of users with `isBanned: true`
- Updated when users are banned/unbanned

### Admin Users
- Count of users with `role: admin`
- Updated when users are promoted/demoted

---

## 🔍 Search Functionality

### Search By
- **Name**: User's full name (case-insensitive)
- **Email**: User's email address
- **Student ID**: User's student ID

### Example Searches
```
"John" → Finds all users with "John" in name
"john@example.com" → Finds user by email
"12345" → Finds user by student ID
```

### Pagination
- 20 users per page
- Navigate with Previous/Next buttons
- Shows current page and total pages

---

## 👥 User Management

### User Information Displayed
```
Avatar | Name | Email
Student ID
Department / Level
Role (User / Admin)
Status (Active / Banned)
```

### Actions Available

#### 1. Ban/Unban User
**Icon**: Shield (active) / Shield Off (banned)  
**Action**: Toggle ban status  
**Effect**: User cannot login if banned  
**Disabled**: Cannot ban yourself  

```
Click Shield icon to ban/unban
```

#### 2. Promote/Demote User
**Icon**: Crown  
**Action**: Toggle admin role  
**Effect**: User becomes admin or regular user  
**Disabled**: Cannot demote yourself  

```
Click Crown icon to promote/demote
```

#### 3. Delete User
**Icon**: Trash  
**Action**: Permanently delete user  
**Effect**: User account removed from system  
**Disabled**: Cannot delete yourself  
**Confirmation**: Modal confirmation required  

```
Click Trash icon to delete
Confirm in modal dialog
```

---

## 🔐 Security Features

### Authorization
- ✅ Only admins can access dashboard
- ✅ Admin middleware checks role
- ✅ Protected routes require authentication

### Restrictions
- ✅ Cannot ban yourself
- ✅ Cannot demote yourself
- ✅ Cannot delete yourself
- ✅ All actions logged (in backend)

### Data Protection
- ✅ Passwords never displayed
- ✅ Sensitive data excluded from responses
- ✅ Validation on all operations

---

## 📱 Responsive Design

### Mobile (< 768px)
- Table scrolls horizontally
- Compact action buttons
- Search bar full width
- Stats cards stack vertically

### Tablet (768px - 1024px)
- Table partially visible
- Readable on medium screens
- All features accessible

### Desktop (> 1024px)
- Full table visible
- All columns displayed
- Optimal viewing experience

---

## 🔌 API Endpoints

### Get All Users
```
GET /api/admin/users
Query Parameters:
  - search: string (optional)
  - page: number (default: 1)
  - limit: number (default: 20)

Response:
{
  "users": [...],
  "total": 100,
  "page": 1,
  "pages": 5
}
```

### Get Statistics
```
GET /api/admin/stats

Response:
{
  "totalUsers": 100,
  "bannedUsers": 5,
  "adminUsers": 3
}
```

### Delete User
```
DELETE /api/admin/users/:id

Response:
{
  "message": "User 'John Doe' deleted successfully"
}
```

### Ban/Unban User
```
PATCH /api/admin/users/:id/ban

Response:
{
  "message": "User 'John Doe' banned successfully",
  "isBanned": true
}
```

### Promote/Demote User
```
PATCH /api/admin/users/:id/promote

Response:
{
  "message": "User 'John Doe' is now admin",
  "role": "admin"
}
```

---

## 🎯 Common Tasks

### Task 1: Find a User
1. Go to Admin Dashboard
2. Enter user's name, email, or student ID in search
3. Results appear automatically
4. Navigate pages if needed

### Task 2: Ban a User
1. Find the user in the table
2. Click Shield Off icon (ban button)
3. User status changes to "Banned"
4. User cannot login

### Task 3: Promote a User to Admin
1. Find the user in the table
2. Click Crown icon (promote button)
3. User role changes to "Admin"
4. User can now access admin dashboard

### Task 4: Delete a User
1. Find the user in the table
2. Click Trash icon (delete button)
3. Confirm deletion in modal
4. User account is permanently deleted

### Task 5: View Statistics
1. Go to Admin Dashboard
2. See stats cards at top
3. Total Users, Banned Users, Admin Users
4. Stats update in real-time

---

## 🐛 Troubleshooting

### Issue: "Access Denied" Message
**Cause**: User is not an admin  
**Solution**: 
- Login with admin account
- Ask another admin to promote your account
- Check user role in database

### Issue: Cannot Ban/Delete Yourself
**Cause**: Security restriction  
**Solution**: 
- Ask another admin to perform action
- This is intentional to prevent lockout

### Issue: Search Not Working
**Cause**: Typo or no matching users  
**Solution**: 
- Check spelling
- Try different search term
- Verify user exists

### Issue: Page Not Loading
**Cause**: Not authenticated or not admin  
**Solution**: 
- Login first
- Verify admin role
- Check browser console for errors

---

## 📊 User Roles

### Regular User
- `role: "user"`
- Cannot access admin dashboard
- Can use all regular features

### Admin User
- `role: "admin"`
- Can access admin dashboard
- Can manage users
- Can ban/promote other users

---

## 🔄 Real-time Updates

### Statistics Update When
- New user registers
- User is banned/unbanned
- User is promoted/demoted
- User is deleted

### User List Updates When
- User is banned/unbanned
- User is promoted/demoted
- User is deleted
- New user added (on refresh)

---

## 📋 Admin Checklist

### Daily Tasks
- [ ] Check for new users
- [ ] Review banned users
- [ ] Monitor admin count
- [ ] Check for suspicious activity

### Weekly Tasks
- [ ] Review user statistics
- [ ] Check for inactive users
- [ ] Review admin actions
- [ ] Update security settings

### Monthly Tasks
- [ ] Audit user accounts
- [ ] Review admin logs
- [ ] Update admin policies
- [ ] Plan improvements

---

## 🔐 Best Practices

### Security
- ✅ Only promote trusted users to admin
- ✅ Ban users who violate policies
- ✅ Regularly review admin list
- ✅ Keep admin account secure

### Management
- ✅ Document admin actions
- ✅ Communicate with users
- ✅ Follow fair policies
- ✅ Maintain transparency

### Performance
- ✅ Archive old users if needed
- ✅ Monitor database size
- ✅ Optimize queries
- ✅ Plan for growth

---

## 📞 Support

### For Admins
- Check this guide
- Review API documentation
- Check backend logs
- Contact system administrator

### For Users
- Cannot access admin dashboard
- Contact an admin for help
- Report issues to admins
- Follow community guidelines

---

## 🎓 Learning Resources

### Files
- **Frontend**: `frontend/src/pages/AdminPage.tsx`
- **Backend Controller**: `backend/src/controllers/adminController.ts`
- **Backend Routes**: `backend/src/routes/adminRoutes.ts`
- **Backend Middleware**: `backend/src/middleware/adminMiddleware.ts`

### Key Functions
- `getAllUsers()` - Fetch users with pagination
- `deleteUser()` - Delete user account
- `banUser()` - Ban/unban user
- `promoteUser()` - Promote/demote user
- `getStats()` - Get statistics

---

## ✅ Verification Checklist

- [ ] Can access admin dashboard
- [ ] Can see statistics
- [ ] Can search users
- [ ] Can ban users
- [ ] Can promote users
- [ ] Can delete users
- [ ] Pagination works
- [ ] Real-time updates work
- [ ] Cannot ban yourself
- [ ] Cannot delete yourself

---

## 🎉 Summary

The Admin Dashboard provides comprehensive user management capabilities:

✅ **View Users**: See all users with pagination  
✅ **Search**: Find users by name, email, or ID  
✅ **Ban Users**: Prevent users from accessing the app  
✅ **Promote Users**: Give admin privileges  
✅ **Delete Users**: Remove user accounts  
✅ **Statistics**: Monitor user counts  
✅ **Security**: Prevent self-modification  

**Status**: ✅ Production Ready

---

**Last Updated**: March 13, 2026  
**Version**: 1.0  
**Status**: Complete ✅
