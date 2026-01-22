import { Request, Response } from 'express';
import { bidService, BidValidationError } from '../services/bidService';
import { notificationService } from '../services/notificationService';
import { wsService } from '../services/webSocketService';
import { db } from '../utils/database';

export class BidController {
  /**
   * Place a new bid
   * POST /api/bids
   */
  async placeBid(req: Request, res: Response): Promise<void> {
    try {
      const { auctionId, bidderId, amount } = req.body;

      // Validate input
      if (!auctionId || !bidderId || !amount) {
        res.status(400).json({ error: 'Missing required fields: auctionId, bidderId, amount' });
        return;
      }

      if (typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({ error: 'Amount must be a positive number' });
        return;
      }

      // Get current highest bidder before placing new bid
      const currentHighestBidder = await bidService.getCurrentHighestBidder(auctionId);

      // Place the bid
      const bid = await bidService.placeBid(auctionId, bidderId, amount);

      // Notify previous highest bidder that they've been outbid
      if (currentHighestBidder && currentHighestBidder !== bidderId) {
        const notification = await notificationService.notifyOutbid(
          currentHighestBidder,
          auctionId,
          amount
        );
        wsService.sendNotificationToUser(currentHighestBidder, notification);
      }

      // Notify auction owner of new bid
      const auction = db.getAuctionById(auctionId);
      if (auction) {
        const ownerNotification = await notificationService.notifyBidPlaced(
          auction.sellerId,
          auctionId,
          amount
        );
        wsService.sendNotificationToUser(auction.sellerId, ownerNotification);
      }

      // Broadcast new bid to all clients watching this auction
      wsService.broadcastNewBid(auctionId, bid);

      res.status(201).json({
        success: true,
        bid,
        message: 'Bid placed successfully',
      });
    } catch (error) {
      if (error instanceof BidValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        console.error('Error placing bid:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  /**
   * Get all bids for an auction
   * GET /api/bids/auction/:auctionId
   */
  async getBidsForAuction(req: Request, res: Response): Promise<void> {
    try {
      const auctionId = req.params.auctionId as string;
      const bids = await bidService.getBidsForAuction(auctionId);
      
      res.status(200).json({
        success: true,
        bids,
        count: bids.length,
      });
    } catch (error) {
      console.error('Error getting bids:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get highest bid for an auction
   * GET /api/bids/auction/:auctionId/highest
   */
  async getHighestBid(req: Request, res: Response): Promise<void> {
    try {
      const auctionId = req.params.auctionId as string;
      const bid = await bidService.getHighestBid(auctionId);
      
      if (!bid) {
        res.status(404).json({ error: 'No bids found for this auction' });
        return;
      }

      res.status(200).json({
        success: true,
        bid,
      });
    } catch (error) {
      console.error('Error getting highest bid:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all bids by a bidder
   * GET /api/bids/bidder/:bidderId
   */
  async getBidsByBidder(req: Request, res: Response): Promise<void> {
    try {
      const bidderId = req.params.bidderId as string;
      const bids = await bidService.getBidsByBidder(bidderId);
      
      res.status(200).json({
        success: true,
        bids,
        count: bids.length,
      });
    } catch (error) {
      console.error('Error getting bidder bids:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const bidController = new BidController();
