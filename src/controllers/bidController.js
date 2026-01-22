const bidService = require('../services/bidService');

class BidController {
  // Place a bid
  async placeBid(req, res) {
    try {
      const { id: auctionId } = req.params;
      const { amount, bidderId } = req.body;
      
      // In a real app, bidderId would come from authenticated user
      const userId = bidderId || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }
      
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid bid amount required'
        });
      }
      
      const bid = await bidService.placeBid(auctionId, userId, amount);
      
      res.status(201).json({
        success: true,
        data: bid,
        message: 'Bid placed successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 :
                         error.message.includes('not active') || 
                         error.message.includes('expired') ||
                         error.message.includes('higher than') ||
                         error.message.includes('cannot bid') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get bids for an auction
  async getAuctionBids(req, res) {
    try {
      const { id: auctionId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      const result = await bidService.getAuctionBids(
        auctionId,
        parseInt(page),
        parseInt(limit)
      );
      
      res.status(200).json({
        success: true,
        data: result.bids,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get highest bid for an auction
  async getHighestBid(req, res) {
    try {
      const { id: auctionId } = req.params;
      const bid = await bidService.getHighestBid(auctionId);
      
      res.status(200).json({
        success: true,
        data: bid
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get user's bids
  async getUserBids(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      const result = await bidService.getUserBids(
        userId,
        parseInt(page),
        parseInt(limit)
      );
      
      res.status(200).json({
        success: true,
        data: result.bids,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new BidController();
