import mongoose, { Schema, Document } from 'mongoose';
import { DisputeStatus, DisputeReason, DisputeResolution, IDisputeEvidence } from '../types/enums';

export interface IDispute extends Document {
  auctionId: mongoose.Types.ObjectId;
  escrowId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  reason: DisputeReason;
  description: string;
  evidence: IDisputeEvidence[];
  status: DisputeStatus;
  resolution?: DisputeResolution;
  resolutionNote?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  resolvedAt?: Date;
  timeLimit: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DisputeEvidenceSchema: Schema = new Schema({
  description: {
    type: String,
    required: true
  },
  imageUrls: [{
    type: String
  }],
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const DisputeSchema: Schema = new Schema(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: 'Auction',
      required: true
    },
    escrowId: {
      type: Schema.Types.ObjectId,
      ref: 'Escrow',
      required: true
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      enum: Object.values(DisputeReason),
      required: true
    },
    description: {
      type: String,
      required: true
    },
    evidence: {
      type: [DisputeEvidenceSchema],
      default: []
    },
    status: {
      type: String,
      enum: Object.values(DisputeStatus),
      default: DisputeStatus.OPEN
    },
    resolution: {
      type: String,
      enum: Object.values(DisputeResolution)
    },
    resolutionNote: {
      type: String
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    resolvedAt: {
      type: Date
    },
    timeLimit: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
DisputeSchema.index({ status: 1, createdAt: -1 });
DisputeSchema.index({ buyerId: 1 });
DisputeSchema.index({ escrowId: 1 });

export default mongoose.model<IDispute>('Dispute', DisputeSchema);
