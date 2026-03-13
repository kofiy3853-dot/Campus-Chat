import { Redis } from '@upstash/redis';

const getRedisUrl = () => {
  // Support both UPSTASH_REDIS_REST_URL and legacy REDIS_URL
  return process.env.UPSTASH_REDIS_REST_URL || 'https://absolute-tomcat-70801.upstash.io';
};

const getRedisToken = () => {
  return process.env.UPSTASH_REDIS_REST_TOKEN || '';
};

let redisClient: Redis | null = null;

const url = getRedisUrl();
const token = getRedisToken();

if (url && token) {
  redisClient = new Redis({ url, token });
  console.log('[Redis] Upstash HTTP client initialised');
} else {
  console.warn('[Redis] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN — Redis disabled');
}

// Compatibility shim: expose `.isOpen` so existing middleware keeps working
export const isRedisReady = () => redisClient !== null;

// Thin wrappers that match the old redis client API used in rateLimitMiddleware
export const redisIncr = async (key: string): Promise<number> => {
  if (!redisClient) throw new Error('Redis not configured');
  return (await redisClient.incr(key)) as number;
};

export const redisExpire = async (key: string, seconds: number): Promise<void> => {
  if (!redisClient) throw new Error('Redis not configured');
  await redisClient.expire(key, seconds);
};

export const getRedis = () => redisClient;

// No-op for backward compat — Upstash HTTP needs no explicit connect
export const connectRedis = async () => {
  if (redisClient) {
    console.log('[Redis] Connected to Upstash (HTTP)');
  }
};

export default redisClient;
