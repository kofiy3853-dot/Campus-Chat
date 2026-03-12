# Implementation Plan - Campus Chat Application

Design and build a production-ready, scalable Campus Chat Application for a university environment.

## User Review Required

> [!IMPORTANT]
> The application will use **MongoDB** as the primary database, **Redis** for presence/caching, and **Socket.io** for real-time communication.
> We will focus on the **Web Application (React)** first, followed by the **Backend (Node.js/Express)**.
> **Cloudinary** will be used for media storage for simplicity in the demo, but S3 can be substituted.

## Proposed Changes

### [Backend]
Summary: Implement a robust Node.js backend with Express and Socket.io.

#### [NEW] Backend Structure
- `backend/src/models/`: Mongoose schemas (User, Message, Room, Announcement)
- `backend/src/controllers/`: Auth, Chat, Group logic
- `backend/src/routes/`: API endpoints
- `backend/src/sockets/`: Socket.io event handlers
- `backend/src/services/`: Redis, BullMQ, Cloudinary integrations

### [Frontend - Web]
Summary: Build a premium React application with Tailwind CSS.

#### [NEW] Frontend Structure
- `frontend/src/components/`: Reusable UI components (bubbles, inputs, list items)
- `frontend/src/context/`: Auth and Socket contexts
- `frontend/src/pages/`: Login, Register, Chat Dashboard
- `frontend/src/hooks/`: Custom hooks for messaging and presence

## Verification Plan

### Automated Tests
- `npm test` for backend routes.
- Component testing for frontend with Vitest/React Testing Library.

### Manual Verification
- Test real-time messaging between two browser windows.
- Verify file uploads and media display.
- Test online/offline status updates.
- Test group creation and messaging.
