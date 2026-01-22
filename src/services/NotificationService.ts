import { notificationStore } from '../models/NotificationModel';
import { auditLogStore } from '../models/AuditLogModel';
import { Notification, NotificationType, NotificationStatus, AuditAction } from '../types';

/**
 * Service for managing in-app notifications
 */
export class NotificationService {
  /**
   * Create a new notification for a user
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<Notification> {
    const notification = notificationStore.create({
      userId,
      type,
      title,
      message,
      status: NotificationStatus.UNREAD,
      metadata,
    });

    // Log notification creation
    auditLogStore.create({
      userId,
      action: AuditAction.NOTIFICATION_SENT,
      resource: 'notification',
      resourceId: notification.id,
      details: { type, title },
      severity: 'LOW',
    });

    return notification;
  }

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return notificationStore.findByUserId(userId);
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return notificationStore.countUnread(userId);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    const notification = notificationStore.findById(notificationId);
    
    if (!notification || notification.userId !== userId) {
      return null;
    }

    const updated = notificationStore.update(notificationId, {
      status: NotificationStatus.READ,
      readAt: new Date(),
    });

    return updated || null;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const notifications = notificationStore.findByUserId(userId);
    let count = 0;

    for (const notification of notifications) {
      if (notification.status === NotificationStatus.UNREAD) {
        notificationStore.update(notification.id, {
          status: NotificationStatus.READ,
          readAt: new Date(),
        });
        count++;
      }
    }

    return count;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const notification = notificationStore.findById(notificationId);
    
    if (!notification || notification.userId !== userId) {
      return false;
    }

    return notificationStore.delete(notificationId);
  }

  /**
   * Send bid-related notifications
   */
  async notifyBidPlaced(auctionId: string, bidderId: string, sellerId: string, amount: number): Promise<void> {
    await this.createNotification(
      sellerId,
      NotificationType.BID_PLACED,
      'New Bid Placed',
      `A new bid of $${amount} was placed on your auction`,
      { auctionId, bidderId, amount }
    );
  }

  async notifyBidWon(auctionId: string, winnerId: string, amount: number): Promise<void> {
    await this.createNotification(
      winnerId,
      NotificationType.BID_WON,
      'Congratulations! You Won',
      `You won the auction with a bid of $${amount}`,
      { auctionId, amount }
    );
  }

  async notifyOutbid(auctionId: string, userId: string, newAmount: number): Promise<void> {
    await this.createNotification(
      userId,
      NotificationType.BID_OUTBID,
      'You Were Outbid',
      `Your bid was outbid. New highest bid: $${newAmount}`,
      { auctionId, newAmount }
    );
  }

  /**
   * Send delivery-related notifications
   */
  async notifyDeliveryCode(auctionId: string, buyerId: string, code: string): Promise<void> {
    await this.createNotification(
      buyerId,
      NotificationType.DELIVERY_CODE_GENERATED,
      'Delivery Code Generated',
      `Your delivery code is: ${code}. Share this with the seller upon delivery.`,
      { auctionId, code }
    );
  }

  async notifyItemDelivered(auctionId: string, sellerId: string, buyerId: string): Promise<void> {
    await Promise.all([
      this.createNotification(
        sellerId,
        NotificationType.ITEM_DELIVERED,
        'Item Delivered Successfully',
        'The delivery code was verified. Payment will be released from escrow.',
        { auctionId }
      ),
      this.createNotification(
        buyerId,
        NotificationType.ITEM_DELIVERED,
        'Item Delivery Confirmed',
        'Your delivery was confirmed. Enjoy your purchase!',
        { auctionId }
      ),
    ]);
  }

  /**
   * Send security notifications
   */
  async notifySecurityAlert(userId: string, reason: string, details: Record<string, any>): Promise<void> {
    await this.createNotification(
      userId,
      NotificationType.SECURITY_ALERT,
      'Security Alert',
      reason,
      details
    );
  }

  async notifyRateLimitWarning(userId: string, action: string): Promise<void> {
    await this.createNotification(
      userId,
      NotificationType.RATE_LIMIT_WARNING,
      'Rate Limit Warning',
      `You are approaching the rate limit for ${action}. Please slow down.`,
      { action }
    );
  }
}

export const notificationService = new NotificationService();
