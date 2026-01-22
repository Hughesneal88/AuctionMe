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

    // Get winning bid (highest bid by amount)
    const winningBid = await bidService.getHighestBid(auctionId);
    
    if (!winningBid) {
      // No bids placed
      wsService.broadcastAuctionClosed(auctionId);
      return;
    }

    const winnerId = winningBid.bidderId;

    // Notify winner
    await notificationService.notifyWinner(winnerId, auctionId, winningBid.amount);
    
    // Get all bids to find unique losers
    const allBids = await bidService.getBidsForAuction(auctionId);
    
    // Get unique losers (all bidders except winner)
    const loserIds = [...new Set(
      allBids
        .filter(bid => bid.bidderId !== winnerId)
        .map(bid => bid.bidderId)
    )];
    
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
