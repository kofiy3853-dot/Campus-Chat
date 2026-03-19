import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';
import { isRedisReady, redisIncr, redisExpire } from '../config/redis';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// Memory-based fallback for rate limiting (if Redis is not available)
const memoryStore = new Map<string, { count: number; resetTime: number }>();

export const createRateLimiter = (config: RateLimitConfig) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Skip rate limiting for preflight requests
    if (req.method === 'OPTIONS') {
      return next();
    }
    const key = `rate_limit:${req.ip}:${req.path}`;
    
    try {
      if (isRedisReady()) {
        try {
          // Use Redis if available
          const current = await redisIncr(key);
          
          if (current === 1) {
            await redisExpire(key, Math.ceil(config.windowMs / 1000));
          }

          if (current > config.maxRequests) {
            return res.status(429).json({
              message: 'Too many requests. Please try again later.',
              retryAfter: config.windowMs / 1000
            });
          }
          
          // If we reached here, Redis worked and we are under limit
          return next();
        } catch (redisErr: any) {
          console.error(`[RateLimit] Redis operation failed for ${key}, falling back to memory:`, redisErr.message);
          // Continue to memory store fallback below
        }
      }

      // Fallback to memory store (used if Redis is closed OR if a Redis operation fails)
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

      next();
    } catch (error: any) {
      console.error('[RateLimit] Critical error:', error.message, error.stack);
      next(); // Fail open: let the request through if the rate limiter itself crashes
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
