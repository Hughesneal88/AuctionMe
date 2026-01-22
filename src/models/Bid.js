const { v4: uuidv4 } = require('uuid');

/**
 * Bid Model
 * Represents a bid on an auction
 */
class Bid {
  constructor({ id, auctionId, bidderId, amount, timestamp }) {
    this.id = id || uuidv4();
    this.auctionId = auctionId;
    this.bidderId = bidderId;
    this.amount = amount;
    this.timestamp = timestamp || new Date();
    this.status = 'pending'; // pending, winning, outbid, lost
  }

  /**
   * Mark bid as winning
   */
  markAsWinning() {
    this.status = 'winning';
  }

  /**
   * Mark bid as outbid
   */
  markAsOutbid() {
    this.status = 'outbid';
  }

  /**
   * Mark bid as lost (auction ended, not winning)
   */
  markAsLost() {
    this.status = 'lost';
  }

  /**
   * Validate bid amount
   */
  static validateAmount(amount) {
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Bid amount must be a positive number');
    }
    return true;
  }
}

module.exports = Bid;
