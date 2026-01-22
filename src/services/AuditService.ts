import { auditLogStore } from '../models/AuditLogModel';
import { AuditLog, AuditAction } from '../types';

/**
 * Service for audit logging
 */
export class AuditService {
  /**
   * Log an action
   */
  async log(
    action: AuditAction,
    resource: string,
    resourceId: string,
    details: Record<string, any>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'
  ): Promise<AuditLog> {
    return auditLogStore.create({
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      severity,
    });
  }

  /**
   * Log a bid placement
   */
  async logBidPlaced(
    auctionId: string,
    userId: string,
    amount: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.log(
      AuditAction.BID_PLACED,
      'auction',
      auctionId,
      { amount, userId },
      userId,
      ipAddress,
      userAgent,
      'LOW'
    );
  }

  /**
   * Log a payment
   */
  async logPayment(
    auctionId: string,
    userId: string,
    amount: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.log(
      AuditAction.PAYMENT_MADE,
      'auction',
      auctionId,
      { amount, userId },
      userId,
      ipAddress,
      userAgent,
      'MEDIUM'
    );
  }

  /**
   * Log delivery code verification
   */
  async logDeliveryCodeVerified(
    deliveryCodeId: string,
    auctionId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.log(
      AuditAction.DELIVERY_CODE_VERIFIED,
      'deliveryCode',
      deliveryCodeId,
      { auctionId, userId },
      userId,
      ipAddress,
      userAgent,
      'MEDIUM'
    );
  }

  /**
   * Log failed delivery code attempt
   */
  async logDeliveryCodeFailed(
    deliveryCodeId: string,
    auctionId: string,
    userId: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.log(
      AuditAction.DELIVERY_CODE_FAILED,
      'deliveryCode',
      deliveryCodeId,
      { auctionId, userId, reason },
      userId,
      ipAddress,
      userAgent,
      'HIGH'
    );
  }

  /**
   * Log rate limit hit
   */
  async logRateLimitHit(
    userId: string,
    action: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.log(
      AuditAction.RATE_LIMIT_HIT,
      'rateLimit',
      `${userId}:${action}`,
      { action },
      userId,
      ipAddress,
      userAgent,
      'MEDIUM'
    );
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    userId: string,
    reason: string,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.log(
      AuditAction.SUSPICIOUS_ACTIVITY,
      'security',
      userId,
      { reason, ...details },
      userId,
      ipAddress,
      userAgent,
      'CRITICAL'
    );
  }

  /**
   * Get audit logs by user
   */
  async getByUserId(userId: string): Promise<AuditLog[]> {
    return auditLogStore.findByUserId(userId);
  }

  /**
   * Get audit logs by resource
   */
  async getByResource(resource: string, resourceId: string): Promise<AuditLog[]> {
    return auditLogStore.findByResource(resource, resourceId);
  }

  /**
   * Get audit logs by action
   */
  async getByAction(action: AuditAction): Promise<AuditLog[]> {
    return auditLogStore.findByAction(action);
  }

  /**
   * Get recent audit logs
   */
  async getRecent(limit: number = 100): Promise<AuditLog[]> {
    return auditLogStore.findRecent(limit);
  }

  /**
   * Get high-severity logs
   */
  async getHighSeverityLogs(): Promise<AuditLog[]> {
    const high = auditLogStore.findBySeverity('HIGH');
    const critical = auditLogStore.findBySeverity('CRITICAL');
    return [...critical, ...high].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

export const auditService = new AuditService();
