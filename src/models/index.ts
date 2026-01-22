// Core domain models for the AuctionMe application

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'buyer' | 'seller';
}

export interface Auction {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  startingBid: number;
  currentBid: number;
  status: 'active' | 'closed' | 'completed';
  winnerId?: string;
  createdAt: Date;
  endsAt: Date;
}

export enum TransactionStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAYMENT_RECEIVED = 'payment_received',
  IN_ESCROW = 'in_escrow',
  AWAITING_DELIVERY = 'awaiting_delivery',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Transaction {
  id: string;
  auctionId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
  escrowReleasedAt?: Date;
}

export interface DeliveryConfirmation {
  id: string;
  transactionId: string;
  codeHash: string; // Hashed 6-digit code
  buyerId: string; // Only buyer should know the code
  generatedAt: Date;
  expiresAt?: Date;
  usedAt?: Date; // For one-time use enforcement
  isUsed: boolean;
}
