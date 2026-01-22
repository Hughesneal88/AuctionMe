import { bidService, BidValidationError } from '../services/bidService';
import { db } from '../utils/database';
import { User, UserRole } from '../models/User';
import { Auction, AuctionStatus } from '../models/Auction';
import { v4 as uuidv4 } from 'uuid';

describe('BidService', () => {
  let seller: User;
  let buyer1: User;
  let buyer2: User;
  let auction: Auction;

  beforeEach(() => {
    // Clear database before each test
    db.clear();

    // Create test users
    seller = {
      id: uuidv4(),
      email: 'seller@test.com',
      name: 'Seller',
      role: UserRole.SELLER,
      createdAt: new Date(),
    };
    db.createUser(seller);

    buyer1 = {
      id: uuidv4(),
      email: 'buyer1@test.com',
      name: 'Buyer 1',
      role: UserRole.BUYER,
      createdAt: new Date(),
    };
    db.createUser(buyer1);

    buyer2 = {
      id: uuidv4(),
      email: 'buyer2@test.com',
      name: 'Buyer 2',
      role: UserRole.BUYER,
      createdAt: new Date(),
    };
    db.createUser(buyer2);

    // Create test auction
    const now = new Date();
    const startTime = new Date(now.getTime() - 60000); // Started 1 minute ago
    const endTime = new Date(now.getTime() + 3600000); // Ends in 1 hour

    auction = {
      id: uuidv4(),
      sellerId: seller.id,
      title: 'Test Item',
      description: 'Test description',
      startingBid: 100,
      currentBid: 100,
      minBidIncrement: 10,
      status: AuctionStatus.ACTIVE,
      startTime,
      endTime,
      createdAt: now,
      updatedAt: now,
    };
    db.createAuction(auction);
  });

  describe('placeBid', () => {
    it('should place a valid bid', async () => {
      const bid = await bidService.placeBid(auction.id, buyer1.id, 110);

      expect(bid).toBeDefined();
      expect(bid.auctionId).toBe(auction.id);
      expect(bid.bidderId).toBe(buyer1.id);
      expect(bid.amount).toBe(110);
      expect(bid.id).toBeDefined();
      expect(bid.timestamp).toBeInstanceOf(Date);
    });

    it('should update auction current bid', async () => {
      await bidService.placeBid(auction.id, buyer1.id, 110);
      
      const updatedAuction = db.getAuctionById(auction.id);
      expect(updatedAuction?.currentBid).toBe(110);
    });

    it('should reject bid on non-existent auction', async () => {
      await expect(
        bidService.placeBid('non-existent', buyer1.id, 110)
      ).rejects.toThrow('Auction not found');
    });

    it('should reject bid on inactive auction', async () => {
      db.updateAuction(auction.id, { status: AuctionStatus.CLOSED });

      await expect(
        bidService.placeBid(auction.id, buyer1.id, 110)
      ).rejects.toThrow('Auction is not active');
    });

    it('should reject self-bidding', async () => {
      await expect(
        bidService.placeBid(auction.id, seller.id, 110)
      ).rejects.toThrow('Sellers cannot bid on their own auctions');
    });

    it('should reject bid from non-existent user', async () => {
      await expect(
        bidService.placeBid(auction.id, 'non-existent-user', 110)
      ).rejects.toThrow('Bidder not found');
    });

    it('should reject bid below minimum increment', async () => {
      await bidService.placeBid(auction.id, buyer1.id, 110);

      await expect(
        bidService.placeBid(auction.id, buyer2.id, 115)
      ).rejects.toThrow(BidValidationError);
    });

    it('should accept bid meeting minimum increment', async () => {
      await bidService.placeBid(auction.id, buyer1.id, 110);
      
      const bid2 = await bidService.placeBid(auction.id, buyer2.id, 120);
      expect(bid2.amount).toBe(120);
    });

    it('should allow multiple bids from different users', async () => {
      await bidService.placeBid(auction.id, buyer1.id, 110);
      await bidService.placeBid(auction.id, buyer2.id, 120);
      await bidService.placeBid(auction.id, buyer1.id, 130);

      const bids = await bidService.getBidsForAuction(auction.id);
      expect(bids).toHaveLength(3);
    });

    it('should reject bid on auction that has ended', async () => {
      const pastEndTime = new Date(Date.now() - 1000);
      db.updateAuction(auction.id, { endTime: pastEndTime });

      await expect(
        bidService.placeBid(auction.id, buyer1.id, 110)
      ).rejects.toThrow('Auction has ended');
    });

    it('should reject bid on auction that has not started', async () => {
      const futureStartTime = new Date(Date.now() + 10000);
      db.updateAuction(auction.id, { startTime: futureStartTime });

      await expect(
        bidService.placeBid(auction.id, buyer1.id, 110)
      ).rejects.toThrow('Auction has not started yet');
    });
  });

  describe('getBidsForAuction', () => {
    it('should return bids sorted by timestamp descending', async () => {
      await bidService.placeBid(auction.id, buyer1.id, 110);
      await new Promise(resolve => setTimeout(resolve, 10));
      await bidService.placeBid(auction.id, buyer2.id, 120);
      await new Promise(resolve => setTimeout(resolve, 10));
      await bidService.placeBid(auction.id, buyer1.id, 130);

      const bids = await bidService.getBidsForAuction(auction.id);
      
      expect(bids).toHaveLength(3);
      expect(bids[0].amount).toBe(130); // Most recent
      expect(bids[1].amount).toBe(120);
      expect(bids[2].amount).toBe(110); // Oldest
    });

    it('should return empty array for auction with no bids', async () => {
      const bids = await bidService.getBidsForAuction(auction.id);
      expect(bids).toEqual([]);
    });
  });

  describe('getHighestBid', () => {
    it('should return highest bid', async () => {
      await bidService.placeBid(auction.id, buyer1.id, 110);
      await bidService.placeBid(auction.id, buyer2.id, 120);

      const highestBid = await bidService.getHighestBid(auction.id);
      
      expect(highestBid).toBeDefined();
      expect(highestBid?.amount).toBe(120);
    });

    it('should return undefined for auction with no bids', async () => {
      const highestBid = await bidService.getHighestBid(auction.id);
      expect(highestBid).toBeUndefined();
    });
  });

  describe('getCurrentHighestBidder', () => {
    it('should return current highest bidder', async () => {
      await bidService.placeBid(auction.id, buyer1.id, 110);
      await bidService.placeBid(auction.id, buyer2.id, 120);

      const currentBidder = await bidService.getCurrentHighestBidder(auction.id);
      expect(currentBidder).toBe(buyer2.id);
    });

    it('should return undefined when there are no bids', async () => {
      const currentBidder = await bidService.getCurrentHighestBidder(auction.id);
      expect(currentBidder).toBeUndefined();
    });
  });
});
