import { Bid } from '../models/Bid';
import { AuctionStatus } from '../models/Auction';
import { db } from '../utils/database';
import { v4 as uuidv4 } from 'uuid';

export class BidValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BidValidationError';
  }
}

export class BidService {
  /**
   * Place a new bid on an auction
   */
  async placeBid(auctionId: string, bidderId: string, amount: number): Promise<Bid> {
    // Validate auction exists
    const auction = db.getAuctionById(auctionId);
    if (!auction) {
      throw new BidValidationError('Auction not found');
    }

    // Validate auction is active
    if (auction.status !== AuctionStatus.ACTIVE) {
      throw new BidValidationError('Auction is not active');
    }

    // Check if auction has ended
    if (new Date() > auction.endTime) {
      throw new BidValidationError('Auction has ended');
    }

    // Check if auction has started
    if (new Date() < auction.startTime) {
      throw new BidValidationError('Auction has not started yet');
    }

    // Prevent self-bidding
    if (auction.sellerId === bidderId) {
      throw new BidValidationError('Sellers cannot bid on their own auctions');
    }

    // Validate bidder exists
    const bidder = db.getUserById(bidderId);
    if (!bidder) {
      throw new BidValidationError('Bidder not found');
    }

    // Get current highest bid
    const highestBid = db.getHighestBidForAuction(auctionId);
    const currentHighest = highestBid ? highestBid.amount : auction.startingBid;

    // Validate bid amount meets minimum increment
    const minimumBid = currentHighest + auction.minBidIncrement;
    if (amount < minimumBid) {
      throw new BidValidationError(
        `Bid must be at least ${minimumBid} (current bid: ${currentHighest}, minimum increment: ${auction.minBidIncrement})`
      );
    }

    // Create the bid
    const bid: Bid = {
      id: uuidv4(),
      auctionId,
      bidderId,
      amount,
      timestamp: new Date(),
    };

    db.createBid(bid);

    // Update auction's current bid
    db.updateAuction(auctionId, { currentBid: amount });

    return bid;
  }

  /**
   * Get all bids for an auction
   */
  async getBidsForAuction(auctionId: string): Promise<Bid[]> {
    return db.getBidsByAuctionId(auctionId);
  }

  /**
   * Get highest bid for an auction
   */
  async getHighestBid(auctionId: string): Promise<Bid | undefined> {
    return db.getHighestBidForAuction(auctionId);
  }

  /**
   * Get all bids by a specific bidder
   */
  async getBidsByBidder(bidderId: string): Promise<Bid[]> {
    return db.getBidsByBidderId(bidderId);
  }

  /**
   * Get the current highest bidder (used for outbid notifications)
   */
  async getCurrentHighestBidder(auctionId: string): Promise<string | undefined> {
    const highestBid = await this.getHighestBid(auctionId);
    return highestBid?.bidderId;
  }
}

export const bidService = new BidService();
