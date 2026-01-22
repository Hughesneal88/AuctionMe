export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  amount: number;
  timestamp: Date;
}
