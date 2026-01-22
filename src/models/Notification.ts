export enum NotificationType {
  OUTBID = 'OUTBID',
  AUCTION_WON = 'AUCTION_WON',
  AUCTION_LOST = 'AUCTION_LOST',
  BID_PLACED = 'BID_PLACED'
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  auctionId: string;
  read: boolean;
  createdAt: Date;
}
