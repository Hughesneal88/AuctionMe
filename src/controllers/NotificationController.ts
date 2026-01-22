import { Request, Response } from 'express';
import { notificationService } from '../services/NotificationService';
import { NotificationStatus } from '../types';

/**
 * Controller for notification endpoints
 */
export class NotificationController {
  /**
   * Get all notifications for the authenticated user
   */
  async getNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const notifications = await notificationService.getUserNotifications(userId);
      const unreadCount = await notificationService.getUnreadCount(userId);

      return res.json({
        notifications,
        unreadCount,
        total: notifications.length,
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const count = await notificationService.getUnreadCount(userId);

      return res.json({ unreadCount: count });
    } catch (error) {
      console.error('Get unread count error:', error);
      return res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const notification = await notificationService.markAsRead(notificationId, userId);

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      return res.json({ notification });
    } catch (error) {
      console.error('Mark as read error:', error);
      return res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const count = await notificationService.markAllAsRead(userId);

      return res.json({ 
        message: 'All notifications marked as read',
        count 
      });
    } catch (error) {
      console.error('Mark all as read error:', error);
      return res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const success = await notificationService.deleteNotification(notificationId, userId);

      if (!success) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      return res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Delete notification error:', error);
      return res.status(500).json({ error: 'Failed to delete notification' });
    }
  }

  /**
   * Create a test notification (for development/testing)
   */
  async createTestNotification(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { type, title, message, metadata } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const notification = await notificationService.createNotification(
        userId,
        type,
        title,
        message,
        metadata
      );

      return res.status(201).json({ notification });
    } catch (error) {
      console.error('Create test notification error:', error);
      return res.status(500).json({ error: 'Failed to create notification' });
    }
  }
}

export const notificationController = new NotificationController();
