import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { DeliveryCode } from '../types';

/**
 * In-memory storage for delivery codes (replace with database in production)
 */
class DeliveryCodeStore {
  private codes: Map<string, DeliveryCode> = new Map();
  private codesByAuction: Map<string, string> = new Map();

  generateCode(): string {
    // Generate a 6-digit numeric code
    return crypto.randomInt(100000, 999999).toString();
  }

  create(auctionId: string, buyerId: string, sellerId: string, expiresInHours: number = 72): DeliveryCode {
    const code = this.generateCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000);

    const deliveryCode: DeliveryCode = {
      id: uuidv4(),
      auctionId,
      buyerId,
      sellerId,
      code,
      failedAttempts: 0,
      isUsed: false,
      isLocked: false,
      expiresAt,
      createdAt: now,
    };

    this.codes.set(deliveryCode.id, deliveryCode);
    this.codesByAuction.set(auctionId, deliveryCode.id);
    return deliveryCode;
  }

  findById(id: string): DeliveryCode | undefined {
    return this.codes.get(id);
  }

  findByAuctionId(auctionId: string): DeliveryCode | undefined {
    const id = this.codesByAuction.get(auctionId);
    return id ? this.codes.get(id) : undefined;
  }

  verify(id: string, code: string): { success: boolean; reason?: string; deliveryCode?: DeliveryCode } {
    const deliveryCode = this.codes.get(id);
    
    if (!deliveryCode) {
      return { success: false, reason: 'Code not found' };
    }

    if (deliveryCode.isLocked) {
      return { success: false, reason: 'Code is locked due to too many failed attempts' };
    }

    if (deliveryCode.isUsed) {
      return { success: false, reason: 'Code has already been used' };
    }

    if (new Date() > deliveryCode.expiresAt) {
      return { success: false, reason: 'Code has expired' };
    }

    if (deliveryCode.code !== code) {
      deliveryCode.failedAttempts++;
      
      // Lock after 5 failed attempts
      if (deliveryCode.failedAttempts >= 5) {
        deliveryCode.isLocked = true;
      }
      
      this.codes.set(id, deliveryCode);
      return { 
        success: false, 
        reason: `Invalid code. ${5 - deliveryCode.failedAttempts} attempts remaining`,
        deliveryCode 
      };
    }

    // Success - mark as used
    deliveryCode.isUsed = true;
    deliveryCode.usedAt = new Date();
    this.codes.set(id, deliveryCode);

    return { success: true, deliveryCode };
  }

  update(id: string, updates: Partial<DeliveryCode>): DeliveryCode | undefined {
    const deliveryCode = this.codes.get(id);
    if (!deliveryCode) return undefined;

    const updated = { ...deliveryCode, ...updates };
    this.codes.set(id, updated);
    return updated;
  }
}

export const deliveryCodeStore = new DeliveryCodeStore();
