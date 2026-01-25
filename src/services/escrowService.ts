import Escrow, { IEscrow } from '../models/Escrow';
import Transaction, { ITransaction } from '../models/Transaction';
import { EscrowStatus, TransactionStatus } from '../types';
import {
  generateEscrowId,
  generateDeliveryCode,
  hashDeliveryCode,
  compareDeliveryCode,
  encryptDeliveryCode,
  decryptDeliveryCode
} from '../utils/helpers';
import paymentService from './paymentService';

/**
 * Service for managing escrow operations
 */
class EscrowService {
  /**
   * Create escrow after successful payment
   */
  async createEscrow(
    transactionId: string,
    auctionId: string,
    buyerId: string,
    sellerId: string,
    amount: number,
    currency: string = 'USD'
  ): Promise<{ escrow: IEscrow; deliveryCode: string }> {
    try {
      // Verify transaction exists and is completed
      const transaction = await Transaction.findOne({ transactionId });
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      if (transaction.status !== TransactionStatus.COMPLETED) {
        throw new Error('Transaction is not completed');
      }

      // Generate unique escrow ID and delivery code
      const escrowId = generateEscrowId();
      const deliveryCode = generateDeliveryCode();
      const hashedCode = hashDeliveryCode(deliveryCode);
      
      // Encrypt delivery code for buyer retrieval
      // Use environment variable or a secure key
      const encryptionSecret = process.env.DELIVERY_CODE_SECRET || 'default-secret-key-change-in-production';
      const encryptedCode = encryptDeliveryCode(deliveryCode, encryptionSecret);

      // Create escrow record
      const escrow = new Escrow({
        escrowId,
        transactionId,
        auctionId,
        buyerId,
        sellerId,
        amount,
        currency,
        status: EscrowStatus.LOCKED,
        deliveryCode: hashedCode,
        deliveryCodeEncrypted: encryptedCode,
        lockedAt: new Date()
      });

      await escrow.save();

      console.log(`Escrow created: ${escrowId}`);
      
      // Return both escrow and the plain delivery code
      // The caller should send this to the buyer via notification service
      // IMPORTANT: Do NOT log the delivery code in production
      return { escrow, deliveryCode };
    } catch (error: any) {
      console.error('Error creating escrow:', error.message);
      throw error;
    }
  }

  /**
   * Get escrow status
   */
  async getEscrowStatus(escrowId: string): Promise<IEscrow | null> {
    return await Escrow.findOne({ escrowId });
  }

  /**
   * Get escrow by transaction ID
   */
  async getEscrowByTransaction(transactionId: string): Promise<IEscrow | null> {
    return await Escrow.findOne({ transactionId });
  }

  /**
   * Confirm delivery with code provided by buyer
   * @param autoRelease - If true, automatically releases funds after confirmation
   */
  async confirmDelivery(
    escrowId: string,
    deliveryCode: string,
    confirmedBy: string,
    autoRelease: boolean = true
  ): Promise<IEscrow> {
    try {
      const escrow = await Escrow.findOne({ escrowId });
      
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status !== EscrowStatus.LOCKED) {
        throw new Error('Escrow is not in locked state');
      }

      // Verify delivery code
      const isValidCode = compareDeliveryCode(deliveryCode, escrow.deliveryCode);
      if (!isValidCode) {
        throw new Error('Invalid delivery code');
      }

      // Update escrow status and clear encrypted code (one-time use)
      escrow.status = autoRelease ? EscrowStatus.RELEASED : EscrowStatus.PENDING_CONFIRMATION;
      escrow.confirmedAt = new Date();
      escrow.deliveryConfirmedBy = confirmedBy;
      escrow.deliveryCodeEncrypted = undefined; // Clear encrypted code after use
      
      if (autoRelease) {
        escrow.releasedAt = new Date();
      }
      
      await escrow.save();

      console.log(`Delivery confirmed for escrow: ${escrowId}${autoRelease ? ' and funds released' : ''}`);
      return escrow;
    } catch (error: any) {
      console.error('Error confirming delivery:', error.message);
      throw error;
    }
  }

  /**
   * Release funds to seller after confirmation
   */
  async releaseFunds(escrowId: string): Promise<IEscrow> {
    try {
      const escrow = await Escrow.findOne({ escrowId });
      
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status !== EscrowStatus.PENDING_CONFIRMATION) {
        throw new Error('Delivery must be confirmed before releasing funds');
      }

      // In production, this would trigger actual fund transfer to seller
      // For now, we'll just update the status
      escrow.status = EscrowStatus.RELEASED;
      escrow.releasedAt = new Date();
      await escrow.save();

      console.log(`Funds released for escrow: ${escrowId} to seller: ${escrow.sellerId}`);
      return escrow;
    } catch (error: any) {
      console.error('Error releasing funds:', error.message);
      throw error;
    }
  }

  /**
   * Refund to buyer (in case of dispute or cancellation)
   */
  async refundEscrow(escrowId: string, reason: string): Promise<IEscrow> {
    try {
      const escrow = await Escrow.findOne({ escrowId });
      
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status === EscrowStatus.RELEASED) {
        throw new Error('Cannot refund - funds already released');
      }

      // Get the original transaction
      const transaction = await Transaction.findOne({ transactionId: escrow.transactionId });
      if (!transaction) {
        throw new Error('Original transaction not found');
      }

      // Process refund through payment service
      if (transaction.providerReference) {
        await paymentService.processRefund(
          transaction.providerReference,
          escrow.amount,
          reason
        );
      }

      // Update escrow status
      escrow.status = EscrowStatus.REFUNDED;
      escrow.refundedAt = new Date();
      escrow.notes = reason;
      await escrow.save();

      console.log(`Refund processed for escrow: ${escrowId}`);
      return escrow;
    } catch (error: any) {
      console.error('Error processing refund:', error.message);
      throw error;
    }
  }

  /**
   * Prevent unauthorized withdrawals
   */
  async canWithdraw(sellerId: string, amount: number): Promise<boolean> {
    // Check for any locked escrows for this seller
    const lockedEscrows = await Escrow.find({
      sellerId,
      status: { $in: [EscrowStatus.LOCKED, EscrowStatus.PENDING_CONFIRMATION] }
    });

    const totalLocked = lockedEscrows.reduce((sum, escrow) => sum + escrow.amount, 0);
    
    // In production, you'd also check the seller's available balance
    // For now, we'll just check if there are any locked funds
    return totalLocked === 0;
  }

  /**
   * Get seller's available balance (funds not in escrow)
   */
  async getAvailableBalance(sellerId: string): Promise<number> {
    const releasedEscrows = await Escrow.find({
      sellerId,
      status: EscrowStatus.RELEASED
    });

    return releasedEscrows.reduce((sum, escrow) => sum + escrow.amount, 0);
  }

  /**
   * Get escrows for a buyer (for buyer to view their delivery codes)
   * Note: Returns escrow info but NOT the delivery code hash
   */
  async getEscrowsByBuyer(buyerId: string): Promise<IEscrow[]> {
    return await Escrow.find({ buyerId }).sort({ createdAt: -1 });
  }

  /**
   * Get delivery code for buyer (decrypted)
   * Only works if escrow is in LOCKED status and buyer is authorized
   */
  async getDeliveryCodeForBuyer(escrowId: string, buyerId: string): Promise<string> {
    try {
      const escrow = await Escrow.findOne({ escrowId });
      
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      // Verify buyer authorization
      if (escrow.buyerId !== buyerId) {
        throw new Error('Unauthorized: You are not the buyer for this escrow');
      }

      // Only allow retrieval for LOCKED escrows
      if (escrow.status !== EscrowStatus.LOCKED) {
        throw new Error('Delivery code is no longer available');
      }

      // Decrypt and return delivery code
      if (!escrow.deliveryCodeEncrypted) {
        throw new Error('Delivery code not available');
      }

      const encryptionSecret = process.env.DELIVERY_CODE_SECRET || 'default-secret-key-change-in-production';
      const deliveryCode = decryptDeliveryCode(escrow.deliveryCodeEncrypted, encryptionSecret);
      
      return deliveryCode;
    } catch (error: any) {
      console.error('Error retrieving delivery code:', error.message);
      throw error;
    }
  }
}

export default new EscrowService();
