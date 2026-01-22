import { Router } from 'express';
import { DeliveryController } from '../controllers/deliveryController';

const router = Router();

/**
 * POST /api/delivery/generate
 * Generate a delivery confirmation code for the buyer
 * Request body: { transactionId: string, buyerId: string }
 * Response: { success: boolean, message: string, data?: { code: string, confirmationId: string, expiresAt: Date } }
 */
router.post('/generate', DeliveryController.generateConfirmationCode);

/**
 * POST /api/delivery/confirm
 * Confirm delivery using the buyer's confirmation code
 * Request body: { transactionId: string, code: string, sellerId: string }
 * Response: { success: boolean, message: string }
 */
router.post('/confirm', DeliveryController.confirmDelivery);

/**
 * GET /api/delivery/status/:transactionId
 * Get confirmation status for a transaction (buyer only)
 * Query params: buyerId
 * Response: { success: boolean, data?: DeliveryConfirmation }
 */
router.get('/status/:transactionId', DeliveryController.getConfirmationStatus);

export default router;
