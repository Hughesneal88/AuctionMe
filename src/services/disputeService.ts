import Dispute, { IDispute } from '../models/Dispute';
import Escrow from '../models/Escrow';
import Auction from '../models/Auction';
import { DisputeStatus, DisputeReason, DisputeResolution, AuditAction, IDisputeEvidence } from '../types/enums';
import { config } from '../config';
import auditLogService from './auditLogService';
import escrowService from './escrowService';
import mongoose from 'mongoose';

export interface CreateDisputeParams {
  auctionId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  reason: DisputeReason;
  description: string;
  evidence?: IDisputeEvidence[];
}

export interface ResolveDisputeParams {
  disputeId: mongoose.Types.ObjectId;
  resolution: DisputeResolution;
  resolutionNote: string;
  reviewedBy: mongoose.Types.ObjectId;
}

class DisputeService {
  /**
   * Create a new dispute
   */
  async createDispute(params: CreateDisputeParams): Promise<IDispute> {
    // Find the auction
    const auction = await Auction.findById(params.auctionId);
    if (!auction) {
      throw new Error('Auction not found');
    }

    // Verify buyer is the winner
    if (!auction.winnerId || auction.winnerId.toString() !== params.buyerId.toString()) {
      throw new Error('Only the auction winner can create a dispute');
    }

    // Find the escrow
    const escrow = await Escrow.findOne({ auctionId: params.auctionId });
    if (!escrow) {
      throw new Error('Escrow not found for this auction');
    }

    // Check if escrow is already locked
    if (escrow.lockedForDispute) {
      throw new Error('A dispute already exists for this auction');
    }

    // Check if dispute is within time limit
    const disputeDeadline = new Date();
    disputeDeadline.setDate(disputeDeadline.getDate() + config.disputeTimeLimitDays);

    // Calculate time limit for dispute
    const timeLimit = new Date();
    timeLimit.setDate(timeLimit.getDate() + config.disputeTimeLimitDays);

    // Create the dispute
    const dispute = new Dispute({
      auctionId: params.auctionId,
      escrowId: escrow._id,
      buyerId: params.buyerId,
      sellerId: auction.sellerId,
      reason: params.reason,
      description: params.description,
      evidence: params.evidence || [],
      status: DisputeStatus.OPEN,
      timeLimit
    });

    await dispute.save();

    // Lock the escrow
    await escrowService.lockEscrow(escrow._id, dispute._id, params.buyerId);

    // Create audit log
    await auditLogService.createLog({
      action: AuditAction.DISPUTE_CREATED,
      performedBy: params.buyerId,
      targetResource: {
        type: 'Dispute',
        id: dispute._id
      },
      details: {
        auctionId: params.auctionId.toString(),
        reason: params.reason,
        description: params.description
      }
    });

    return dispute;
  }

  /**
   * Get disputes with filtering
   */
  async getDisputes(filters: {
    status?: DisputeStatus;
    buyerId?: mongoose.Types.ObjectId;
    sellerId?: mongoose.Types.ObjectId;
    page?: number;
    limit?: number;
  }): Promise<{ disputes: IDispute[]; total: number }> {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.buyerId) {
      query.buyerId = filters.buyerId;
    }

    if (filters.sellerId) {
      query.sellerId = filters.sellerId;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [disputes, total] = await Promise.all([
      Dispute.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('buyerId', 'name email')
        .populate('sellerId', 'name email')
        .populate('auctionId', 'title')
        .populate('reviewedBy', 'name email'),
      Dispute.countDocuments(query)
    ]);

    return { disputes, total };
  }

  /**
   * Get a single dispute by ID
   */
  async getDisputeById(disputeId: mongoose.Types.ObjectId): Promise<IDispute | null> {
    return Dispute.findById(disputeId)
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email')
      .populate('auctionId', 'title description')
      .populate('escrowId')
      .populate('reviewedBy', 'name email');
  }

  /**
   * Update dispute status to under review (admin action)
   */
  async markDisputeUnderReview(
    disputeId: mongoose.Types.ObjectId,
    adminId: mongoose.Types.ObjectId
  ): Promise<IDispute> {
    const dispute = await Dispute.findById(disputeId);

    if (!dispute) {
      throw new Error('Dispute not found');
    }

    if (dispute.status !== DisputeStatus.OPEN) {
      throw new Error('Only open disputes can be marked under review');
    }

    dispute.status = DisputeStatus.UNDER_REVIEW;
    dispute.reviewedBy = adminId;
    dispute.reviewedAt = new Date();
    await dispute.save();

    // Create audit log
    await auditLogService.createLog({
      action: AuditAction.DISPUTE_REVIEWED,
      performedBy: adminId,
      targetResource: {
        type: 'Dispute',
        id: dispute._id
      },
      details: {
        previousStatus: DisputeStatus.OPEN,
        newStatus: DisputeStatus.UNDER_REVIEW
      }
    });

    return dispute;
  }

  /**
   * Resolve a dispute (admin action)
   */
  async resolveDispute(params: ResolveDisputeParams): Promise<IDispute> {
    const dispute = await Dispute.findById(params.disputeId).populate('escrowId');

    if (!dispute) {
      throw new Error('Dispute not found');
    }

    if (dispute.status === DisputeStatus.RESOLVED) {
      throw new Error('Dispute already resolved');
    }

    // Update dispute
    dispute.status = DisputeStatus.RESOLVED;
    dispute.resolution = params.resolution;
    dispute.resolutionNote = params.resolutionNote;
    dispute.reviewedBy = params.reviewedBy;
    dispute.resolvedAt = new Date();
    await dispute.save();

    // Handle escrow based on resolution
    if (params.resolution === DisputeResolution.REFUND_BUYER) {
      await escrowService.refundEscrow(
        dispute.escrowId,
        params.reviewedBy,
        `Dispute resolved: ${params.resolutionNote}`
      );
    } else if (params.resolution === DisputeResolution.RELEASE_TO_SELLER) {
      await escrowService.releaseEscrow(
        dispute.escrowId,
        params.reviewedBy,
        `Dispute resolved: ${params.resolutionNote}`
      );
    }

    // Create audit log
    await auditLogService.createLog({
      action: AuditAction.DISPUTE_RESOLVED,
      performedBy: params.reviewedBy,
      targetResource: {
        type: 'Dispute',
        id: dispute._id
      },
      details: {
        resolution: params.resolution,
        resolutionNote: params.resolutionNote,
        escrowId: dispute.escrowId.toString()
      }
    });

    return dispute;
  }

  /**
   * Add evidence to a dispute
   */
  async addEvidence(
    disputeId: mongoose.Types.ObjectId,
    buyerId: mongoose.Types.ObjectId,
    evidence: IDisputeEvidence
  ): Promise<IDispute> {
    const dispute = await Dispute.findById(disputeId);

    if (!dispute) {
      throw new Error('Dispute not found');
    }

    // Verify the buyer owns this dispute
    if (dispute.buyerId.toString() !== buyerId.toString()) {
      throw new Error('Only the dispute creator can add evidence');
    }

    if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.REJECTED) {
      throw new Error('Cannot add evidence to a resolved or rejected dispute');
    }

    dispute.evidence.push(evidence);
    await dispute.save();

    return dispute;
  }

  /**
   * Check if disputes are within time limit
   */
  async checkDisputeTimeLimit(disputeId: mongoose.Types.ObjectId): Promise<boolean> {
    const dispute = await Dispute.findById(disputeId);
    
    if (!dispute) {
      return false;
    }

    return new Date() <= dispute.timeLimit;
  }
}

export default new DisputeService();
