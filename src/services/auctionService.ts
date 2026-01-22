import { Auction, AuctionStatus } from '../models/Auction';
import { db } from '../utils/database';
import { bidService } from './bidService';
import { notificationService } from './notificationService';
import { wsService } from './webSocketService';

export class AuctionService {
  /**
   * Close an auction and notify participants
   */
  async closeAuction(auctionId: string): Promise<void> {
    const auction = db.getAuctionById(auctionId);
    if (!auction) {
      throw new Error('Auction not found');
    }

    if (auction.status !== AuctionStatus.ACTIVE) {
      throw new Error('Auction is not active');
    }

    // Update auction status
    db.updateAuction(auctionId, { status: AuctionStatus.CLOSED });

    // Get all bids for this auction
    const bids = await bidService.getBidsForAuction(auctionId);
    
    if (bids.length === 0) {
      // No bids placed
      wsService.broadcastAuctionClosed(auctionId);
      return;
    }

    // Get winner (highest bid)
    const winningBid = bids[0];
    const winnerId = winningBid.bidderId;

    // Notify winner
    await notificationService.notifyWinner(winnerId, auctionId, winningBid.amount);
    
    // Get unique losers (all bidders except winner)
    const loserIds = [...new Set(bids.slice(1).map(bid => bid.bidderId))];
    
    // Notify losers
    if (loserIds.length > 0) {
      const notifications = await notificationService.notifyLosers(loserIds, auctionId);
      
      // Send real-time notifications to losers
      notifications.forEach(notification => {
        wsService.sendNotificationToUser(notification.userId, notification);
      });
    }

    // Send real-time notification to winner
    const winnerNotifications = await notificationService.getUserNotifications(winnerId);
    const latestWinnerNotification = winnerNotifications[0];
    if (latestWinnerNotification) {
      wsService.sendNotificationToUser(winnerId, latestWinnerNotification);
    }

    // Broadcast auction closed
    wsService.broadcastAuctionClosed(auctionId, winnerId, winningBid.amount);
  }
}

export const auctionService = new AuctionService();
