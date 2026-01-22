const { v4: uuidv4 } = require('uuid');

/**
 * Auction Model
 * Represents an auction item
 */
class Auction {
  constructor({ id, sellerId, title, description, startingBid, currentBid, endTime, status = 'active' }) {
    this.id = id || uuidv4();
    this.sellerId = sellerId;
    this.title = title;
    this.description = description;
    this.startingBid = startingBid;
    this.currentBid = currentBid || startingBid;
    this.endTime = endTime;
    this.status = status; // active, ended, completed, cancelled
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Check if auction is still active
   */
  isActive() {
    return this.status === 'active' && new Date() < new Date(this.endTime);
  }

  /**
   * Update the current bid
   */
  updateBid(amount) {
    if (!this.isActive()) {
      throw new Error('Auction is not active');
    }
    if (amount <= this.currentBid) {
      throw new Error('Bid must be higher than current bid');
    }
    this.currentBid = amount;
    this.updatedAt = new Date();
  }

  /**
   * End the auction
   */
  end() {
    this.status = 'ended';
    this.updatedAt = new Date();
  }

  /**
   * Mark auction as completed
   */
  complete() {
    this.status = 'completed';
    this.updatedAt = new Date();
  }

  /**
   * Cancel the auction
   */
  cancel() {
    this.status = 'cancelled';
    this.updatedAt = new Date();
  }
}

module.exports = Auction;
