import { createClient } from 'redis';

const getEnvRedisUrl = () => {
  const url = process.env.REDIS_URL;
  if (!url || url === 'your_redis_url') return 'redis://localhost:6379';
  return url;
};

const redisUrl = getEnvRedisUrl();
const isTls = redisUrl.startsWith('rediss://');
const isUpstash = redisUrl.includes('upstash.io');

const redisClient = createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 10000,
    family: 4,
    tls: isTls,
    // Upstash needs persistent TLS, don't wrap with extra object
    ...(isUpstash ? {} : {}),
    reconnectStrategy: (retries: number) => {
      if (retries > 10) return new Error('Retry limit reached');
      return Math.min(retries * 100, 3000);
    },
  } as any
});

redisClient.on('error', (err) => {
  // Suppress verbose connection errors for localhost when Redis isn't running
  if (process.env.NODE_ENV !== 'production' && err.code === 'ECONNREFUSED' && redisUrl.includes('localhost')) {
    return;
  }
  console.log('[Redis] Client Error', {
    code: err.code,
    message: err.message,
    url: redisUrl.split('@')[1] || redisUrl // Log host part only for security
  });
});

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
      console.log('[Redis] Connected successfully to', isUpstash ? 'Upstash' : redisUrl);
    } catch (err: any) {
      console.warn('⚠️ [Redis] Connection failed (running without Redis):', err.message);
    }
  }
};

export default redisClient;
