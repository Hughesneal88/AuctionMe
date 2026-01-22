const Bid = require('../models/Bid');
const Auction = require('../models/Auction');

class BidService {
  // Place a bid on an auction
  async placeBid(auctionId, bidderId, amount) {
    const auction = await Auction.findById(auctionId);
    
    if (!auction) {
      throw new Error('Auction not found');
    }
    
    // Check if auction is active
    if (auction.status !== 'active') {
      throw new Error('Auction is not active');
    }
    
    // Check if auction has expired
    if (auction.isExpired()) {
      throw new Error('Auction has expired');
    }
    
    // Check if bid is higher than current bid
    if (amount <= auction.currentBid) {
      throw new Error(`Bid must be higher than current bid of ${auction.currentBid}`);
    }
    
    // Check if bidder is not the seller
    if (auction.sellerId.toString() === bidderId) {
      throw new Error('Seller cannot bid on their own auction');
    }
    
    // Create the bid
    const bid = new Bid({
      auctionId,
      bidderId,
      amount
    });
    
    await bid.save();
    
    // Update auction
    auction.currentBid = amount;
    auction.bidCount += 1;
    
    // Set first bid time if this is the first bid
    if (!auction.firstBidTime) {
      auction.firstBidTime = new Date();
    }
    
    await auction.save();
    
    return bid;
  }

  // Get all bids for an auction
  async getAuctionBids(auctionId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const bids = await Bid.find({ auctionId })
      .populate('bidderId', 'username email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Bid.countDocuments({ auctionId });
    
    return {
      bids,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get highest bid for an auction
  async getHighestBid(auctionId) {
    return await Bid.findOne({ auctionId })
      .sort({ amount: -1, timestamp: 1 })
      .limit(1)
      .populate('bidderId', 'username email');
  }

  // Get bids by user
  async getUserBids(bidderId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const bids = await Bid.find({ bidderId })
      .populate('auctionId')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Bid.countDocuments({ bidderId });
    
    return {
      bids,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new BidService();
