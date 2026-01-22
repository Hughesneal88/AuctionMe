import { Router } from 'express';
import { handlePaymentWebhook } from '../controllers/webhookController';
import { webhookLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @route   POST /api/webhooks/payment
 * @desc    Handle payment webhook from payment provider
 * @access  Public (with signature verification)
 */
router.post('/payment', webhookLimiter, handlePaymentWebhook);

export default router;
