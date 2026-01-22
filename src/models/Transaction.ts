import mongoose, { Schema, Document } from 'mongoose';
import { TransactionStatus, TransactionType, PaymentMethod } from '../types';

export interface ITransaction extends Document {
  transactionId: string;
  auctionId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  type: TransactionType;
  paymentReference?: string;
  providerReference?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
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
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      default: TransactionType.PAYMENT
    },
    paymentReference: {
      type: String,
      index: true
    },
    providerReference: {
      type: String,
      index: true
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ITransaction>('Transaction', transactionSchema);
