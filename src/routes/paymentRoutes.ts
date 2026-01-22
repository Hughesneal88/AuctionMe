import { Router } from 'express';
import paymentController from '../controllers/paymentController';
import { paymentRateLimiter, webhookRateLimiter, generalRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * POST /api/payments/initiate
 * Initiate a new payment
 */
router.post('/initiate', paymentRateLimiter, (req, res) => paymentController.initiatePayment(req, res));

/**
 * POST /api/payments/webhook
 * Handle payment provider webhooks
 */
router.post('/webhook', webhookRateLimiter, (req, res) => paymentController.handleWebhook(req, res));

/**
 * GET /api/payments/:transactionId
 * Get transaction status
 */
router.get('/:transactionId', generalRateLimiter, (req, res) => paymentController.getTransactionStatus(req, res));

export default router;
