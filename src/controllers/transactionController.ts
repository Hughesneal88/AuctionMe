import { Request, Response } from 'express';
import { TransactionService } from '../services/TransactionService';
import { EscrowService } from '../services/EscrowService';
import { CreateTransactionRequest } from '../types';
import crypto from 'crypto';

const transactionService = new TransactionService();
const escrowService = new EscrowService();

/**
 * Create a new transaction (payment initiation)
 */
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { user_id, auction_id, amount, currency, payment_method, payment_provider, metadata } = req.body;

    // Validate required fields
    if (!user_id || !amount || !payment_method || !payment_provider) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Generate idempotency key
    const idempotencyKey = req.headers['idempotency-key'] as string || crypto.randomUUID();

    const transactionData: CreateTransactionRequest = {
      user_id,
      auction_id,
      amount,
      currency: currency || 'USD',
      payment_method,
      payment_provider,
      transaction_type: 'payment',
      idempotency_key: idempotencyKey,
      metadata,
    };

    const transaction = await transactionService.createTransaction(transactionData);

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create transaction',
    });
  }
};

/**
 * Initiate payment for a transaction
 */
export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const { transaction_id, email, phone_number, redirect_url } = req.body;

    if (!transaction_id || !email || !phone_number || !redirect_url) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const result = await transactionService.initiatePayment(
      transaction_id,
      email,
      phone_number,
      redirect_url
    );

    res.status(200).json({
      success: true,
      data: {
        transaction: result.transaction,
        payment_link: result.payment_link,
      },
    });
  } catch (error: any) {
    console.error('Initiate payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate payment',
    });
  }
};

/**
 * Verify payment status
 */
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const transaction_id = req.params.transaction_id as string;

    if (!transaction_id) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required',
      });
    }

    const transaction = await transactionService.verifyPayment(parseInt(transaction_id));

    // If payment is completed, create escrow
    if (transaction.status === 'completed' && transaction.auction_id) {
      // Check if escrow already exists
      try {
        await escrowService.getEscrowByAuction(transaction.auction_id);
      } catch {
        // Create escrow if it doesn't exist
        // Note: In production, fetch auction details to get buyer and seller IDs
        // For now, using mock data
        await escrowService.createEscrow({
          transaction_id: transaction.id,
          auction_id: transaction.auction_id,
          buyer_id: transaction.user_id,
          seller_id: 1, // Mock seller ID - should come from auction
          amount: transaction.amount,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment',
    });
  }
};

/**
 * Get transaction details
 */
export const getTransaction = async (req: Request, res: Response) => {
  try {
    const transaction_id = req.params.transaction_id as string;

    if (!transaction_id) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required',
      });
    }

    const transaction = await transactionService.getTransaction(parseInt(transaction_id));

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('Get transaction error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Transaction not found',
    });
  }
};

/**
 * Get user transactions
 */
export const getUserTransactions = async (req: Request, res: Response) => {
  try {
    const user_id = req.params.user_id as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const transactions = await transactionService.getUserTransactions(parseInt(user_id), limit);

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error: any) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user transactions',
    });
  }
};
