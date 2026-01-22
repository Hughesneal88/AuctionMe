import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for payment endpoints
 * Prevents abuse of payment initiation and webhook endpoints
 */
export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many payment requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for webhook endpoints
 * More lenient for legitimate webhook callbacks
 */
export const webhookRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Allow more webhook callbacks
  message: {
    success: false,
    error: 'Too many webhook requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for verified webhook signatures
  skip: (req) => {
    // In production, you might want to skip rate limiting for verified webhooks
    return false;
  }
});

/**
 * Rate limiter for general API endpoints
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Strict rate limiter for sensitive operations
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Only 5 attempts per hour
  message: {
    success: false,
    error: 'Too many attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
