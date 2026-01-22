import Escrow, { IEscrow } from '../models/Escrow';
import Dispute from '../models/Dispute';
import { EscrowStatus, AuditAction } from '../types/enums';
import auditLogService from './auditLogService';
import mongoose from 'mongoose';

class EscrowService {
  /**
   * Lock escrow during a dispute
   */
  async lockEscrow(
    escrowId: mongoose.Types.ObjectId,
    disputeId: mongoose.Types.ObjectId,
    performedBy: mongoose.Types.ObjectId
  ): Promise<IEscrow> {
    const escrow = await Escrow.findById(escrowId);

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.status !== EscrowStatus.HELD) {
      throw new Error('Escrow must be in HELD status to lock');
    }

    escrow.lockedForDispute = true;
    escrow.disputeId = disputeId;
    escrow.status = EscrowStatus.LOCKED;
    await escrow.save();

    // Create audit log
    await auditLogService.createLog({
      action: AuditAction.ESCROW_LOCKED,
      performedBy,
      targetResource: {
        type: 'Escrow',
        id: escrow._id
      },
      details: {
        disputeId: disputeId.toString(),
        amount: escrow.amount
      }
    });

    return escrow;
  }

  /**
   * Release escrow to seller (admin action)
   */
  async releaseEscrow(
    escrowId: mongoose.Types.ObjectId,
    performedBy: mongoose.Types.ObjectId,
    note?: string
  ): Promise<IEscrow> {
    const escrow = await Escrow.findById(escrowId).populate('sellerId buyerId');

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.status === EscrowStatus.RELEASED) {
      throw new Error('Escrow already released');
    }

    if (escrow.status === EscrowStatus.REFUNDED) {
      throw new Error('Escrow already refunded');
    }

    escrow.status = EscrowStatus.RELEASED;
    escrow.releasedAt = new Date();
    escrow.lockedForDispute = false;
    await escrow.save();

    // Create audit log
    await auditLogService.createLog({
      action: AuditAction.ESCROW_RELEASED,
      performedBy,
      targetResource: {
        type: 'Escrow',
        id: escrow._id
      },
      details: {
        amount: escrow.amount,
        sellerId: escrow.sellerId,
        note
      }
    });

    return escrow;
  }

  /**
   * Refund escrow to buyer (admin action)
   */
  async refundEscrow(
    escrowId: mongoose.Types.ObjectId,
    performedBy: mongoose.Types.ObjectId,
    note?: string
  ): Promise<IEscrow> {
    const escrow = await Escrow.findById(escrowId).populate('sellerId buyerId');

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.status === EscrowStatus.RELEASED) {
      throw new Error('Escrow already released');
    }

    if (escrow.status === EscrowStatus.REFUNDED) {
      throw new Error('Escrow already refunded');
    }

    escrow.status = EscrowStatus.REFUNDED;
    escrow.refundedAt = new Date();
    escrow.lockedForDispute = false;
    await escrow.save();

    // Create audit log
    await auditLogService.createLog({
      action: AuditAction.ESCROW_REFUNDED,
      performedBy,
      targetResource: {
        type: 'Escrow',
        id: escrow._id
      },
      details: {
        amount: escrow.amount,
        buyerId: escrow.buyerId,
        note
      }
    });

    return escrow;
  }

  /**
   * Get escrow by auction ID
   */
  async getEscrowByAuction(auctionId: mongoose.Types.ObjectId): Promise<IEscrow | null> {
    return Escrow.findOne({ auctionId })
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email');
  }

  /**
   * Check if escrow is locked for dispute
   */
  async isEscrowLocked(escrowId: mongoose.Types.ObjectId): Promise<boolean> {
    const escrow = await Escrow.findById(escrowId);
    return escrow?.lockedForDispute || false;
  }
}

export default new EscrowService();
