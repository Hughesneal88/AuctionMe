export enum AuctionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED'
}

export interface Auction {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  startingBid: number;
  currentBid: number;
  minBidIncrement: number;
  status: AuctionStatus;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
}
