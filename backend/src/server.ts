import dotenv from 'dotenv';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('--- Environment Check ---');
console.log('CWD:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Resolved .env path:', path.resolve(__dirname, '../.env'));
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI Raw:', process.env.MONGODB_URI);
console.log('REDIS_URL Raw:', process.env.REDIS_URL);
console.log('-------------------------');

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import { setupSockets } from './sockets';
import authRoutes from './routes/authRoutes';
import chatRoutes from './routes/chatRoutes';
import groupRoutes from './routes/groupRoutes';
import announcementRoutes from './routes/announcementRoutes';
import confessionRoutes from './routes/confessionRoutes';
import eventRoutes from './routes/eventRoutes';
import { connectRedis } from './config/redis';

const app = express();
const server = http.createServer(app);

// Configure CORS for production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL, // Vercel URL
].filter(Boolean) as string[];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  credentials: true,
}));
app.use(express.json());

const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-chat';

app.get('/', (req, res) => {
  res.send('Campus Chat API is running...');
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/confessions', confessionRoutes);
app.use('/api/events', eventRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('--- GLOBAL ERROR HANDLER ---');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('Path:', req.path);
  console.error('-----------------------------');
  res.status(500).json({ 
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Setup sockets
setupSockets(io);

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
    });

    console.log('[Server] Connecting to MongoDB...');
    mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    }).then(() => {
        console.log('[Server] MongoDB connected');
    }).catch(err => {
        console.error('[Server] MongoDB connection failed:', err.message);
    });
  } catch (err: any) {
    console.error('[Server] Fatal Startup Error:', err.message);
  }
};

startServer();
