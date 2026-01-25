import Transaction, { ITransaction } from '../models/Transaction';
import { TransactionStatus, TransactionType, PaymentMethod } from '../types';
import { generateTransactionId } from '../utils/helpers';
import paymentService from './paymentService';
import escrowService from './escrowService';

/**
 * Service for managing transactions
 */
class TransactionService {
  /**
   * Create a new payment transaction
   */
  async createTransaction(
    auctionId: string,
    buyerId: string,
    sellerId: string,
    amount: number,
    currency: string = 'USD',
    paymentMethod: PaymentMethod = PaymentMethod.MOBILE_MONEY
  ): Promise<ITransaction> {
    try {
      const transactionId = generateTransactionId();

      const transaction = new Transaction({
        transactionId,
        auctionId,
        buyerId,
        sellerId,
        amount,
        currency,
        paymentMethod,
        status: TransactionStatus.PENDING,
        type: TransactionType.PAYMENT
      });

      await transaction.save();
      console.log(`Transaction created: ${transactionId}`);
      return transaction;
    } catch (error: any) {
      console.error('Error creating transaction:', error.message);
      throw error;
    }
  }

  /**
   * Initiate payment for a transaction
   */
  async initiatePayment(
    transactionId: string,
    phoneNumber: string,
    email: string,
    callbackUrl: string
  ): Promise<any> {
    try {
      const transaction = await Transaction.findOne({ transactionId });
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== TransactionStatus.PENDING) {
        throw new Error('Transaction is not in pending state');
      }

      // Update status to processing
      transaction.status = TransactionStatus.PROCESSING;
      await transaction.save();

      // Initiate payment with payment service
      const paymentResult = await paymentService.initiatePayment({
        amount: transaction.amount,
        currency: transaction.currency,
        phoneNumber,
        email,
        reference: transactionId,
        description: `Payment for auction ${transaction.auctionId}`,
        callbackUrl
      });

      if (paymentResult.success) {
        transaction.paymentReference = paymentResult.reference;
        transaction.providerReference = paymentResult.transactionId;
        await transaction.save();
      } else {
        transaction.status = TransactionStatus.FAILED;
        await transaction.save();
        throw new Error(paymentResult.error || 'Payment initiation failed');
      }

      return paymentResult;
    } catch (error: any) {
      console.error('Error initiating payment:', error.message);
      throw error;
    }
  }

  /**
   * Handle payment callback/webhook
   */
  async handlePaymentCallback(
    transactionId: string,
    status: string,
    providerReference?: string,
    metadata?: any
  ): Promise<ITransaction> {
    try {
      const transaction = await Transaction.findOne({ transactionId });
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Update transaction status based on callback
      if (status === 'success' || status === 'completed') {
        transaction.status = TransactionStatus.COMPLETED;
        
        if (providerReference) {
          transaction.providerReference = providerReference;
        }
        
        if (metadata) {
          transaction.metadata = metadata;
        }
        
        await transaction.save();

        // Create escrow after successful payment
        const { escrow, deliveryCode } = await escrowService.createEscrow(
          transaction.transactionId,
          transaction.auctionId,
          transaction.buyerId,
          transaction.sellerId,
          transaction.amount,
          transaction.currency
        );

        // TODO: Send delivery code to buyer via SMS/Email using notification service
        // For now, log it for development purposes only
        console.log(`Payment completed for transaction: ${transactionId}`);
        console.log(`DELIVERY CODE for buyer ${transaction.buyerId}: ${deliveryCode} (Escrow: ${escrow.escrowId})`);
        console.log('⚠️ In production, this should be sent via SMS/Email, NOT logged');
      } else if (status === 'failed') {
        transaction.status = TransactionStatus.FAILED;
        if (metadata) {
          transaction.metadata = metadata;
        }
        await transaction.save();
        console.log(`Payment failed for transaction: ${transactionId}`);
      }

      return transaction;
    } catch (error: any) {
      console.error('Error handling payment callback:', error.message);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string): Promise<ITransaction | null> {
    return await Transaction.findOne({ transactionId });
  }

  /**
   * Get transactions by buyer
   */
  async getTransactionsByBuyer(buyerId: string): Promise<ITransaction[]> {
    return await Transaction.find({ buyerId }).sort({ createdAt: -1 });
  }

  /**
   * Get transactions by seller
   */
  async getTransactionsBySeller(sellerId: string): Promise<ITransaction[]> {
    return await Transaction.find({ sellerId }).sort({ createdAt: -1 });
  }

  /**
   * Get transactions by auction
   */
  async getTransactionsByAuction(auctionId: string): Promise<ITransaction[]> {
    return await Transaction.find({ auctionId }).sort({ createdAt: -1 });
  }
}

export default new TransactionService();
