export enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin'
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned'
}

export enum AuctionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum EscrowStatus {
  HELD = 'held',
  RELEASED = 'released',
  REFUNDED = 'refunded',
  LOCKED = 'locked'
}

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected'
}

export enum DisputeReason {
  ITEM_NOT_RECEIVED = 'item_not_received',
  ITEM_NOT_AS_DESCRIBED = 'item_not_as_described',
  DAMAGED_ITEM = 'damaged_item',
  WRONG_ITEM = 'wrong_item',
  OTHER = 'other'
}

export enum DisputeResolution {
  REFUND_BUYER = 'refund_buyer',
  RELEASE_TO_SELLER = 'release_to_seller',
  PARTIAL_REFUND = 'partial_refund',
  NONE = 'none'
}

export enum AuditAction {
  DISPUTE_CREATED = 'dispute_created',
  DISPUTE_REVIEWED = 'dispute_reviewed',
  DISPUTE_RESOLVED = 'dispute_resolved',
  ESCROW_LOCKED = 'escrow_locked',
  ESCROW_RELEASED = 'escrow_released',
  ESCROW_REFUNDED = 'escrow_refunded',
  USER_SUSPENDED = 'user_suspended',
  USER_UNSUSPENDED = 'user_unsuspended',
  USER_BANNED = 'user_banned',
  ADMIN_ACTION = 'admin_action'
}

export interface IDisputeEvidence {
  description: string;
  imageUrls?: string[];
  uploadedAt: Date;
}
