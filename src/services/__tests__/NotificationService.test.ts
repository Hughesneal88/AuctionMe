import { notificationService } from '../../services/NotificationService';
import { NotificationType, NotificationStatus } from '../../types';

describe('NotificationService', () => {
  const testUserId = 'test-user-123';
  const testAuctionId = 'auction-456';

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const notification = await notificationService.createNotification(
        testUserId,
        NotificationType.BID_PLACED,
        'Test Notification',
        'This is a test notification'
      );

      expect(notification).toBeDefined();
      expect(notification.id).toBeDefined();
      expect(notification.userId).toBe(testUserId);
      expect(notification.type).toBe(NotificationType.BID_PLACED);
      expect(notification.status).toBe(NotificationStatus.UNREAD);
      expect(notification.createdAt).toBeInstanceOf(Date);
    });

    it('should create notification with metadata', async () => {
      const metadata = { auctionId: testAuctionId, amount: 100 };
      const notification = await notificationService.createNotification(
        testUserId,
        NotificationType.BID_PLACED,
        'Test',
        'Test message',
        metadata
      );

      expect(notification.metadata).toEqual(metadata);
    });
  });

  describe('getUserNotifications', () => {
    it('should get all notifications for a user', async () => {
      await notificationService.createNotification(
        testUserId,
        NotificationType.BID_PLACED,
        'Test 1',
        'Message 1'
      );
      await notificationService.createNotification(
        testUserId,
        NotificationType.BID_WON,
        'Test 2',
        'Message 2'
      );

      const notifications = await notificationService.getUserNotifications(testUserId);

      expect(notifications.length).toBeGreaterThanOrEqual(2);
      expect(notifications[0].userId).toBe(testUserId);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notification = await notificationService.createNotification(
        testUserId,
        NotificationType.BID_PLACED,
        'Test',
        'Message'
      );

      const updated = await notificationService.markAsRead(notification.id, testUserId);

      expect(updated).toBeDefined();
      expect(updated?.status).toBe(NotificationStatus.READ);
      expect(updated?.readAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent notification', async () => {
      const result = await notificationService.markAsRead('non-existent-id', testUserId);
      expect(result).toBeNull();
    });
  });

  describe('getUnreadCount', () => {
    it('should count unread notifications', async () => {
      const initialCount = await notificationService.getUnreadCount(testUserId);

      await notificationService.createNotification(
        testUserId,
        NotificationType.BID_PLACED,
        'Test',
        'Message'
      );

      const newCount = await notificationService.getUnreadCount(testUserId);
      expect(newCount).toBeGreaterThan(initialCount);
    });
  });

  describe('bid notifications', () => {
    it('should notify bid placed', async () => {
      const sellerId = 'seller-123';
      await notificationService.notifyBidPlaced(testAuctionId, testUserId, sellerId, 100);

      const notifications = await notificationService.getUserNotifications(sellerId);
      const bidNotification = notifications.find(n => n.type === NotificationType.BID_PLACED);

      expect(bidNotification).toBeDefined();
      expect(bidNotification?.metadata?.auctionId).toBe(testAuctionId);
    });

    it('should notify bid won', async () => {
      await notificationService.notifyBidWon(testAuctionId, testUserId, 100);

      const notifications = await notificationService.getUserNotifications(testUserId);
      const wonNotification = notifications.find(n => n.type === NotificationType.BID_WON);

      expect(wonNotification).toBeDefined();
    });
  });

  describe('delivery notifications', () => {
    it('should notify delivery code generated', async () => {
      const code = '123456';
      await notificationService.notifyDeliveryCode(testAuctionId, testUserId, code);

      const notifications = await notificationService.getUserNotifications(testUserId);
      const codeNotification = notifications.find(
        n => n.type === NotificationType.DELIVERY_CODE_GENERATED
      );

      expect(codeNotification).toBeDefined();
      expect(codeNotification?.message).toContain(code);
    });
  });

  describe('security notifications', () => {
    it('should notify security alert', async () => {
      await notificationService.notifySecurityAlert(
        testUserId,
        'Test security alert',
        { reason: 'test' }
      );

      const notifications = await notificationService.getUserNotifications(testUserId);
      const alertNotification = notifications.find(
        n => n.type === NotificationType.SECURITY_ALERT
      );

      expect(alertNotification).toBeDefined();
    });

    it('should notify rate limit warning', async () => {
      await notificationService.notifyRateLimitWarning(testUserId, 'bidding');

      const notifications = await notificationService.getUserNotifications(testUserId);
      const warningNotification = notifications.find(
        n => n.type === NotificationType.RATE_LIMIT_WARNING
      );

      expect(warningNotification).toBeDefined();
    });
  });
});
