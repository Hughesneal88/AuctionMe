import { Router } from 'express';
import escrowController from '../controllers/escrowController';

const router = Router();

/**
 * GET /api/escrow/:escrowId/status
 * Get escrow status by escrow ID
 */
router.get('/:escrowId/status', (req, res) => escrowController.getEscrowStatus(req, res));

/**
 * GET /api/escrow/transaction/:transactionId
 * Get escrow by transaction ID
 */
router.get('/transaction/:transactionId', (req, res) => 
  escrowController.getEscrowByTransaction(req, res)
);

/**
 * POST /api/escrow/:escrowId/confirm-delivery
 * Confirm delivery with buyer's code
 */
router.post('/:escrowId/confirm-delivery', (req, res) => 
  escrowController.confirmDelivery(req, res)
);

/**
 * POST /api/escrow/:escrowId/release
 * Release funds to seller (internal/admin)
 */
router.post('/:escrowId/release', (req, res) => escrowController.releaseFunds(req, res));

/**
 * POST /api/escrow/:escrowId/refund
 * Process refund (internal/admin)
 */
router.post('/:escrowId/refund', (req, res) => escrowController.refundEscrow(req, res));

/**
 * GET /api/escrow/seller/:sellerId/can-withdraw
 * Check if seller can withdraw funds
 */
router.get('/seller/:sellerId/can-withdraw', (req, res) => 
  escrowController.canWithdraw(req, res)
);

/**
 * GET /api/escrow/seller/:sellerId/balance
 * Get seller's available balance
 */
router.get('/seller/:sellerId/balance', (req, res) => 
  escrowController.getAvailableBalance(req, res)
);

export default router;
