// Type definitions for AuctionMe

export interface User {
  id: number;
  email: string;
  username: string;
  phone_number?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Auction {
  id: number;
  seller_id: number;
  title: string;
  description?: string;
  starting_price: number;
  winning_bid_amount?: number;
  winner_id?: number;
  status: 'active' | 'closed' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
  closed_at?: Date;
}

export type TransactionType = 'payment' | 'refund' | 'escrow_release';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type PaymentMethod = 'mobile_money' | 'card';
export type PaymentProvider = 'flutterwave' | 'mpesa' | 'paystack';

export interface Transaction {
  id: number;
  user_id: number;
  auction_id?: number;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_provider: PaymentProvider;
  provider_transaction_id?: string;
  transaction_type: TransactionType;
  status: TransactionStatus;
  idempotency_key: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export type EscrowStatus = 'held' | 'verified' | 'released' | 'refunded' | 'disputed';

export interface Escrow {
  id: number;
  transaction_id: number;
  auction_id: number;
  buyer_id: number;
  seller_id: number;
  amount: number;
  status: EscrowStatus;
  delivery_code: string;
  locked_at?: Date;
  released_at?: Date;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentWebhook {
  id: number;
  provider: PaymentProvider;
  event_type: string;
  transaction_id?: number;
  payload: Record<string, any>;
  processed: boolean;
  processed_at?: Date;
  created_at: Date;
}

export interface CreateTransactionRequest {
  user_id: number;
  auction_id?: number;
  amount: number;
  currency?: string;
  payment_method: PaymentMethod;
  payment_provider: PaymentProvider;
  transaction_type: TransactionType;
  idempotency_key: string;
  metadata?: Record<string, any>;
}

export interface CreateEscrowRequest {
  transaction_id: number;
  auction_id: number;
  buyer_id: number;
  seller_id: number;
  amount: number;
  metadata?: Record<string, any>;
}

export interface ReleaseEscrowRequest {
  escrow_id: number;
  delivery_code: string;
}
