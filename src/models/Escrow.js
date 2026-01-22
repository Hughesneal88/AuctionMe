const { v4: uuidv4 } = require('uuid');

/**
 * Escrow Model
 * Represents escrowed funds for an auction
 */
class Escrow {
  constructor({ id, auctionId, buyerId, sellerId, amount, status = 'held' }) {
    this.id = id || uuidv4();
    this.auctionId = auctionId;
    this.buyerId = buyerId;
    this.sellerId = sellerId;
    this.amount = amount;
    this.status = status; // held, released, refunded, disputed
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.releasedAt = null;
    this.deliveryCode = this.generateDeliveryCode();
    this.deliveryConfirmedAt = null;
  }

  /**
   * Generate a 6-digit delivery verification code
   */
  generateDeliveryCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Verify delivery with code
   */
  verifyDelivery(code) {
    if (this.status !== 'held') {
      throw new Error('Escrow must be in held status to verify delivery');
    }
    if (code !== this.deliveryCode) {
      throw new Error('Invalid delivery code');
    }
    this.deliveryConfirmedAt = new Date();
    return true;
  }

  /**
   * Release funds to seller
   */
  release() {
    if (this.status !== 'held') {
      throw new Error('Escrow must be in held status to release');
    }
    if (!this.deliveryConfirmedAt) {
      throw new Error('Delivery must be confirmed before releasing funds');
    }
    this.status = 'released';
    this.releasedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Refund to buyer
   */
  refund() {
    if (this.status !== 'held') {
      throw new Error('Escrow must be in held status to refund');
    }
    this.status = 'refunded';
    this.updatedAt = new Date();
  }

  /**
   * Mark as disputed
   */
  dispute() {
    if (this.status !== 'held') {
      throw new Error('Can only dispute held escrows');
    }
    this.status = 'disputed';
    this.updatedAt = new Date();
  }

  /**
   * Check if escrow can be auto-released
   */
  canAutoRelease(autoReleaseHours = 24) {
    if (!this.deliveryConfirmedAt) {
      return false;
    }
    const hoursElapsed = (new Date() - this.deliveryConfirmedAt) / (1000 * 60 * 60);
    return hoursElapsed >= autoReleaseHours;
  }
}

module.exports = Escrow;
