const Escrow = require('../models/Escrow');
const PaymentService = require('./PaymentService');
const config = require('../config');

/**
 * Escrow Service
 * Manages escrow accounts for auction transactions
 */
class EscrowService {
  constructor(paymentService = null) {
    this.escrows = new Map(); // In-memory storage (would be database in production)
    this.paymentService = paymentService || new PaymentService();
  }

  /**
   * Create an escrow account and charge the buyer
   */
  async createEscrow(auctionId, buyerId, sellerId, amount) {
    try {
      // Charge the buyer
      await this.paymentService.processCharge(buyerId, amount, {
        auctionId,
        purpose: 'escrow'
      });

      // Create escrow record
      const escrow = new Escrow({
        auctionId,
        buyerId,
        sellerId,
        amount,
        status: 'held'
      });

      this.escrows.set(escrow.id, escrow);

      return escrow;
    } catch (error) {
      throw new Error(`Failed to create escrow: ${error.message}`);
    }
  }

  /**
   * Verify delivery with code
   */
  verifyDelivery(escrowId, deliveryCode) {
    const escrow = this.escrows.get(escrowId);
    
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    return escrow.verifyDelivery(deliveryCode);
  }

  /**
   * Release funds to seller after delivery confirmation
   */
  async releaseFunds(escrowId) {
    const escrow = this.escrows.get(escrowId);
    
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    // Check if auto-release is allowed
    const autoReleaseHours = config.escrow.releaseDelayHours;
    if (!escrow.canAutoRelease(autoReleaseHours)) {
      throw new Error(`Funds can only be released ${autoReleaseHours} hours after delivery confirmation`);
    }

    try {
      // Process payout to seller
      await this.paymentService.processPayout(escrow.sellerId, escrow.amount, {
        auctionId: escrow.auctionId,
        escrowId: escrow.id
      });

      // Release escrow
      escrow.release();
      this.escrows.set(escrow.id, escrow);

      return escrow;
    } catch (error) {
      throw new Error(`Failed to release funds: ${error.message}`);
    }
  }

  /**
   * Refund to buyer (in case of disputes or cancellation)
   */
  async refundEscrow(escrowId, originalTransactionId) {
    const escrow = this.escrows.get(escrowId);
    
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    try {
      // Process refund
      await this.paymentService.processRefund(escrow.buyerId, escrow.amount, originalTransactionId);

      // Update escrow status
      escrow.refund();
      this.escrows.set(escrow.id, escrow);

      return escrow;
    } catch (error) {
      throw new Error(`Failed to refund escrow: ${error.message}`);
    }
  }

  /**
   * Dispute an escrow
   */
  disputeEscrow(escrowId) {
    const escrow = this.escrows.get(escrowId);
    
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    escrow.dispute();
    this.escrows.set(escrow.id, escrow);

    return escrow;
  }

  /**
   * Get escrow details
   */
  getEscrow(escrowId) {
    const escrow = this.escrows.get(escrowId);
    
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    return escrow;
  }

  /**
   * Get delivery code for escrow (seller only)
   */
  getDeliveryCode(escrowId) {
    const escrow = this.escrows.get(escrowId);
    
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    return escrow.deliveryCode;
  }

  /**
   * Check and auto-release eligible escrows
   */
  async autoReleaseEligibleEscrows() {
    const released = [];
    const autoReleaseHours = config.escrow.releaseDelayHours;

    for (const [id, escrow] of this.escrows.entries()) {
      if (escrow.status === 'held' && escrow.canAutoRelease(autoReleaseHours)) {
        try {
          await this.releaseFunds(id);
          released.push(id);
        } catch (error) {
          console.error(`Failed to auto-release escrow ${id}:`, error.message);
        }
      }
    }

    return released;
  }
}

module.exports = EscrowService;
