const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Auction = require('../../src/models/Auction');
const User = require('../../src/models/User');
const Bid = require('../../src/models/Bid');

describe('Auction API Integration Tests', () => {
  let sellerId;
  
  beforeAll(async () => {
    // Close any existing connections and wait
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    // Small delay to ensure clean state
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/auctionme-test';
    await mongoose.connect(MONGODB_URI);
    
    // Create a test user
    const user = new User({
      username: 'testseller',
      email: 'seller@test.com'
    });
    const savedUser = await user.save();
    sellerId = savedUser._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Auction.deleteMany({});
    await Bid.deleteMany({});
  });

  describe('POST /api/auctions', () => {
    it('should create a new auction', async () => {
      const auctionData = {
        title: 'Test Laptop',
        description: 'Used laptop in good condition',
        startingBid: 500,
        duration: 24,
        sellerId
      };

      const response = await request(app)
        .post('/api/auctions')
        .send(auctionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(auctionData.title);
      expect(response.body.data.currentBid).toBe(auctionData.startingBid);
      expect(response.body.data.status).toBe('active');
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/api/auctions')
        .send({ title: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auctions', () => {
    beforeEach(async () => {
      // Create test auctions
      await Auction.create([
        {
          title: 'Laptop',
          description: 'Used laptop',
          startingBid: 500,
          duration: 24,
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          sellerId
        },
        {
          title: 'Phone',
          description: 'New phone',
          startingBid: 300,
          duration: 48,
          endTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
          sellerId
        }
      ]);
    });

    it('should return all active auctions', async () => {
      const response = await request(app)
        .get('/api/auctions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/auctions?page=1&limit=1')
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should support search', async () => {
      const response = await request(app)
        .get('/api/auctions?search=laptop')
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe('Laptop');
    });

    it('should hide expired auctions', async () => {
      // Create an expired auction
      await Auction.create({
        title: 'Expired Item',
        description: 'This is expired',
        startingBid: 100,
        duration: 1,
        endTime: new Date(Date.now() - 1000),
        sellerId
      });

      const response = await request(app)
        .get('/api/auctions')
        .expect(200);

      // Should still only return the 2 active auctions
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('GET /api/auctions/:id', () => {
    it('should return a single auction', async () => {
      const auction = await Auction.create({
        title: 'Test Item',
        description: 'Test description',
        startingBid: 100,
        duration: 24,
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        sellerId
      });

      const response = await request(app)
        .get(`/api/auctions/${auction._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Item');
    });

    it('should return 404 for non-existent auction', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/auctions/${fakeId}`)
        .expect(404);
    });
  });

  describe('PUT /api/auctions/:id', () => {
    it('should update auction before first bid', async () => {
      const auction = await Auction.create({
        title: 'Original Title',
        description: 'Original description',
        startingBid: 100,
        duration: 24,
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        sellerId
      });

      const response = await request(app)
        .put(`/api/auctions/${auction._id}`)
        .send({
          title: 'Updated Title',
          userId: sellerId
        })
        .expect(200);

      expect(response.body.data.title).toBe('Updated Title');
    });

    it('should prevent update after first bid', async () => {
      const auction = await Auction.create({
        title: 'Test Item',
        description: 'Test description',
        startingBid: 100,
        duration: 24,
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        sellerId,
        firstBidTime: new Date()
      });

      const response = await request(app)
        .put(`/api/auctions/${auction._id}`)
        .send({
          title: 'Updated Title',
          userId: sellerId
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot edit');
    });
  });

  describe('POST /api/auctions/:id/bids', () => {
    let auction;
    let bidderId;

    beforeEach(async () => {
      const bidder = new User({
        username: 'testbidder',
        email: 'bidder@test.com'
      });
      const savedBidder = await bidder.save();
      bidderId = savedBidder._id.toString();

      auction = await Auction.create({
        title: 'Test Item',
        description: 'Test description',
        startingBid: 100,
        duration: 24,
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        sellerId
      });
    });

    it('should place a valid bid', async () => {
      const response = await request(app)
        .post(`/api/auctions/${auction._id}/bids`)
        .send({
          amount: 150,
          bidderId
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(150);
    });

    it('should reject bid lower than current bid', async () => {
      await request(app)
        .post(`/api/auctions/${auction._id}/bids`)
        .send({
          amount: 50,
          bidderId
        })
        .expect(400);
    });

    it('should prevent seller from bidding on own auction', async () => {
      const response = await request(app)
        .post(`/api/auctions/${auction._id}/bids`)
        .send({
          amount: 150,
          bidderId: sellerId
        })
        .expect(400);

      expect(response.body.message).toContain('cannot bid');
    });

    it('should update auction after first bid', async () => {
      await request(app)
        .post(`/api/auctions/${auction._id}/bids`)
        .send({
          amount: 150,
          bidderId
        })
        .expect(201);

      const updatedAuction = await Auction.findById(auction._id);
      expect(updatedAuction.firstBidTime).toBeDefined();
      expect(updatedAuction.currentBid).toBe(150);
      expect(updatedAuction.bidCount).toBe(1);
    });
  });
});
