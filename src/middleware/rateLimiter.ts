import { Request, Response, NextFunction } from 'express';
import { rateLimitStore } from '../models/RateLimitModel';
import { auditService } from '../services/AuditService';
import { notificationService } from '../services/NotificationService';
import { RateLimitConfig } from '../types';

/**
 * Rate limiting middleware with configurable limits per action
 */
export class RateLimiter {
  /**
   * Create a rate limit middleware
   */
  static create(action: string, config: RateLimitConfig) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      // Extract user ID from request (assumes auth middleware sets req.user)
      const userId = (req as any).user?.id || req.ip;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Check rate limit
      const record = rateLimitStore.increment(userId, action, config.windowMs);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - record.count).toString());
      res.setHeader('X-RateLimit-Reset', record.windowEnd.getTime().toString());

      if (record.count > config.maxRequests) {
        // Log rate limit hit
        await auditService.logRateLimitHit(
          userId,
          action,
          req.ip,
          req.get('user-agent')
        );

        // Send warning notification on first violation
        if (record.count === config.maxRequests + 1) {
          await notificationService.notifyRateLimitWarning(userId, action);
        }

        res.status(429).json({
          error: 'Too many requests',
          message: config.message,
          retryAfter: Math.ceil((record.windowEnd.getTime() - Date.now()) / 1000),
        });
        return;
      }

      // Warn user when approaching limit (at 80%)
      if (record.count === Math.floor(config.maxRequests * 0.8)) {
        await notificationService.notifyRateLimitWarning(userId, action);
      }

      next();
    };
  }

  /**
   * Predefined rate limiters for common actions
   */
  static bidding = RateLimiter.create('bidding', {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 bids per minute
    message: 'Too many bids. Please wait before placing another bid.',
  });

  static payment = RateLimiter.create('payment', {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 payments per minute
    message: 'Too many payment attempts. Please wait before trying again.',
  });

  static deliveryCodeVerification = RateLimiter.create('delivery_code_verification', {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 attempts per minute
    message: 'Too many verification attempts. Please wait before trying again.',
  });

  static notification = RateLimiter.create('notification', {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 notification fetches per minute
    message: 'Too many requests. Please wait before refreshing.',
  });
}

/**
 * Cleanup middleware - runs periodically to clean up expired rate limits
 */
export function cleanupRateLimits() {
  setInterval(() => {
    rateLimitStore.cleanup();
  }, 60 * 1000); // Every minute
}
