import { Router } from 'express';
import {
  createTransaction,
  initiatePayment,
  verifyPayment,
  getTransaction,
  getUserTransactions,
} from '../controllers/transactionController';

const router = Router();

/**
 * @route   POST /api/transactions
 * @desc    Create a new transaction
 * @access  Private
 */
router.post('/', createTransaction);

/**
 * @route   POST /api/transactions/initiate
 * @desc    Initiate payment for a transaction
 * @access  Private
 */
router.post('/initiate', initiatePayment);

/**
 * @route   GET /api/transactions/:transaction_id/verify
 * @desc    Verify payment status
 * @access  Private
 */
router.get('/:transaction_id/verify', verifyPayment);

/**
 * @route   GET /api/transactions/:transaction_id
 * @desc    Get transaction details
 * @access  Private
 */
router.get('/:transaction_id', getTransaction);

/**
 * @route   GET /api/transactions/user/:user_id
 * @desc    Get user transactions
 * @access  Private
 */
router.get('/user/:user_id', getUserTransactions);

export default router;
