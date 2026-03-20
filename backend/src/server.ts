require('newrelic');
import * as Sentry from "@sentry/node";
import dotenv from 'dotenv';
import dns from 'dns';
// dns.setServers(['8.8.8.8', '1.1.1.1']);
// console.log('Node DNS Servers set to:', dns.getServers());
import path from 'path';
import fs from 'fs';

const logErrorToFile = (context: string, error: any) => {
  const logPath = path.resolve(__dirname, '../error_diagnostics.log');
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${context}]
Message: ${error.message}
Stack: ${error.stack}
--------------------------------------------------\n`;
  try {
    fs.appendFileSync(logPath, logMessage);
    console.log(`[Diagnostic] Error logged to ${logPath}`);
  } catch (err) {
    console.error('[Diagnostic] Failed to write to log file:', err);
  }
};

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Sentry before other imports to catch all startup errors
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

console.log('--- Environment Check ---');
console.log('CWD:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Resolved .env path:', path.resolve(__dirname, '../.env'));
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI Raw:', process.env.MONGODB_URI);
console.log('REDIS_URL Raw:', process.env.REDIS_URL);
console.log('FIREBASE_STORAGE_BUCKET set:', !!process.env.FIREBASE_STORAGE_BUCKET);
console.log('FIREBASE_SERVICE_ACCOUNT_KEY set:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
console.log('-------------------------');

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import compression from 'compression';
import User from './models/User';
import { connectRedis } from './config/redis';
// Socket.IO uses default in-memory adapter (Upstash HTTP doesn't support pub/sub)
const app = express();
const server = http.createServer(app);

// Configure CORS for production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost',
  'https://localhost',
  'capacitor://localhost',
  'https://campus-chat-fjxp.vercel.app',
  'https://campus-chat-fjxp-dbqj1blko-kofiy3853-dots-projects.vercel.app',
].filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin: any, callback: any) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const isVercel = /https:\/\/campus-chat-.*\.vercel\.app$/.test(origin);
    const isAllowed = allowedOrigins.includes(origin) || isVercel;

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Rejected origin: ${origin}`);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 200, // For legacy browser support
};

export const io = new Server(server, {
  cors: corsOptions,
});

import authRoutes from './routes/authRoutes';
import chatRoutes from './routes/chatRoutes';
import groupRoutes from './routes/groupRoutes';
import announcementRoutes from './routes/announcementRoutes';
import confessionRoutes from './routes/confessionRoutes';
import eventRoutes from './routes/eventRoutes';
import notificationRoutes from './routes/notificationRoutes';
import pollRoutes from './routes/pollRoutes';
import lostFoundRoutes from './routes/lostFoundRoutes';
import marketplaceRoutes from './routes/marketplaceRoutes';
import connectionRoutes from './routes/connectionRoutes';
import internshipRoutes from './routes/internshipRoutes';
import clubRoutes from './routes/clubRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';
import adminRoutes from './routes/adminRoutes';
import { generalRateLimiter } from './middleware/rateLimitMiddleware';
import { initAnnouncementEngine } from './services/announcementEngine';

// Presence tracking (in-memory — Upstash HTTP doesn't support TCP pub/sub)
const onlineUsers = new Map<string, Set<string>>();

io.on('connection', async (socket) => {
  const userId = socket.handshake.query.userId as string;

  const handleUserOnline = async (uId: string) => {
    if (!uId || uId === 'null' || uId === 'undefined') return;
    
    if (!onlineUsers.has(uId)) {
      onlineUsers.set(uId, new Set());
    }
    onlineUsers.get(uId)?.add(socket.id);
    
    console.log(`[Socket] User ${uId} connected (${socket.id}). Active tabs: ${onlineUsers.get(uId)?.size}`);
    
    // Broadcast updated online list
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    
    // Join notification room
    socket.join(`notification:${uId}`);

    // Update DB
    User.findByIdAndUpdate(uId, { status: 'online', last_seen: new Date() }, { returnDocument: 'after' }).then(user => {
        if (user) {
            io.emit('user_status_change', { userId: uId, status: 'online', last_seen: user.last_seen });
        }
    }).catch(e => {
        console.error('[Socket] User status update error:', e.message);
    });
  };

  if (userId && userId !== 'null' && userId !== 'undefined') {
    handleUserOnline(userId);
  }

  socket.on('userOnline', (uId: string) => {
    handleUserOnline(uId);
  });

  // Support for explicit offline/logout
  socket.on('userOffline', (uId: string) => {
    const userSockets = onlineUsers.get(uId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(uId);
        User.findByIdAndUpdate(uId, { status: 'offline', last_seen: new Date() }).then(user => {
          if (user) {
            io.emit('user_status_change', { userId: uId, status: 'offline', last_seen: user.last_seen });
          }
        }).catch(() => {});
      }
    }
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
  });

  // --- Real-time Events ---
  socket.on('join_room', (roomId: string) => {
    if (!roomId || roomId === 'null') return;
    socket.join(roomId);
  });

  socket.on('typing_start', (data: { roomId: string, userId: string }) => {
    if (data.roomId) socket.to(data.roomId).emit('typing_start', data);
  });

  socket.on('typing_stop', (data: { roomId: string, userId: string }) => {
    if (data.roomId) socket.to(data.roomId).emit('typing_stop', data);
  });

  socket.on('send_message', (data: any) => {
    if (data.roomId) socket.to(data.roomId).emit('receive_message', data);
  });

  socket.on('send_group_message', (data: any) => {
    if (data.roomId) socket.to(data.roomId).emit('receive_group_message', data);
  });

  socket.on('message_reaction', (data: { messageId: string, emoji: string, roomId: string }) => {
    if (data.roomId) socket.to(data.roomId).emit('message_reaction', data);
  });

  socket.on('message_edited', (data: { messageId: string, message_text: string, roomId: string }) => {
    if (data.roomId) socket.to(data.roomId).emit('message_edited', data);
  });

  socket.on('messages_read', (data: { roomId: string, userId: string }) => {
    if (data.roomId) socket.to(data.roomId).emit('messages_read', data);
  });

  socket.on('message_deleted', (data: { messageId: string, roomId: string }) => {
    if (data.roomId) socket.to(data.roomId).emit('message_deleted', data);
  });

  socket.on('new_notification', (data: { userId: string, notification: any }) => {
    io.to(`notification:${data.userId}`).emit('notification', data.notification);
  });

  socket.on('disconnect', async () => {
    if (userId && userId !== 'null' && userId !== 'undefined') {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          
          // Mark offline in DB
          const now = new Date();
          User.findByIdAndUpdate(userId, { status: 'offline', last_seen: now }, { returnDocument: 'after' }).then(user => {
              if (user) {
                  io.emit('user_status_change', { userId, status: 'offline', last_seen: user.last_seen });
              }
          }).catch(() => {});
          
          console.log(`[Socket] User ${userId} is now fully offline`);
        }
      }
      
      // Update everyone
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    }
  });
});

// CORS must be applied before routes and body parsing
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});
app.use(generalRateLimiter as express.RequestHandler);

const PORT = Number(process.env.PORT) || 6000;
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-chat';
if (MONGODB_URI === 'your_mongodb_uri') {
  MONGODB_URI = 'mongodb://localhost:27017/campus-chat';
}

app.get('/', (req, res) => {
  res.send('Campus Chat API is running... (v1.0.1)');
});

// Diagnostic endpoint to check filesystem
app.get('/api/diag/uploads', (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../public/uploads');
    const exists = fs.existsSync(uploadsDir);
    let files: string[] = [];
    if (exists) {
      files = fs.readdirSync(uploadsDir);
    }
    res.json({
      timestamp: new Date().toISOString(),
      __dirname,
      cwd: process.cwd(),
      uploadsDir,
      exists,
      files,
      env: {
        PORT: process.env.PORT,
        NODE_ENV: process.env.NODE_ENV
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/debug-sentry', (req, res) => {
  throw new Error('Sentry Backend Test Error');
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/confessions', confessionRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler - Must come before error handler
app.use((req: express.Request, res: express.Response) => {
  console.warn(`[404] Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Sentry Error Handler - Must come before other error handlers
Sentry.setupExpressErrorHandler(app);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('--- GLOBAL ERROR HANDLER ---');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('Path:', req.path);
  console.error('-----------------------------');
  
  logErrorToFile(`GLOBAL_ERROR: ${req.method} ${req.path}`, err);

  res.status(500).json({ 
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});


console.log('--- Server Starting ---');

const startServer = async () => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Listening on port ${PORT} (on all interfaces)`);
  });

  try {
    console.log('[Server] Connecting to Redis...');
    connectRedis().then(() => {
        console.log('[Server] Redis connection task finished');
    }).catch(err => {
        console.error('[Server] Redis connection task failed:', err.message);
        logErrorToFile('REDIS_STARTUP', err);
    });

    console.log('[Server] Connecting to MongoDB...');
    if (!MONGODB_URI || MONGODB_URI.includes('localhost') && process.env.NODE_ENV === 'production') {
      console.error(' [CRITICAL] MONGODB_URI is not set or using localhost in production!');
      console.error(' Please add MONGODB_URI to your Render environment variables.');
    }
    mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    }).then(() => {
        console.log('[Server] MongoDB connected');
    }).catch(err => {
        console.error('[Server] MongoDB connection failed:', err.message);
        logErrorToFile('MONGODB_STARTUP', err);
    });

    // Initialize Automated Announcement Engine
    initAnnouncementEngine();
  } catch (err: any) {
    console.error('[Server] Fatal Startup Error:', err.message);
  }
};

startServer();
