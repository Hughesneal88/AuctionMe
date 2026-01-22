const mongoose = require('mongoose');
const Auction = require('../../src/models/Auction');

describe('Auction Model', () => {
  beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/auctionme-test';
    await mongoose.connect(MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Auction.deleteMany({});
  });

  describe('Auction Creation', () => {
    it('should create a valid auction', async () => {
      const auctionData = {
        title: 'Test Auction',
        description: 'Test Description',
        startingBid: 100,
        duration: 24,
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        sellerId: new mongoose.Types.ObjectId()
      };

      const auction = new Auction(auctionData);
      const savedAuction = await auction.save();

      expect(savedAuction._id).toBeDefined();
      expect(savedAuction.title).toBe(auctionData.title);
      expect(savedAuction.currentBid).toBe(auctionData.startingBid);
      expect(savedAuction.status).toBe('active');
      expect(savedAuction.bidCount).toBe(0);
    });

    it('should fail without required fields', async () => {
      const auction = new Auction({});
      let error;
      
      try {
        await auction.save();
      } catch (e) {
        error = e;
      }
      
      expect(error).toBeDefined();
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('Auction Methods', () => {
    it('canEdit should return true when no bids placed', async () => {
      const auction = new Auction({
        title: 'Test',
        description: 'Test',
        startingBid: 100,
        duration: 24,
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        sellerId: new mongoose.Types.ObjectId()
      });
      
      await auction.save();
      expect(auction.canEdit()).toBe(true);
    });

    it('canEdit should return false after first bid', async () => {
      const auction = new Auction({
        title: 'Test',
        description: 'Test',
        startingBid: 100,
        duration: 24,
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        sellerId: new mongoose.Types.ObjectId(),
        firstBidTime: new Date()
      });
      
      await auction.save();
      expect(auction.canEdit()).toBe(false);
    });

    it('isExpired should return true for past endTime', () => {
      const auction = new Auction({
        title: 'Test',
        description: 'Test',
        startingBid: 100,
        duration: 24,
        endTime: new Date(Date.now() - 1000),
        sellerId: new mongoose.Types.ObjectId()
      });
      
      expect(auction.isExpired()).toBe(true);
    });

    it('isExpired should return false for future endTime', () => {
      const auction = new Auction({
        title: 'Test',
        description: 'Test',
        startingBid: 100,
        duration: 24,
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        sellerId: new mongoose.Types.ObjectId()
      });
      
      expect(auction.isExpired()).toBe(false);
    });
  });
});
