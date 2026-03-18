# 👨‍💼 Admin Dashboard - Quick Reference

**Access**: http://localhost:5173/dashboard/admin  
**Requirement**: Admin role  

---

## 📊 Dashboard Overview

```
┌─────────────────────────────────────────────────────────┐
│ Admin Dashboard                                         │
│ Manage users, roles, and access                        │
├─────────────────────────────────────────────────────────┤
│ [Total Users: 100] [Banned: 5] [Admins: 3]            │
├─────────────────────────────────────────────────────────┤
│ 🔍 Search by name, email or student ID...             │
├─────────────────────────────────────────────────────────┤
│ User | Student ID | Dept/Level | Role | Status | Actions│
│ ─────────────────────────────────────────────────────── │
│ John | 12345      | CS / 100   | User | Active | ⚔️ 👑 🗑️ │
│ Jane | 12346      | ENG / 200  | Admin| Banned | ⚔️ 👑 🗑️ │
├─────────────────────────────────────────────────────────┤
│ < Page 1 of 5 >                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Actions

### Ban User
**Icon**: ⚔️ Shield Off  
**Click**: Ban/Unban toggle  
**Result**: User cannot login  

### Promote User
**Icon**: 👑 Crown  
**Click**: Promote/Demote toggle  
**Result**: User becomes admin  

### Delete User
**Icon**: 🗑️ Trash  
**Click**: Delete permanently  
**Result**: User account removed  

---

## 🔍 Search Examples

```
"John"              → Find by name
"john@email.com"    → Find by email
"12345"             → Find by student ID
```

---

## 📈 Statistics

| Metric | Meaning |
|--------|---------|
| Total Users | All users in system |
| Banned | Users with isBanned: true |
| Admins | Users with role: admin |

---

## 🔐 Restrictions

❌ Cannot ban yourself  
❌ Cannot demote yourself  
❌ Cannot delete yourself  

---

## 📱 Responsive

- **Mobile**: Horizontal scroll table
- **Tablet**: Compact layout
- **Desktop**: Full view

---

## 🔌 API Endpoints

```
GET    /api/admin/users              → Get users
GET    /api/admin/stats              → Get statistics
DELETE /api/admin/users/:id          → Delete user
PATCH  /api/admin/users/:id/ban      → Ban/unban
PATCH  /api/admin/users/:id/promote  → Promote/demote
```

---

## ⚡ Common Tasks

### Find User
1. Enter name/email/ID in search
2. Results appear instantly
3. Navigate pages if needed

### Ban User
1. Find user in table
2. Click Shield Off icon
3. Status changes to "Banned"

### Promote User
1. Find user in table
2. Click Crown icon
3. Role changes to "Admin"

### Delete User
1. Find user in table
2. Click Trash icon
3. Confirm in modal
4. User deleted

---

## 🎓 Files

- **Frontend**: `frontend/src/pages/AdminPage.tsx`
- **Backend**: `backend/src/controllers/adminController.ts`
- **Routes**: `backend/src/routes/adminRoutes.ts`
- **Middleware**: `backend/src/middleware/adminMiddleware.ts`

---

## ✅ Checklist

- [ ] Logged in as admin
- [ ] Can access /dashboard/admin
- [ ] Can see statistics
- [ ] Can search users
- [ ] Can ban users
- [ ] Can promote users
- [ ] Can delete users

---

**Status**: ✅ Ready to Use
