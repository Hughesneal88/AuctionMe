const Auction = require('../models/Auction');
const Bid = require('../models/Bid');

class AuctionService {
  // Create a new auction
  async createAuction(auctionData) {
    const { title, description, images, startingBid, duration, sellerId } = auctionData;
    
    // Calculate end time based on duration
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + duration);
    
    const auction = new Auction({
      title,
      description,
      images: images || [],
      startingBid,
      currentBid: startingBid,
      duration,
      endTime,
      sellerId
    });
    
    return await auction.save();
  }

  // Get auction by ID
  async getAuctionById(auctionId) {
    return await Auction.findById(auctionId)
      .populate('sellerId', 'username email')
      .populate('winnerId', 'username email');
  }

  // Update auction (with edit prevention after first bid)
  async updateAuction(auctionId, updateData, userId) {
    const auction = await Auction.findById(auctionId);
    
    if (!auction) {
      throw new Error('Auction not found');
    }
    
    // Check if user is the seller
    if (auction.sellerId.toString() !== userId) {
      throw new Error('Unauthorized: Only the seller can update this auction');
    }
    
    // Prevent editing after first bid
    if (!auction.canEdit()) {
      throw new Error('Cannot edit auction after first bid has been placed');
    }
    
    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'images', 'startingBid', 'duration'];
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        auction[field] = updateData[field];
      }
    });
    
    // Recalculate end time if duration changed
    if (updateData.duration) {
      auction.endTime = new Date(auction.startTime);
      auction.endTime.setHours(auction.endTime.getHours() + updateData.duration);
    }
    
    return await auction.save();
  }

  // Browse and search auctions with pagination and filters
  async browseAuctions(filters = {}, page = 1, limit = 10) {
    const query = { status: 'active' };
    
    // Add search filter
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    // Filter by minimum bid
    if (filters.minBid) {
      query.currentBid = { $gte: filters.minBid };
    }
    
    // Filter by maximum bid
    if (filters.maxBid) {
      query.currentBid = { ...query.currentBid, $lte: filters.maxBid };
    }
    
    // Filter by seller
    if (filters.sellerId) {
      query.sellerId = filters.sellerId;
    }
    
    // Hide expired auctions
    query.endTime = { $gt: new Date() };
    
    const skip = (page - 1) * limit;
    
    const auctions = await Auction.find(query)
      .populate('sellerId', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Auction.countDocuments(query);
    
    return {
      auctions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Close auction and determine winner
  async closeAuction(auctionId) {
    const auction = await Auction.findById(auctionId);
    
    if (!auction) {
      throw new Error('Auction not found');
    }
    
    if (auction.status === 'closed') {
      return auction; // Already closed
    }
    
    // Find the winning bid (highest bid)
    const winningBid = await Bid.findOne({ auctionId })
      .sort({ amount: -1, timestamp: 1 })
      .limit(1);
    
    auction.status = 'closed';
    
    if (winningBid) {
      auction.winnerId = winningBid.bidderId;
      auction.currentBid = winningBid.amount;
    }
    
    return await auction.save();
  }

  // Get auctions that need to be closed
  async getExpiredAuctions() {
    return await Auction.find({
      status: 'active',
      endTime: { $lte: new Date() }
    });
  }
}

module.exports = new AuctionService();
