const Payment = require('../models/Payment');
const MockPaymentGateway = require('./MockPaymentGateway');
const config = require('../config');

/**
 * Payment Service
 * Handles payment processing through payment gateway
 */
class PaymentService {
  constructor(gateway = null) {
    // Use mock gateway if enabled or provided, otherwise would use real gateway
    this.gateway = gateway || (config.paymentGateway.mockEnabled ? new MockPaymentGateway() : null);
    
    if (!this.gateway) {
      throw new Error('Payment gateway not configured');
    }
  }

  /**
   * Process a payment charge
   */
  async processCharge(userId, amount, metadata = {}) {
    const payment = new Payment({
      userId,
      amount,
      type: 'charge',
      status: 'pending'
    });

    try {
      const result = await this.gateway.charge(userId, amount, metadata);
      payment.complete(result.transactionId);
      return payment;
    } catch (error) {
      payment.fail(error.message);
      throw error;
    }
  }

  /**
   * Process a refund
   */
  async processRefund(userId, amount, originalTransactionId) {
    const payment = new Payment({
      userId,
      amount,
      type: 'refund',
      status: 'pending'
    });

    try {
      const result = await this.gateway.refund(originalTransactionId, amount);
      payment.complete(result.transactionId);
      return payment;
    } catch (error) {
      payment.fail(error.message);
      throw error;
    }
  }

  /**
   * Process a payout to seller
   */
  async processPayout(userId, amount, metadata = {}) {
    const payment = new Payment({
      userId,
      amount,
      type: 'payout',
      status: 'pending'
    });

    try {
      const result = await this.gateway.payout(userId, amount, metadata);
      payment.complete(result.transactionId);
      return payment;
    } catch (error) {
      payment.fail(error.message);
      throw error;
    }
  }

  /**
   * Get payment details
   */
  async getPayment(transactionId) {
    return await this.gateway.getTransaction(transactionId);
  }
}

module.exports = PaymentService;
