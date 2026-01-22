const { v4: uuidv4 } = require('uuid');

/**
 * Payment Model
 * Represents a payment transaction
 */
class Payment {
  constructor({ id, userId, amount, type, status = 'pending', gatewayTransactionId }) {
    this.id = id || uuidv4();
    this.userId = userId;
    this.amount = amount;
    this.type = type; // charge, refund, payout
    this.status = status; // pending, completed, failed, cancelled
    this.gatewayTransactionId = gatewayTransactionId || null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.completedAt = null;
    this.errorMessage = null;
  }

  /**
   * Mark payment as completed
   */
  complete(gatewayTransactionId) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.updatedAt = new Date();
    if (gatewayTransactionId) {
      this.gatewayTransactionId = gatewayTransactionId;
    }
  }

  /**
   * Mark payment as failed
   */
  fail(errorMessage) {
    this.status = 'failed';
    this.errorMessage = errorMessage;
    this.updatedAt = new Date();
  }

  /**
   * Cancel payment
   */
  cancel() {
    if (this.status === 'completed') {
      throw new Error('Cannot cancel completed payment');
    }
    this.status = 'cancelled';
    this.updatedAt = new Date();
  }

  /**
   * Validate payment amount
   */
  static validateAmount(amount) {
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Payment amount must be a positive number');
    }
    return true;
  }
}

module.exports = Payment;
