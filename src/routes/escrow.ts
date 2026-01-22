import { Router } from 'express';
import {
  getEscrow,
  getEscrowByAuction,
  verifyDelivery,
  releaseEscrow,
  refundEscrow,
  disputeEscrow,
  checkWithdrawalEligibility,
  getAllHeldEscrows,
} from '../controllers/escrowController';

const router = Router();

/**
 * @route   GET /api/escrow/:escrow_id
 * @desc    Get escrow details by ID
 * @access  Private
 */
router.get('/:escrow_id', getEscrow);

/**
 * @route   GET /api/escrow/auction/:auction_id
 * @desc    Get escrow details by auction ID
 * @access  Private
 */
router.get('/auction/:auction_id', getEscrowByAuction);

/**
 * @route   POST /api/escrow/:escrow_id/verify
 * @desc    Verify delivery code
 * @access  Private
 */
router.post('/:escrow_id/verify', verifyDelivery);

/**
 * @route   POST /api/escrow/:escrow_id/release
 * @desc    Release escrow funds to seller
 * @access  Private
 */
router.post('/:escrow_id/release', releaseEscrow);

/**
 * @route   POST /api/escrow/:escrow_id/refund
 * @desc    Refund escrow to buyer
 * @access  Private (Admin)
 */
router.post('/:escrow_id/refund', refundEscrow);

/**
 * @route   POST /api/escrow/:escrow_id/dispute
 * @desc    Mark escrow as disputed
 * @access  Private
 */
router.post('/:escrow_id/dispute', disputeEscrow);

/**
 * @route   POST /api/escrow/withdrawal/check
 * @desc    Check if seller can withdraw
 * @access  Private (Admin)
 */
router.post('/withdrawal/check', checkWithdrawalEligibility);

/**
 * @route   GET /api/escrow/held/all
 * @desc    Get all held escrows
 * @access  Private (Admin)
 */
router.get('/held/all', getAllHeldEscrows);

export default router;
