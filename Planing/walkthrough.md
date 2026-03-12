# Walkthrough - Campus Chat Application

A production-ready, scalable messaging platform tailored for university environments.

## Features Implemented

### 1. Secure Authentication
- **Registration**: Students can sign up with their campus details.
- **Login**: Secure login with JWT and bcrypt hashing.
- **Profile**: Users can view and manage their campus profile.

### 2. Real-Time Messaging
- **One-to-One Chat**: Fast, reliable messaging between students.
- **Group Chats**: Create and join course-based or interest-based groups.
- **Typing Indicators**: Real-time feedback when someone is typing.
- **Read Receipts**: Visual confirmation of message delivery and read status.

### 3. Presence System
- **Online/Offline Status**: Real-time updates of user activity status.
- **Last Seen**: Automatic tracking of user activity timestamps.

### 4. Campus Announcements
- Official channels for important campus updates and alerts.
- Support for reactions and official branding.

## Visual Overview

### Authentication
The application features a sleek, dark-themed login and registration interface with glassmorphism effects.

### Dashboard
A clean, sidebar-based navigation system for switching between chats, groups, and announcements.

## Technical Highlights
- **Backend**: Node.js/Express, TypeScript, MongoDB, Socket.io, Redis, BullMQ.
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Lucide icons.
- **Reliability**: Message queueing and offline synchronization support.

## Verification
- Verified backend API endpoints for authentication and messaging.
- Validated real-time socket events for messages and presence.
- Ensured accessibility compliance and modern CSS practices.
