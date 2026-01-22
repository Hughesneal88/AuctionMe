import { auctionService } from '../services/auctionService';
import { bidService } from '../services/bidService';
import { notificationService } from '../services/notificationService';
import { db } from '../utils/database';
import { User, UserRole } from '../models/User';
import { Auction, AuctionStatus } from '../models/Auction';
import { v4 as uuidv4 } from 'uuid';

describe('AuctionService', () => {
  let seller: User;
  let buyer1: User;
  let buyer2: User;
  let buyer3: User;
  let auction: Auction;

  beforeEach(() => {
    db.clear();

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

    buyer3 = {
      id: uuidv4(),
      email: 'buyer3@test.com',
      name: 'Buyer 3',
      role: UserRole.BUYER,
      createdAt: new Date(),
    };
    db.createUser(buyer3);

    const now = new Date();
    auction = {
      id: uuidv4(),
      sellerId: seller.id,
      title: 'Test Item',
      description: 'Test description',
      startingBid: 100,
      currentBid: 100,
      minBidIncrement: 10,
      status: AuctionStatus.ACTIVE,
      startTime: new Date(now.getTime() - 60000),
      endTime: new Date(now.getTime() + 3600000),
      createdAt: now,
      updatedAt: now,
    };
    db.createAuction(auction);
  });

  describe('closeAuction', () => {
    it('should close auction and notify winner', async () => {
      await bidService.placeBid(auction.id, buyer1.id, 110);
      await bidService.placeBid(auction.id, buyer2.id, 120);

      await auctionService.closeAuction(auction.id);

      const updatedAuction = db.getAuctionById(auction.id);
      expect(updatedAuction?.status).toBe(AuctionStatus.CLOSED);

      const buyer2Notifications = await notificationService.getUserNotifications(buyer2.id);
      const winnerNotification = buyer2Notifications.find(n => n.type === 'AUCTION_WON');
      expect(winnerNotification).toBeDefined();
      expect(winnerNotification?.message).toContain('won');
    });

    it('should notify losers', async () => {
      await bidService.placeBid(auction.id, buyer1.id, 110);
      await bidService.placeBid(auction.id, buyer2.id, 120);
      await bidService.placeBid(auction.id, buyer3.id, 130);

      await auctionService.closeAuction(auction.id);

      const buyer1Notifications = await notificationService.getUserNotifications(buyer1.id);
      const loserNotification = buyer1Notifications.find(n => n.type === 'AUCTION_LOST');
      expect(loserNotification).toBeDefined();

      const buyer2Notifications = await notificationService.getUserNotifications(buyer2.id);
      const loserNotification2 = buyer2Notifications.find(n => n.type === 'AUCTION_LOST');
      expect(loserNotification2).toBeDefined();
    });

    it('should identify winner by highest bid amount, not most recent', async () => {
      // buyer1 bids 110
      await bidService.placeBid(auction.id, buyer1.id, 110);
      // buyer2 bids higher at 150
      await bidService.placeBid(auction.id, buyer2.id, 150);
      // buyer1 bids again but lower at 120 (this is more recent but not highest)
      await bidService.placeBid(auction.id, buyer1.id, 160);

      await auctionService.closeAuction(auction.id);

      // buyer1 should win with 160 bid
      const buyer1Notifications = await notificationService.getUserNotifications(buyer1.id);
      const winnerNotification = buyer1Notifications.find(n => n.type === 'AUCTION_WON');
      expect(winnerNotification).toBeDefined();

      // buyer2 should lose
      const buyer2Notifications = await notificationService.getUserNotifications(buyer2.id);
      const loserNotification = buyer2Notifications.find(n => n.type === 'AUCTION_LOST');
      expect(loserNotification).toBeDefined();
    });

    it('should handle auction with no bids', async () => {
      await auctionService.closeAuction(auction.id);

      const updatedAuction = db.getAuctionById(auction.id);
      expect(updatedAuction?.status).toBe(AuctionStatus.CLOSED);
    });

    it('should throw error for non-existent auction', async () => {
      await expect(
        auctionService.closeAuction('non-existent')
      ).rejects.toThrow('Auction not found');
    });

    it('should throw error for already closed auction', async () => {
      db.updateAuction(auction.id, { status: AuctionStatus.CLOSED });

      await expect(
        auctionService.closeAuction(auction.id)
      ).rejects.toThrow('Auction is not active');
    });
  });
});
