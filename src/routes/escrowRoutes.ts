import { Router } from 'express';
import escrowController from '../controllers/escrowController';
import { generalRateLimiter, strictRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * GET /api/escrow/:escrowId/status
 * Get escrow status by escrow ID
 */
router.get('/:escrowId/status', generalRateLimiter, (req, res) => escrowController.getEscrowStatus(req, res));

/**
 * GET /api/escrow/transaction/:transactionId
 * Get escrow by transaction ID
 */
router.get('/transaction/:transactionId', generalRateLimiter, (req, res) => 
  escrowController.getEscrowByTransaction(req, res)
);

/**
 * POST /api/escrow/:escrowId/confirm-delivery
 * Confirm delivery with buyer's code (strict rate limiting due to security)
 */
router.post('/:escrowId/confirm-delivery', strictRateLimiter, (req, res) => 
  escrowController.confirmDelivery(req, res)
);

/**
 * POST /api/escrow/:escrowId/release
 * Release funds to seller (internal/admin)
 */
router.post('/:escrowId/release', strictRateLimiter, (req, res) => escrowController.releaseFunds(req, res));

/**
 * POST /api/escrow/:escrowId/refund
 * Process refund (internal/admin)
 */
router.post('/:escrowId/refund', strictRateLimiter, (req, res) => escrowController.refundEscrow(req, res));

/**
 * GET /api/escrow/seller/:sellerId/can-withdraw
 * Check if seller can withdraw funds
 */
router.get('/seller/:sellerId/can-withdraw', generalRateLimiter, (req, res) => 
  escrowController.canWithdraw(req, res)
);

/**
 * GET /api/escrow/seller/:sellerId/balance
 * Get seller's available balance
 */
router.get('/seller/:sellerId/balance', generalRateLimiter, (req, res) => 
  escrowController.getAvailableBalance(req, res)
);

export default router;
