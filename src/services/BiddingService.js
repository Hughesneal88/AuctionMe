const Auction = require('../models/Auction');
const Bid = require('../models/Bid');

/**
 * Bidding Service
 * Manages auction bidding logic
 */
class BiddingService {
  constructor() {
    this.auctions = new Map(); // In-memory storage (would be database in production)
    this.bids = new Map(); // In-memory storage
  }

  /**
   * Create a new auction
   */
  createAuction(sellerId, title, description, startingBid, endTime) {
    const auction = new Auction({
      sellerId,
      title,
      description,
      startingBid,
      endTime
    });

    this.auctions.set(auction.id, auction);
    return auction;
  }

  /**
   * Place a bid on an auction
   */
  placeBid(auctionId, bidderId, amount) {
    const auction = this.auctions.get(auctionId);
    
    if (!auction) {
      throw new Error('Auction not found');
    }

    if (!auction.isActive()) {
      throw new Error('Auction is not active');
    }

    if (bidderId === auction.sellerId) {
      throw new Error('Seller cannot bid on their own auction');
    }

    // Validate bid amount
    Bid.validateAmount(amount);

    if (amount <= auction.currentBid) {
      throw new Error(`Bid must be higher than current bid of ${auction.currentBid}`);
    }

    // Create bid
    const bid = new Bid({
      auctionId,
      bidderId,
      amount
    });

    // Mark previous highest bid as outbid
    const previousBids = this.getBidsForAuction(auctionId);
    previousBids.forEach(prevBid => {
      if (prevBid.status === 'winning') {
        prevBid.markAsOutbid();
        this.bids.set(prevBid.id, prevBid);
      }
    });

    // Mark new bid as winning
    bid.markAsWinning();

    // Update auction
    auction.updateBid(amount);
    this.auctions.set(auction.id, auction);

    // Store bid
    this.bids.set(bid.id, bid);

    return bid;
  }

  /**
   * Get auction details
   */
  getAuction(auctionId) {
    const auction = this.auctions.get(auctionId);
    
    if (!auction) {
      throw new Error('Auction not found');
    }

    return auction;
  }

  /**
   * Get all bids for an auction
   */
  getBidsForAuction(auctionId) {
    const auctionBids = [];
    
    for (const bid of this.bids.values()) {
      if (bid.auctionId === auctionId) {
        auctionBids.push(bid);
      }
    }

    // Sort by amount descending
    return auctionBids.sort((a, b) => b.amount - a.amount);
  }

  /**
   * Get winning bid for an auction
   */
  getWinningBid(auctionId) {
    const auction = this.auctions.get(auctionId);
    
    if (!auction) {
      throw new Error('Auction not found');
    }

    const bids = this.getBidsForAuction(auctionId);
    return bids.find(bid => bid.status === 'winning') || null;
  }

  /**
   * End an auction
   */
  endAuction(auctionId) {
    const auction = this.auctions.get(auctionId);
    
    if (!auction) {
      throw new Error('Auction not found');
    }

    auction.end();
    this.auctions.set(auction.id, auction);

    // Mark all non-winning bids as lost
    const bids = this.getBidsForAuction(auctionId);
    bids.forEach(bid => {
      if (bid.status !== 'winning') {
        bid.markAsLost();
        this.bids.set(bid.id, bid);
      }
    });

    return auction;
  }

  /**
   * Complete an auction (after delivery)
   */
  completeAuction(auctionId) {
    const auction = this.auctions.get(auctionId);
    
    if (!auction) {
      throw new Error('Auction not found');
    }

    if (auction.status !== 'ended') {
      throw new Error('Auction must be ended before completing');
    }

    auction.complete();
    this.auctions.set(auction.id, auction);

    return auction;
  }

  /**
   * Cancel an auction
   */
  cancelAuction(auctionId, sellerId) {
    const auction = this.auctions.get(auctionId);
    
    if (!auction) {
      throw new Error('Auction not found');
    }

    if (auction.sellerId !== sellerId) {
      throw new Error('Only the seller can cancel the auction');
    }

    if (auction.status !== 'active') {
      throw new Error('Can only cancel active auctions');
    }

    auction.cancel();
    this.auctions.set(auction.id, auction);

    return auction;
  }

  /**
   * Get all auctions by seller
   */
  getAuctionsBySeller(sellerId) {
    const sellerAuctions = [];
    
    for (const auction of this.auctions.values()) {
      if (auction.sellerId === sellerId) {
        sellerAuctions.push(auction);
      }
    }

    return sellerAuctions;
  }

  /**
   * Get all active auctions
   */
  getActiveAuctions() {
    const activeAuctions = [];
    
    for (const auction of this.auctions.values()) {
      if (auction.isActive()) {
        activeAuctions.push(auction);
      }
    }

    return activeAuctions;
  }
}

module.exports = BiddingService;
