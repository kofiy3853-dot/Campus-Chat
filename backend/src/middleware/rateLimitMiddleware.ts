import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// Memory-based fallback for rate limiting (if Redis is not available)
const memoryStore = new Map<string, { count: number; resetTime: number }>();

export const createRateLimiter = (config: RateLimitConfig) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `rate_limit:${req.ip}:${req.path}`;
      
      if (redisClient.isOpen) {
        // Use Redis if available
        const current = await redisClient.incr(key);
        
        if (current === 1) {
          await redisClient.expire(key, Math.ceil(config.windowMs / 1000));
        }

        if (current > config.maxRequests) {
          return res.status(429).json({
            message: 'Too many requests. Please try again later.',
            retryAfter: config.windowMs / 1000
          });
        }
      } else {
        // Fallback to memory store
        const now = Date.now();
        const stored = memoryStore.get(key);

        if (!stored || now > stored.resetTime) {
          memoryStore.set(key, {
            count: 1,
            resetTime: now + config.windowMs
          });
        } else {
          stored.count++;

          if (stored.count > config.maxRequests) {
            return res.status(429).json({
              message: 'Too many requests. Please try again later.',
              retryAfter: Math.ceil((stored.resetTime - now) / 1000)
            });
          }
        }
      }

      next();
    } catch (error: any) {
      console.error('Rate limit error:', error.message);
      next();
    }
  };
};

// Specific rate limiters
export const messageRateLimiter = createRateLimiter({
  windowMs: 1000, // 1 second
  maxRequests: 5, // Max 5 messages per second
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // Max 5 auth attempts
});

export const searchRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // Max 30 searches per minute
});

export const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // Max 100 requests per minute
});
