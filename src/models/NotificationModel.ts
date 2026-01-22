import { v4 as uuidv4 } from 'uuid';
import { Notification, NotificationType, NotificationStatus } from '../types';

/**
 * In-memory storage for notifications (replace with database in production)
 */
class NotificationStore {
  private notifications: Map<string, Notification> = new Map();

  create(notification: Omit<Notification, 'id' | 'createdAt'>): Notification {
    const newNotification: Notification = {
      id: uuidv4(),
      ...notification,
      createdAt: new Date(),
    };
    this.notifications.set(newNotification.id, newNotification);
    return newNotification;
  }

  findById(id: string): Notification | undefined {
    return this.notifications.get(id);
  }

  findByUserId(userId: string): Notification[] {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  update(id: string, updates: Partial<Notification>): Notification | undefined {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;

    const updated = { ...notification, ...updates };
    this.notifications.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.notifications.delete(id);
  }

  countUnread(userId: string): number {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId && n.status === NotificationStatus.UNREAD)
      .length;
  }
}

export const notificationStore = new NotificationStore();
