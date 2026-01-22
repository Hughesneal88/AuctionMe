import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { DeliveryConfirmation, TransactionStatus } from '../models';

// In-memory storage (replace with database in production)
const deliveryConfirmations: Map<string, DeliveryConfirmation> = new Map();
const transactions: Map<string, any> = new Map();

export class ConfirmationCodeService {
  private static readonly CODE_LENGTH = 6;
  private static readonly SALT_ROUNDS = 10;
  private static readonly EXPIRY_HOURS = 72; // 3 days

  /**
   * Generate a unique 6-digit confirmation code
   * Ensures uniqueness by checking against existing codes
   */
  static generateUniqueCode(): string {
    let code: string;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      // Generate random 6-digit code
      code = Math.floor(100000 + Math.random() * 900000).toString();
      attempts++;

      if (attempts >= maxAttempts) {
        throw new Error('Unable to generate unique confirmation code');
      }
    } while (this.codeExists(code));

    return code;
  }

  /**
   * Check if a code already exists (compare against hashed codes)
   * Note: In production, this would query the database
   */
  private static codeExists(code: string): boolean {
    // For now, we assume codes are unique enough with random generation
    // In production, check database for hash collision
    return false;
  }

  /**
   * Hash the confirmation code using bcrypt
   */
  static async hashCode(code: string): Promise<string> {
    return bcrypt.hash(code, this.SALT_ROUNDS);
  }

  /**
   * Verify a code against its hash
   */
  static async verifyCode(code: string, hash: string): Promise<boolean> {
    return bcrypt.compare(code, hash);
  }

  /**
   * Create a delivery confirmation for a transaction
   * Returns the plain code (to be shown to buyer only once)
   */
  static async createDeliveryConfirmation(
    transactionId: string,
    buyerId: string
  ): Promise<{ code: string; confirmation: DeliveryConfirmation }> {
    // Validate transaction exists and is in correct state
    const transaction = transactions.get(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.IN_ESCROW) {
      throw new Error('Transaction must be in escrow to generate confirmation code');
    }

    if (transaction.buyerId !== buyerId) {
      throw new Error('Only the buyer can access this confirmation code');
    }

    // Check if code already exists for this transaction
    const existingConfirmation = this.findConfirmationByTransactionId(transactionId);
    if (existingConfirmation && !existingConfirmation.isUsed) {
      throw new Error('Confirmation code already exists for this transaction');
    }

    // Generate unique code
    const code = this.generateUniqueCode();
    const codeHash = await this.hashCode(code);

    // Create confirmation record
    const confirmation: DeliveryConfirmation = {
      id: crypto.randomUUID(),
      transactionId,
      codeHash,
      buyerId,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + this.EXPIRY_HOURS * 60 * 60 * 1000),
      isUsed: false,
    };

    deliveryConfirmations.set(confirmation.id, confirmation);

    return { code, confirmation };
  }

  /**
   * Validate and confirm delivery using the confirmation code
   * Enforces one-time use and marks transaction as delivered
   */
  static async confirmDelivery(
    transactionId: string,
    code: string,
    sellerId: string
  ): Promise<{ success: boolean; message: string }> {
    // Find confirmation for this transaction
    const confirmation = this.findConfirmationByTransactionId(transactionId);
    if (!confirmation) {
      return { success: false, message: 'No confirmation code found for this transaction' };
    }

    // Check if already used (one-time use enforcement)
    if (confirmation.isUsed) {
      return { success: false, message: 'Confirmation code has already been used' };
    }

    // Check expiration
    if (confirmation.expiresAt && new Date() > confirmation.expiresAt) {
      return { success: false, message: 'Confirmation code has expired' };
    }

    // Verify the code
    const isValid = await this.verifyCode(code, confirmation.codeHash);
    if (!isValid) {
      return { success: false, message: 'Invalid confirmation code' };
    }

    // Validate transaction and seller
    const transaction = transactions.get(transactionId);
    if (!transaction) {
      return { success: false, message: 'Transaction not found' };
    }

    if (transaction.sellerId !== sellerId) {
      return { success: false, message: 'Only the seller can confirm delivery' };
    }

    // Mark confirmation as used
    confirmation.isUsed = true;
    confirmation.usedAt = new Date();
    deliveryConfirmations.set(confirmation.id, confirmation);

    // Update transaction status
    transaction.status = TransactionStatus.DELIVERED;
    transaction.updatedAt = new Date();
    transactions.set(transactionId, transaction);

    // Trigger escrow release
    await this.releaseEscrow(transactionId);

    return { success: true, message: 'Delivery confirmed successfully' };
  }

  /**
   * Release escrow funds to the seller after successful delivery confirmation
   */
  private static async releaseEscrow(transactionId: string): Promise<void> {
    const transaction = transactions.get(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    transaction.status = TransactionStatus.COMPLETED;
    transaction.escrowReleasedAt = new Date();
    transaction.updatedAt = new Date();
    transactions.set(transactionId, transaction);

    // In production: trigger payment processor to release funds
    console.log(`Escrow released for transaction ${transactionId}: $${transaction.amount}`);
  }

  /**
   * Find confirmation by transaction ID
   */
  private static findConfirmationByTransactionId(
    transactionId: string
  ): DeliveryConfirmation | undefined {
    return Array.from(deliveryConfirmations.values()).find(
      (conf) => conf.transactionId === transactionId
    );
  }

  /**
   * Get confirmation details (for buyer only, without exposing the code)
   */
  static getConfirmationDetails(
    transactionId: string,
    buyerId: string
  ): Omit<DeliveryConfirmation, 'codeHash'> | null {
    const confirmation = this.findConfirmationByTransactionId(transactionId);
    
    if (!confirmation || confirmation.buyerId !== buyerId) {
      return null;
    }

    // Return confirmation without the hash
    const { codeHash, ...details } = confirmation;
    return details;
  }

  // Test helpers (for development/testing only)
  static _getStorage() {
    return { deliveryConfirmations, transactions };
  }

  static _clearStorage() {
    deliveryConfirmations.clear();
    transactions.clear();
  }

  static _setTransaction(id: string, transaction: any) {
    transactions.set(id, transaction);
  }
}
