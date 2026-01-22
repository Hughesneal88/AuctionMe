import mongoose, { Schema, Document } from 'mongoose';
import { EscrowStatus } from '../types';

export interface IEscrow extends Document {
  escrowId: string;
  transactionId: string;
  auctionId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  status: EscrowStatus;
  deliveryCode: string;
  lockedAt?: Date;
  confirmedAt?: Date;
  releasedAt?: Date;
  refundedAt?: Date;
  deliveryConfirmedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const escrowSchema = new Schema<IEscrow>(
  {
    escrowId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    transactionId: {
      type: String,
      required: true,
      ref: 'Transaction',
      index: true
    },
    auctionId: {
      type: String,
      required: true,
      index: true
    },
    buyerId: {
      type: String,
      required: true,
      index: true
    },
    sellerId: {
      type: String,
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      default: 'USD'
    },
    status: {
      type: String,
      enum: Object.values(EscrowStatus),
      default: EscrowStatus.LOCKED,
      index: true
    },
    deliveryCode: {
      type: String,
      required: true,
      index: true
    },
    lockedAt: {
      type: Date
    },
    confirmedAt: {
      type: Date
    },
    releasedAt: {
      type: Date
    },
    refundedAt: {
      type: Date
    },
    deliveryConfirmedBy: {
      type: String
    },
    notes: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
escrowSchema.index({ status: 1, createdAt: -1 });
escrowSchema.index({ buyerId: 1, status: 1 });
escrowSchema.index({ sellerId: 1, status: 1 });

export default mongoose.model<IEscrow>('Escrow', escrowSchema);
