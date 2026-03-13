import dotenv from 'dotenv';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
console.log('Node DNS Servers set to:', dns.getServers());
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
import notificationRoutes from './routes/notificationRoutes';
import pollRoutes from './routes/pollRoutes';
import lostFoundRoutes from './routes/lostFoundRoutes';
import { connectRedis } from './config/redis';
import { generalRateLimiter } from './middleware/rateLimitMiddleware';

const app = express();
const server = http.createServer(app);

// Configure CORS for production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://campus-chat-fjxp.vercel.app',
  'https://campus-chat-fjxp-dbqj1blko-kofiy3853-dots-projects.vercel.app',
].filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Check if origin is in allowedOrigins or if it's a vercel.app subdomain
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 200, // For legacy browser support
};

const io = new Server(server, {
  cors: corsOptions,
});

app.use(cors(corsOptions));
// Handle preflight requests for all routes
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(generalRateLimiter);

const PORT = Number(process.env.PORT) || 6000;
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-chat';
if (MONGODB_URI === 'your_mongodb_uri') {
  MONGODB_URI = 'mongodb://localhost:27017/campus-chat';
}

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
app.use('/api/notifications', notificationRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/lost-found', lostFoundRoutes);

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
        logErrorToFile('REDIS_STARTUP', err);
    });

    console.log('[Server] Connecting to MongoDB...');
    mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    }).then(() => {
        console.log('[Server] MongoDB connected');
    }).catch(err => {
        console.error('[Server] MongoDB connection failed:', err.message);
        logErrorToFile('MONGODB_STARTUP', err);
    });
  } catch (err: any) {
    console.error('[Server] Fatal Startup Error:', err.message);
  }
};

startServer();
