import { Request, Response, NextFunction } from 'express';

/**
 * Request logging middleware
 * Logs all incoming requests with method, path, and response time
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.socket.remoteAddress;

  // Log request
  console.log(`[${new Date().toISOString()}] → ${method} ${path} (from ${ip})`);

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - startTime;
    const status = res.statusCode;

    // Color code based on status
    let statusColor = '\x1b[32m'; // Green for 2xx
    if (status >= 300 && status < 400) statusColor = '\x1b[36m'; // Cyan for 3xx
    if (status >= 400 && status < 500) statusColor = '\x1b[33m'; // Yellow for 4xx
    if (status >= 500) statusColor = '\x1b[31m'; // Red for 5xx

    const resetColor = '\x1b[0m';

    console.log(
      `[${new Date().toISOString()}] ← ${statusColor}${status}${resetColor} ${method} ${path} (${duration}ms)`
    );

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Error logging middleware
 * Logs all errors with full details
 */
export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const status = err.status || 500;

  console.error(`[${timestamp}] ERROR ${status} ${method} ${path}`);
  console.error(`  Message: ${err.message}`);
  console.error(`  Stack: ${err.stack}`);

  next(err);
};

/**
 * 404 logging middleware
 * Logs all 404 errors
 */
export const notFoundLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.socket.remoteAddress;

  console.warn(`[${timestamp}] 404 NOT FOUND ${method} ${path} (from ${ip})`);

  res.status(404).json({
    message: 'Route not found',
    path,
    method,
    timestamp,
    suggestion: `Check that ${method} ${path} is a valid endpoint`,
  });
};

/**
 * Performance monitoring middleware
 * Logs slow requests
 */
export const performanceMonitor = (slowThresholdMs: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    const originalSend = res.send;
    res.send = function (data: any) {
      const duration = Date.now() - startTime;

      if (duration > slowThresholdMs) {
        console.warn(
          `[SLOW] ${req.method} ${req.path} took ${duration}ms (threshold: ${slowThresholdMs}ms)`
        );
      }

      return originalSend.call(this, data);
    };

    next();
  };
};
