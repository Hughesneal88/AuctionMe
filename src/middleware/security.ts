import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/AuditService';
import { fraudDetectionService } from '../services/FraudDetectionService';

/**
 * Middleware to detect and prevent fraudulent activity
 */
export async function fraudDetectionMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return next();
    }

    // Check request body for spam content
    if (req.body && typeof req.body === 'object') {
      const textFields = Object.entries(req.body)
        .filter(([_, value]) => typeof value === 'string')
        .map(([_, value]) => value as string);

      for (const text of textFields) {
        if (text.length > 10) { // Only check meaningful text
          const isSpam = await fraudDetectionService.isSpam(text, userId);
          if (isSpam) {
            await auditService.logSuspiciousActivity(
              userId,
              'Spam content detected',
              { path: req.path, method: req.method },
              req.ip,
              req.get('user-agent')
            );

            return res.status(400).json({
              error: 'Content appears to be spam',
              message: 'Please remove spam content and try again',
            });
          }
        }
      }
    }

    next();
  } catch (error) {
    console.error('Fraud detection middleware error:', error);
    next(); // Continue on error to avoid blocking legitimate requests
  }
}

/**
 * Middleware for validating bids
 */
export async function bidValidationMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    const { auctionId, amount } = req.body;

    if (!userId || !auctionId || typeof amount !== 'number') {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get current highest bid (would normally come from database)
    const currentHighestBid = (req as any).auction?.currentBid || 0;

    // Validate bid
    const validation = await fraudDetectionService.validateBid(
      userId,
      auctionId,
      amount,
      currentHighestBid
    );

    if (!validation.isValid) {
      await auditService.logSuspiciousActivity(
        userId,
        'Bid validation failed',
        { 
          auctionId, 
          amount, 
          reason: validation.reason,
          riskScore: validation.riskScore,
          flags: validation.flags 
        },
        req.ip,
        req.get('user-agent')
      );

      return res.status(400).json({
        error: 'Bid validation failed',
        message: validation.reason,
        riskScore: validation.riskScore,
        flags: validation.flags,
      });
    }

    // Attach validation result to request for use in controller
    (req as any).bidValidation = validation;
    next();
  } catch (error) {
    console.error('Bid validation middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware for audit logging
 */
export function auditLogMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.id;
  const startTime = Date.now();

  // Log request
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    
    // Only log important endpoints or errors
    if (res.statusCode >= 400 || req.method !== 'GET') {
      const severity = res.statusCode >= 500 ? 'HIGH' : res.statusCode >= 400 ? 'MEDIUM' : 'LOW';
      
      await auditService.log(
        'SUSPICIOUS_ACTIVITY' as any, // Generic action for request logging
        'api',
        req.path,
        {
          method: req.method,
          statusCode: res.statusCode,
          duration,
          query: req.query,
          body: req.body,
        },
        userId,
        req.ip,
        req.get('user-agent'),
        severity
      );
    }
  });

  next();
}
