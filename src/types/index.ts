// Core type definitions for AuctionMe

export enum NotificationType {
  BID_PLACED = 'BID_PLACED',
  BID_WON = 'BID_WON',
  BID_OUTBID = 'BID_OUTBID',
  AUCTION_ENDING_SOON = 'AUCTION_ENDING_SOON',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  DELIVERY_CODE_GENERATED = 'DELIVERY_CODE_GENERATED',
  ITEM_DELIVERED = 'ITEM_DELIVERED',
  SECURITY_ALERT = 'SECURITY_ALERT',
  RATE_LIMIT_WARNING = 'RATE_LIMIT_WARNING',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
}

export enum AuditAction {
  BID_PLACED = 'BID_PLACED',
  PAYMENT_MADE = 'PAYMENT_MADE',
  DELIVERY_CODE_VERIFIED = 'DELIVERY_CODE_VERIFIED',
  DELIVERY_CODE_FAILED = 'DELIVERY_CODE_FAILED',
  RATE_LIMIT_HIT = 'RATE_LIMIT_HIT',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  NOTIFICATION_SENT = 'NOTIFICATION_SENT',
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

export interface RateLimitRecord {
  id: string;
  userId: string;
  action: string;
  count: number;
  windowStart: Date;
  windowEnd: Date;
}

export interface DeliveryCode {
  id: string;
  auctionId: string;
  buyerId: string;
  sellerId: string;
  code: string;
  failedAttempts: number;
  isUsed: boolean;
  isLocked: boolean;
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date;
}

export interface BidValidation {
  isValid: boolean;
  reason?: string;
  riskScore: number;
  flags: string[];
}

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}
