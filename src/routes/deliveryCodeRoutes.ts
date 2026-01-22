import { Router } from 'express';
import { deliveryCodeController } from '../controllers/DeliveryCodeController';
import { RateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Delivery code routes
 * All routes require authentication
 */

// Generate a delivery code
router.post(
  '/',
  deliveryCodeController.generateCode.bind(deliveryCodeController)
);

// Verify a delivery code (rate limited)
router.post(
  '/:deliveryCodeId/verify',
  RateLimiter.deliveryCodeVerification,
  deliveryCodeController.verifyCode.bind(deliveryCodeController)
);

// Get delivery code by auction ID
router.get(
  '/auction/:auctionId',
  deliveryCodeController.getByAuctionId.bind(deliveryCodeController)
);

// Check if delivery code is valid
router.get(
  '/:deliveryCodeId/valid',
  deliveryCodeController.checkValidity.bind(deliveryCodeController)
);

export const deliveryCodeRoutes = router;
