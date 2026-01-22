import { EscrowModel } from '../models/Escrow';
import { TransactionModel } from '../models/Transaction';
import { Escrow, CreateEscrowRequest, EscrowStatus, Transaction } from '../types';

/**
 * Escrow Service
 * Manages escrow lifecycle: creation, locking, verification, and release
 */
export class EscrowService {
  /**
   * Create escrow after successful payment
   * Funds are locked immediately
   */
  async createEscrow(data: CreateEscrowRequest): Promise<Escrow> {
    // Verify transaction exists and is completed
    const transaction = await TransactionModel.findById(data.transaction_id);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'completed') {
      throw new Error('Cannot create escrow for incomplete transaction');
    }

    // Check if escrow already exists for this transaction
    const existingEscrow = await EscrowModel.findByTransactionId(data.transaction_id);
    if (existingEscrow) {
      return existingEscrow;
    }

    // Create escrow with funds locked
    const escrow = await EscrowModel.create(data);
    
    console.log('Escrow created:', {
      escrow_id: escrow.id,
      amount: escrow.amount,
      status: escrow.status,
      delivery_code: escrow.delivery_code,
    });

    return escrow;
  }

  /**
   * Get escrow by ID
   */
  async getEscrow(escrowId: number): Promise<Escrow> {
    const escrow = await EscrowModel.findById(escrowId);
    
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    return escrow;
  }

  /**
   * Get escrow by auction ID
   */
  async getEscrowByAuction(auctionId: number): Promise<Escrow> {
    const escrow = await EscrowModel.findByAuctionId(auctionId);
    
    if (!escrow) {
      throw new Error('Escrow not found for this auction');
    }

    return escrow;
  }

  /**
   * Release escrow with delivery code verification
   * This is called when the buyer confirms delivery
   */
  async releaseEscrow(escrowId: number, deliveryCode: string): Promise<Escrow> {
    const escrow = await EscrowModel.findById(escrowId);
    
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    // Prevent release if not in valid state
    if (escrow.status === 'released') {
      throw new Error('Escrow already released');
    }

    if (escrow.status === 'refunded') {
      throw new Error('Escrow already refunded');
    }

    // Verify delivery code and release
    const releasedEscrow = await EscrowModel.releaseWithDeliveryCode(escrowId, deliveryCode);
    
    console.log('Escrow released:', {
      escrow_id: releasedEscrow.id,
      amount: releasedEscrow.amount,
      seller_id: releasedEscrow.seller_id,
      released_at: releasedEscrow.released_at,
    });

    return releasedEscrow;
  }

  /**
   * Verify delivery without releasing (intermediate step)
   */
  async verifyDelivery(escrowId: number, deliveryCode: string): Promise<Escrow> {
    const escrow = await EscrowModel.findByDeliveryCode(deliveryCode);
    
    if (!escrow || escrow.id !== escrowId) {
      throw new Error('Invalid escrow ID or delivery code');
    }

    if (escrow.status !== 'held') {
      throw new Error(`Cannot verify escrow with status: ${escrow.status}`);
    }

    // Update to verified status (not yet released)
    const verifiedEscrow = await EscrowModel.updateStatus(escrowId, 'verified');
    
    console.log('Delivery verified:', {
      escrow_id: verifiedEscrow.id,
      delivery_code: deliveryCode,
    });

    return verifiedEscrow;
  }

  /**
   * Refund escrow (in case of disputes or cancellations)
   */
  async refundEscrow(escrowId: number, reason?: string): Promise<Escrow> {
    const escrow = await EscrowModel.findById(escrowId);
    
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.status === 'released') {
      throw new Error('Cannot refund released escrow');
    }

    if (escrow.status === 'refunded') {
      throw new Error('Escrow already refunded');
    }

    // Update to refunded status
    const refundedEscrow = await EscrowModel.updateStatus(escrowId, 'refunded');
    
    console.log('Escrow refunded:', {
      escrow_id: refundedEscrow.id,
      amount: refundedEscrow.amount,
      buyer_id: refundedEscrow.buyer_id,
      reason,
    });

    return refundedEscrow;
  }

  /**
   * Mark escrow as disputed
   */
  async disputeEscrow(escrowId: number, reason: string): Promise<Escrow> {
    const escrow = await EscrowModel.findById(escrowId);
    
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.status !== 'held' && escrow.status !== 'verified') {
      throw new Error(`Cannot dispute escrow with status: ${escrow.status}`);
    }

    // Update to disputed status
    const disputedEscrow = await EscrowModel.updateStatus(escrowId, 'disputed');
    
    console.log('Escrow disputed:', {
      escrow_id: disputedEscrow.id,
      reason,
    });

    return disputedEscrow;
  }

  /**
   * Check if withdrawal is allowed
   * Returns false if funds are locked in escrow
   */
  async canWithdraw(sellerId: number, amount: number): Promise<boolean> {
    const heldEscrows = await EscrowModel.findAllHeld();
    
    // Calculate total locked funds for this seller
    const lockedAmount = heldEscrows
      .filter(e => e.seller_id === sellerId)
      .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

    // In production, check seller's available balance
    // For now, just check if there are any locked funds
    return lockedAmount === 0 || amount <= 0;
  }

  /**
   * Get all held escrows (admin function)
   */
  async getAllHeldEscrows(): Promise<Escrow[]> {
    return EscrowModel.findAllHeld();
  }
}
