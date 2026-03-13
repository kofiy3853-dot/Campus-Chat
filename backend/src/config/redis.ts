import { createClient } from 'redis';

const getEnvRedisUrl = () => {
  const url = process.env.REDIS_URL;
  if (!url || url === 'your_redis_url') return 'redis://localhost:6379';
  return url;
};

const redisClient = createClient({
  url: getEnvRedisUrl(),
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: false, // Prevents infinite connection loops that crash the console
  }
});

redisClient.on('error', (err) => {
  // Suppress verbose connection errors in development if Redis isn't running
  if (process.env.NODE_ENV !== 'production' && err.code === 'ECONNREFUSED') {
    return;
  }
  console.log('Redis Client Error', err);
});

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
      console.log('Redis connected successfully');
    } catch (err: any) {
      console.warn('⚠️ Redis connection failed (running without Redis):', err.message);
    }
  }
};

export default redisClient;
