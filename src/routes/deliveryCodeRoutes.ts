import { Router } from 'express';
import { deliveryCodeController } from '../controllers/DeliveryCodeController';
import { RateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Delivery code routes
 * All routes require authentication
 */

// Generate a delivery code (rate limited to prevent abuse)
router.post(
  '/',
  RateLimiter.payment,
  deliveryCodeController.generateCode.bind(deliveryCodeController)
);

// Verify a delivery code (rate limited)
router.post(
  '/:deliveryCodeId/verify',
  RateLimiter.deliveryCodeVerification,
  deliveryCodeController.verifyCode.bind(deliveryCodeController)
);

// Get delivery code by auction ID (rate limited to prevent information disclosure)
router.get(
  '/auction/:auctionId',
  RateLimiter.notification,
  deliveryCodeController.getByAuctionId.bind(deliveryCodeController)
);

// Check if delivery code is valid (rate limited)
router.get(
  '/:deliveryCodeId/valid',
  RateLimiter.notification,
  deliveryCodeController.checkValidity.bind(deliveryCodeController)
);

export const deliveryCodeRoutes = router;
