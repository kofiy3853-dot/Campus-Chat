import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 5000,
  }
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
      console.log('Redis connected successfully');
    } catch (err: any) {
      console.error('Redis connection failed:', err.message);
      // We don't throw here to allow server to start without Redis if necessary
    }
  }
};

export default redisClient;
