import request from 'supertest';
import { createApp } from '../app';
import { db } from '../utils/database';
import { User, UserRole } from '../models/User';
import { Auction, AuctionStatus } from '../models/Auction';
import { v4 as uuidv4 } from 'uuid';

describe('Bid API Integration Tests', () => {
  const app = createApp();
  let seller: User;
  let buyer1: User;
  let buyer2: User;
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

  describe('POST /api/bids', () => {
    it('should place a valid bid', async () => {
      const response = await request(app)
        .post('/api/bids')
        .send({
          auctionId: auction.id,
          bidderId: buyer1.id,
          amount: 110,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.bid).toBeDefined();
      expect(response.body.bid.amount).toBe(110);
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/bids')
        .send({
          auctionId: auction.id,
          amount: 110,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 for invalid amount', async () => {
      const response = await request(app)
        .post('/api/bids')
        .send({
          auctionId: auction.id,
          bidderId: buyer1.id,
          amount: -10,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('positive number');
    });

    it('should return 400 for self-bidding', async () => {
      const response = await request(app)
        .post('/api/bids')
        .send({
          auctionId: auction.id,
          bidderId: seller.id,
          amount: 110,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Sellers cannot bid');
    });

    it('should return 400 for bid below minimum increment', async () => {
      await request(app)
        .post('/api/bids')
        .send({
          auctionId: auction.id,
          bidderId: buyer1.id,
          amount: 110,
        });

      const response = await request(app)
        .post('/api/bids')
        .send({
          auctionId: auction.id,
          bidderId: buyer2.id,
          amount: 115,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Bid must be at least');
    });
  });

  describe('GET /api/bids/auction/:auctionId', () => {
    it('should return all bids for an auction', async () => {
      await request(app)
        .post('/api/bids')
        .send({ auctionId: auction.id, bidderId: buyer1.id, amount: 110 });
      
      await request(app)
        .post('/api/bids')
        .send({ auctionId: auction.id, bidderId: buyer2.id, amount: 120 });

      const response = await request(app)
        .get(`/api/bids/auction/${auction.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.bids).toHaveLength(2);
      expect(response.body.count).toBe(2);
    });

    it('should return empty array for auction with no bids', async () => {
      const response = await request(app)
        .get(`/api/bids/auction/${auction.id}`);

      expect(response.status).toBe(200);
      expect(response.body.bids).toEqual([]);
      expect(response.body.count).toBe(0);
    });
  });

  describe('GET /api/bids/auction/:auctionId/highest', () => {
    it('should return highest bid', async () => {
      await request(app)
        .post('/api/bids')
        .send({ auctionId: auction.id, bidderId: buyer1.id, amount: 110 });
      
      await request(app)
        .post('/api/bids')
        .send({ auctionId: auction.id, bidderId: buyer2.id, amount: 120 });

      const response = await request(app)
        .get(`/api/bids/auction/${auction.id}/highest`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.bid.amount).toBe(120);
    });

    it('should return 404 when no bids exist', async () => {
      const response = await request(app)
        .get(`/api/bids/auction/${auction.id}/highest`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('No bids found');
    });
  });

  describe('GET /api/bids/bidder/:bidderId', () => {
    it('should return all bids by a bidder', async () => {
      await request(app)
        .post('/api/bids')
        .send({ auctionId: auction.id, bidderId: buyer1.id, amount: 110 });

      const response = await request(app)
        .get(`/api/bids/bidder/${buyer1.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.bids).toHaveLength(1);
      expect(response.body.bids[0].bidderId).toBe(buyer1.id);
    });
  });
});
