import { Router } from 'express';
import { notificationController } from '../controllers/NotificationController';
import { RateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Notification routes
 * All routes require authentication (handled by auth middleware in production)
 */

// Get all notifications for the authenticated user
router.get(
  '/',
  RateLimiter.notification,
  notificationController.getNotifications.bind(notificationController)
);

// Get unread count
router.get(
  '/unread-count',
  RateLimiter.notification,
  notificationController.getUnreadCount.bind(notificationController)
);

// Mark specific notification as read
router.patch(
  '/:notificationId/read',
  notificationController.markAsRead.bind(notificationController)
);

// Mark all notifications as read
router.post(
  '/mark-all-read',
  notificationController.markAllAsRead.bind(notificationController)
);

// Delete a notification
router.delete(
  '/:notificationId',
  notificationController.deleteNotification.bind(notificationController)
);

// Create test notification (for development)
router.post(
  '/test',
  notificationController.createTestNotification.bind(notificationController)
);

export const notificationRoutes = router;
