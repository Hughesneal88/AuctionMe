import { Notification, NotificationType } from '../models/Notification';
import { db } from '../utils/database';
import { v4 as uuidv4 } from 'uuid';

export class NotificationService {
  /**
   * Notify a user when they've been outbid
   */
  async notifyOutbid(userId: string, auctionId: string, newBidAmount: number): Promise<Notification> {
    const auction = db.getAuctionById(auctionId);
    const message = `You have been outbid on "${auction?.title}". New bid: $${newBidAmount}`;
    
    return this.createNotification(userId, NotificationType.OUTBID, message, auctionId);
  }

  /**
   * Notify the winner of an auction
   */
  async notifyWinner(userId: string, auctionId: string, winningBid: number): Promise<Notification> {
    const auction = db.getAuctionById(auctionId);
    const message = `Congratulations! You won the auction for "${auction?.title}" with a bid of $${winningBid}`;
    
    return this.createNotification(userId, NotificationType.AUCTION_WON, message, auctionId);
  }

  /**
   * Notify losers of an auction
   */
  async notifyLosers(userIds: string[], auctionId: string): Promise<Notification[]> {
    const auction = db.getAuctionById(auctionId);
    const message = `The auction for "${auction?.title}" has ended. You did not win.`;
    
    const notifications: Notification[] = [];
    for (const userId of userIds) {
      const notification = this.createNotification(
        userId,
        NotificationType.AUCTION_LOST,
        message,
        auctionId
      );
      notifications.push(notification);
    }
    
    return notifications;
  }

  /**
   * Notify when a new bid is placed (for auction owner)
   */
  async notifyBidPlaced(userId: string, auctionId: string, bidAmount: number): Promise<Notification> {
    const auction = db.getAuctionById(auctionId);
    const message = `New bid of $${bidAmount} placed on your auction "${auction?.title}"`;
    
    return this.createNotification(userId, NotificationType.BID_PLACED, message, auctionId);
  }

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return db.getNotificationsByUserId(userId);
  }

  /**
   * Send delivery code notification to buyer
   * In production, this should send via SMS/Email
   */
  async notifyDeliveryCode(
    userId: string, 
    auctionId: string, 
    escrowId: string, 
    deliveryCode: string
  ): Promise<Notification> {
    const message = `Your delivery code for auction ${auctionId} is: ${deliveryCode}. Share this code with the seller to confirm delivery. Keep it safe - it can only be used once.`;
    
    // In production, send this via SMS/Email instead of just storing
    // For now, we'll create an in-app notification
    console.log(`🔔 DELIVERY CODE NOTIFICATION for user ${userId}:`);
    console.log(`   Escrow: ${escrowId}`);
    console.log(`   Code: [REDACTED] (sent to user via notification)`);
    console.log(`   ⚠️ In production, send via SMS/Email`);
    
    return this.createNotification(userId, NotificationType.DELIVERY_CODE, message, auctionId);
  }

  /**
   * Create a notification
   */
  private createNotification(
    userId: string,
    type: NotificationType,
    message: string,
    auctionId: string
  ): Notification {
    const notification: Notification = {
      id: uuidv4(),
      userId,
      type,
      message,
      auctionId,
      read: false,
      createdAt: new Date(),
    };

    return db.createNotification(notification);
  }
}

export const notificationService = new NotificationService();
