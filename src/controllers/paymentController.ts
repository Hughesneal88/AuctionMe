import { Request, Response } from 'express';
import transactionService from '../services/transactionService';
import { PaymentMethod } from '../types';
import { verifyWebhookSignature } from '../utils/helpers';

/**
 * Controller for payment-related endpoints
 */
export class PaymentController {
  /**
   * Initiate a payment
   * POST /api/payments/initiate
   */
  async initiatePayment(req: Request, res: Response): Promise<void> {
    try {
      const { auctionId, buyerId, sellerId, amount, currency, phoneNumber, email } = req.body;

      // Validate required fields
      if (!auctionId || !buyerId || !sellerId || !amount || !phoneNumber || !email) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
        return;
      }

      // Create transaction
      const transaction = await transactionService.createTransaction(
        auctionId,
        buyerId,
        sellerId,
        amount,
        currency || 'USD',
        PaymentMethod.MOBILE_MONEY
      );

      // Initiate payment
      const callbackUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/payments/webhook`;
      const paymentResult = await transactionService.initiatePayment(
        transaction.transactionId,
        phoneNumber,
        email,
        callbackUrl
      );

      res.status(200).json({
        success: true,
        data: {
          transactionId: transaction.transactionId,
          ...paymentResult
        }
      });
    } catch (error: any) {
      console.error('Payment initiation error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handle payment webhook/callback
   * POST /api/payments/webhook
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['x-webhook-signature'] as string;
      const webhookSecret = process.env.MOBILE_MONEY_WEBHOOK_SECRET || '';

      // Verify webhook signature for security
      if (webhookSecret && signature) {
        const payload = JSON.stringify(req.body);
        const isValid = verifyWebhookSignature(payload, signature, webhookSecret);
        
        if (!isValid) {
          res.status(401).json({
            success: false,
            error: 'Invalid webhook signature'
          });
          return;
        }
      }

      const { transactionId, status, providerReference, metadata } = req.body;

      if (!transactionId || !status) {
        res.status(400).json({
          success: false,
          error: 'Missing required webhook data'
        });
        return;
      }

      // Handle payment callback
      const transaction = await transactionService.handlePaymentCallback(
        transactionId,
        status,
        providerReference,
        metadata
      );

      res.status(200).json({
        success: true,
        data: {
          transactionId: transaction.transactionId,
          status: transaction.status
        }
      });
    } catch (error: any) {
      console.error('Webhook handling error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get transaction status
   * GET /api/payments/:transactionId
   */
  async getTransactionStatus(req: Request, res: Response): Promise<void> {
    try {
      const transactionId = req.params.transactionId as string;

      const transaction = await transactionService.getTransaction(transactionId);

      if (!transaction) {
        res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: transaction
      });
    } catch (error: any) {
      console.error('Error fetching transaction:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default new PaymentController();
