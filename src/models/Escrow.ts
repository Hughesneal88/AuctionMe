import mongoose, { Schema, Document } from 'mongoose';
import { EscrowStatus } from '../types/enums';

export interface IEscrow extends Document {
  auctionId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  amount: number;
  status: EscrowStatus;
  lockedForDispute: boolean;
  disputeId?: mongoose.Types.ObjectId;
  releaseDate?: Date;
  releasedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EscrowSchema: Schema = new Schema(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: 'Auction',
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
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: Object.values(EscrowStatus),
      default: EscrowStatus.HELD
    },
    lockedForDispute: {
      type: Boolean,
      default: false
    },
    disputeId: {
      type: Schema.Types.ObjectId,
      ref: 'Dispute'
    },
    releaseDate: {
      type: Date
    },
    releasedAt: {
      type: Date
    },
    refundedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Ensure only one escrow per auction
EscrowSchema.index({ auctionId: 1 }, { unique: true });

export default mongoose.model<IEscrow>('Escrow', EscrowSchema);
