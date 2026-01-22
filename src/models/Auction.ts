import mongoose, { Schema, Document } from 'mongoose';
import { AuctionStatus } from '../types/enums';

export interface IAuction extends Document {
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  sellerId: mongoose.Types.ObjectId;
  winnerId?: mongoose.Types.ObjectId;
  status: AuctionStatus;
  startDate: Date;
  endDate: Date;
  deliveryCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuctionSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    startingPrice: {
      type: Number,
      required: true,
      min: 0
    },
    currentPrice: {
      type: Number,
      required: true,
      min: 0
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    winnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: Object.values(AuctionStatus),
      default: AuctionStatus.ACTIVE
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    deliveryCode: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IAuction>('Auction', AuctionSchema);
