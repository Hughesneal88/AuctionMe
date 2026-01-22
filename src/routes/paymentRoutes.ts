import { Router } from 'express';
import paymentController from '../controllers/paymentController';

const router = Router();

/**
 * POST /api/payments/initiate
 * Initiate a new payment
 */
router.post('/initiate', (req, res) => paymentController.initiatePayment(req, res));

/**
 * POST /api/payments/webhook
 * Handle payment provider webhooks
 */
router.post('/webhook', (req, res) => paymentController.handleWebhook(req, res));

/**
 * GET /api/payments/:transactionId
 * Get transaction status
 */
router.get('/:transactionId', (req, res) => paymentController.getTransactionStatus(req, res));

export default router;
