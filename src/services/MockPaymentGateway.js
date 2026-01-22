const Payment = require('../models/Payment');

/**
 * Mock Payment Gateway
 * Simulates a payment gateway for testing purposes
 */
class MockPaymentGateway {
  constructor() {
    this.transactions = new Map();
    this.failureRate = 0; // Configurable failure rate for testing (0-1)
  }

  /**
   * Process a payment charge
   */
  async charge(userId, amount, metadata = {}) {
    // Simulate network delay
    await this._simulateDelay();

    // Simulate random failures if configured
    if (Math.random() < this.failureRate) {
      throw new Error('Payment gateway error: Transaction declined');
    }

    // Validate amount
    Payment.validateAmount(amount);

    const transactionId = `mock_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const transaction = {
      id: transactionId,
      userId,
      amount,
      type: 'charge',
      status: 'completed',
      metadata,
      createdAt: new Date()
    };

    this.transactions.set(transactionId, transaction);

    return {
      success: true,
      transactionId,
      amount,
      timestamp: new Date()
    };
  }

  /**
   * Process a refund
   */
  async refund(transactionId, amount) {
    // Simulate network delay
    await this._simulateDelay();

    const originalTransaction = this.transactions.get(transactionId);
    
    if (!originalTransaction) {
      throw new Error('Original transaction not found');
    }

    if (originalTransaction.status !== 'completed') {
      throw new Error('Can only refund completed transactions');
    }

    if (amount > originalTransaction.amount) {
      throw new Error('Refund amount cannot exceed original amount');
    }

    const refundTransactionId = `mock_rfnd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const refundTransaction = {
      id: refundTransactionId,
      originalTransactionId: transactionId,
      userId: originalTransaction.userId,
      amount,
      type: 'refund',
      status: 'completed',
      createdAt: new Date()
    };

    this.transactions.set(refundTransactionId, refundTransaction);

    return {
      success: true,
      transactionId: refundTransactionId,
      amount,
      timestamp: new Date()
    };
  }

  /**
   * Process a payout to seller
   */
  async payout(userId, amount, metadata = {}) {
    // Simulate network delay
    await this._simulateDelay();

    // Simulate random failures if configured
    if (Math.random() < this.failureRate) {
      throw new Error('Payment gateway error: Payout failed');
    }

    Payment.validateAmount(amount);

    const transactionId = `mock_pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const transaction = {
      id: transactionId,
      userId,
      amount,
      type: 'payout',
      status: 'completed',
      metadata,
      createdAt: new Date()
    };

    this.transactions.set(transactionId, transaction);

    return {
      success: true,
      transactionId,
      amount,
      timestamp: new Date()
    };
  }

  /**
   * Get transaction details
   */
  async getTransaction(transactionId) {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    return transaction;
  }

  /**
   * Set failure rate for testing (0-1)
   */
  setFailureRate(rate) {
    if (rate < 0 || rate > 1) {
      throw new Error('Failure rate must be between 0 and 1');
    }
    this.failureRate = rate;
  }

  /**
   * Clear all transactions (for testing)
   */
  clearTransactions() {
    this.transactions.clear();
  }

  /**
   * Simulate network delay
   */
  _simulateDelay() {
    const delay = Math.random() * 100 + 50; // 50-150ms delay
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

module.exports = MockPaymentGateway;
