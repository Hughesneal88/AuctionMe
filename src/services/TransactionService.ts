import { TransactionModel } from '../models/Transaction';
import { EscrowModel } from '../models/Escrow';
import { 
  CreateTransactionRequest, 
  Transaction, 
  TransactionStatus,
  CreateEscrowRequest,
  Escrow
} from '../types';
import { PaymentGatewayService } from './PaymentGatewayService';

/**
 * Transaction Service
 * Handles transaction creation, updates, and payment processing
 */
export class TransactionService {
  private paymentGateway: PaymentGatewayService;

  constructor() {
    this.paymentGateway = new PaymentGatewayService();
  }

  /**
   * Create a new transaction with idempotency check
   */
  async createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
    // Check if transaction already exists with this idempotency key
    const existing = await TransactionModel.findByIdempotencyKey(data.idempotency_key);
    if (existing) {
      return existing;
    }

    // Create new transaction
    const transaction = await TransactionModel.create(data);
    return transaction;
  }

  /**
   * Initiate payment for a transaction
   */
  async initiatePayment(
    transactionId: number,
    email: string,
    phoneNumber: string,
    redirectUrl: string
  ): Promise<{ transaction: Transaction; payment_link: string }> {
    const transaction = await TransactionModel.findById(transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'pending') {
      throw new Error(`Cannot initiate payment for transaction with status: ${transaction.status}`);
    }

    // Initiate payment with gateway
    const paymentResponse = await this.paymentGateway.initiatePayment({
      amount: transaction.amount,
      currency: transaction.currency,
      email,
      phone_number: phoneNumber,
      payment_method: transaction.payment_method,
      redirect_url: redirectUrl,
      metadata: {
        transaction_id: transaction.id,
        auction_id: transaction.auction_id,
      },
    });

    if (paymentResponse.status === 'error') {
      await TransactionModel.updateStatus(transactionId, 'failed');
      throw new Error(paymentResponse.message || 'Payment initiation failed');
    }

    // Update transaction with provider reference
    const updatedTransaction = await TransactionModel.updateStatus(
      transactionId,
      'processing',
      paymentResponse.transaction_reference
    );

    return {
      transaction: updatedTransaction,
      payment_link: paymentResponse.payment_link!,
    };
  }

  /**
   * Verify and complete payment
   */
  async verifyPayment(transactionId: number): Promise<Transaction> {
    const transaction = await TransactionModel.findById(transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (!transaction.provider_transaction_id) {
      throw new Error('Transaction has no provider reference');
    }

    // Verify payment with gateway
    const verificationResult = await this.paymentGateway.verifyPayment(
      transaction.provider_transaction_id
    );

    let newStatus: TransactionStatus;
    
    if (verificationResult.status === 'success') {
      newStatus = 'completed';
    } else if (verificationResult.status === 'failed') {
      newStatus = 'failed';
    } else {
      newStatus = 'processing';
    }

    // Update transaction status
    const updatedTransaction = await TransactionModel.updateStatus(transactionId, newStatus);
    return updatedTransaction;
  }

  /**
   * Process payment webhook callback
   */
  async processPaymentCallback(
    providerTransactionId: string,
    status: 'success' | 'failed',
    metadata?: Record<string, any>
  ): Promise<Transaction> {
    // Find transaction by provider transaction ID
    const transactions = await TransactionModel.findByUserId(0); // This is inefficient, improve in production
    const transaction = transactions.find(t => t.provider_transaction_id === providerTransactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const newStatus: TransactionStatus = status === 'success' ? 'completed' : 'failed';
    const updatedTransaction = await TransactionModel.updateStatus(transaction.id, newStatus);

    return updatedTransaction;
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: number): Promise<Transaction> {
    const transaction = await TransactionModel.findById(transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction;
  }

  /**
   * Get user transactions
   */
  async getUserTransactions(userId: number, limit = 50): Promise<Transaction[]> {
    return TransactionModel.findByUserId(userId, limit);
  }
}
