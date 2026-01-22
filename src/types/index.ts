export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  WITHDRAWAL = 'WITHDRAWAL'
}

export enum EscrowStatus {
  LOCKED = 'LOCKED',
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  CONFIRMED = 'CONFIRMED',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  MOBILE_MONEY = 'MOBILE_MONEY',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export interface IUser {
  _id: string;
  email: string;
  name: string;
  phone?: string;
}

export interface IPaymentCallback {
  transactionId: string;
  status: string;
  amount: number;
  reference: string;
  provider: string;
  metadata?: any;
}
