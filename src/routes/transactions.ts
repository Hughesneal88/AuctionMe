import { Router } from 'express';
import {
  createTransaction,
  initiatePayment,
  verifyPayment,
  getTransaction,
  getUserTransactions,
} from '../controllers/transactionController';
import { apiLimiter, strictLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @route   POST /api/transactions
 * @desc    Create a new transaction
 * @access  Private
 */
router.post('/', apiLimiter, createTransaction);

/**
 * @route   POST /api/transactions/initiate
 * @desc    Initiate payment for a transaction
 * @access  Private
 */
router.post('/initiate', strictLimiter, initiatePayment);

/**
 * @route   GET /api/transactions/:transaction_id/verify
 * @desc    Verify payment status
 * @access  Private
 */
router.get('/:transaction_id/verify', apiLimiter, verifyPayment);

/**
 * @route   GET /api/transactions/:transaction_id
 * @desc    Get transaction details
 * @access  Private
 */
router.get('/:transaction_id', apiLimiter, getTransaction);

/**
 * @route   GET /api/transactions/user/:user_id
 * @desc    Get user transactions
 * @access  Private
 */
router.get('/user/:user_id', apiLimiter, getUserTransactions);

export default router;
