import { deliveryCodeStore } from '../models/DeliveryCodeModel';
import { auditService } from './AuditService';
import { notificationService } from './NotificationService';
import { DeliveryCode } from '../types';

/**
 * Service for managing delivery codes with brute-force protection
 */
export class DeliveryCodeService {
  /**
   * Generate a delivery code for an auction
   */
  async generateCode(
    auctionId: string,
    buyerId: string,
    sellerId: string,
    expiresInHours: number = 72
  ): Promise<DeliveryCode> {
    const deliveryCode = deliveryCodeStore.create(auctionId, buyerId, sellerId, expiresInHours);

    // Log code generation
    await auditService.logDeliveryCodeGenerated(
      deliveryCode.id,
      auctionId,
      buyerId,
      sellerId
    );

    // Notify buyer with the code
    await notificationService.notifyDeliveryCode(auctionId, buyerId, deliveryCode.code);

    return deliveryCode;
  }

  /**
   * Verify a delivery code with brute-force protection
   */
  async verifyCode(
    deliveryCodeId: string,
    code: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; reason?: string; deliveryCode?: DeliveryCode }> {
    const result = deliveryCodeStore.verify(deliveryCodeId, code);

    if (!result.success) {
      // Log failed attempt
      await auditService.logDeliveryCodeFailed(
        deliveryCodeId,
        result.deliveryCode?.auctionId || 'unknown',
        userId,
        result.reason || 'Unknown error',
        ipAddress,
        userAgent
      );

      // Check if locked due to too many attempts
      if (result.deliveryCode?.isLocked) {
        await notificationService.notifySecurityAlert(
          userId,
          'Delivery code locked due to too many failed attempts',
          {
            deliveryCodeId,
            failedAttempts: result.deliveryCode.failedAttempts,
          }
        );
      }

      return result;
    }

    // Log successful verification
    await auditService.logDeliveryCodeVerified(
      deliveryCodeId,
      result.deliveryCode!.auctionId,
      userId,
      ipAddress,
      userAgent
    );

    // Notify both parties of successful delivery
    await notificationService.notifyItemDelivered(
      result.deliveryCode!.auctionId,
      result.deliveryCode!.sellerId,
      result.deliveryCode!.buyerId
    );

    return result;
  }

  /**
   * Get delivery code by auction ID
   */
  async getByAuctionId(auctionId: string): Promise<DeliveryCode | null> {
    return deliveryCodeStore.findByAuctionId(auctionId) || null;
  }

  /**
   * Get delivery code by ID
   */
  async getById(id: string): Promise<DeliveryCode | null> {
    return deliveryCodeStore.findById(id) || null;
  }

  /**
   * Check if a delivery code is valid (not expired, used, or locked)
   */
  async isValid(deliveryCodeId: string): Promise<boolean> {
    const deliveryCode = deliveryCodeStore.findById(deliveryCodeId);
    
    if (!deliveryCode) {
      return false;
    }

    if (deliveryCode.isUsed || deliveryCode.isLocked) {
      return false;
    }

    if (new Date() > deliveryCode.expiresAt) {
      return false;
    }

    return true;
  }

  /**
   * Extend expiration time for a delivery code
   */
  async extendExpiration(deliveryCodeId: string, additionalHours: number): Promise<DeliveryCode | null> {
    const deliveryCode = deliveryCodeStore.findById(deliveryCodeId);
    
    if (!deliveryCode) {
      return null;
    }

    const newExpiresAt = new Date(deliveryCode.expiresAt.getTime() + additionalHours * 60 * 60 * 1000);
    
    return deliveryCodeStore.update(deliveryCodeId, { expiresAt: newExpiresAt }) || null;
  }
}

export const deliveryCodeService = new DeliveryCodeService();
