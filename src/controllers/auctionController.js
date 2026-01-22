const auctionService = require('../services/auctionService');

class AuctionController {
  // Create a new auction
  async createAuction(req, res) {
    try {
      const { title, description, images, startingBid, duration } = req.body;
      
      // Validate required fields
      if (!title || !description || !startingBid || !duration) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: title, description, startingBid, duration'
        });
      }
      
      // In a real app, sellerId would come from authenticated user
      // For now, we'll require it in the request body
      const sellerId = req.body.sellerId || req.user?.id;
      
      if (!sellerId) {
        return res.status(401).json({
          success: false,
          message: 'Seller ID required'
        });
      }
      
      const auction = await auctionService.createAuction({
        title,
        description,
        images,
        startingBid,
        duration,
        sellerId
      });
      
      res.status(201).json({
        success: true,
        data: auction
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get a single auction
  async getAuction(req, res) {
    try {
      const { id } = req.params;
      const auction = await auctionService.getAuctionById(id);
      
      if (!auction) {
        return res.status(404).json({
          success: false,
          message: 'Auction not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: auction
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update an auction
  async updateAuction(req, res) {
    try {
      const { id } = req.params;
      const userId = req.body.userId || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User ID required'
        });
      }
      
      const auction = await auctionService.updateAuction(id, req.body, userId);
      
      res.status(200).json({
        success: true,
        data: auction
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 :
                         error.message.includes('Unauthorized') ? 403 :
                         error.message.includes('Cannot edit') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Browse auctions with pagination and filters
  async browseAuctions(req, res) {
    try {
      const { page = 1, limit = 10, search, minBid, maxBid, sellerId } = req.query;
      
      const filters = {
        search,
        minBid: minBid ? parseFloat(minBid) : undefined,
        maxBid: maxBid ? parseFloat(maxBid) : undefined,
        sellerId
      };
      
      const result = await auctionService.browseAuctions(
        filters,
        parseInt(page),
        parseInt(limit)
      );
      
      res.status(200).json({
        success: true,
        data: result.auctions,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Manually close an auction (for testing or admin use)
  async closeAuction(req, res) {
    try {
      const { id } = req.params;
      const auction = await auctionService.closeAuction(id);
      
      res.status(200).json({
        success: true,
        data: auction,
        message: 'Auction closed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AuctionController();
