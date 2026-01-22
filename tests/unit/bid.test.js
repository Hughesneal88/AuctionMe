const mongoose = require('mongoose');
const Bid = require('../../src/models/Bid');
const Auction = require('../../src/models/Auction');

describe('Bid Model', () => {
  beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/auctionme-test';
    await mongoose.connect(MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Bid.deleteMany({});
    await Auction.deleteMany({});
  });

  describe('Bid Creation', () => {
    it('should create a valid bid', async () => {
      const auctionId = new mongoose.Types.ObjectId();
      const bidderId = new mongoose.Types.ObjectId();
      
      const bidData = {
        auctionId,
        bidderId,
        amount: 150
      };

      const bid = new Bid(bidData);
      const savedBid = await bid.save();

      expect(savedBid._id).toBeDefined();
      expect(savedBid.amount).toBe(bidData.amount);
      expect(savedBid.timestamp).toBeDefined();
    });

    it('should fail without required fields', async () => {
      const bid = new Bid({});
      let error;
      
      try {
        await bid.save();
      } catch (e) {
        error = e;
      }
      
      expect(error).toBeDefined();
      expect(error.name).toBe('ValidationError');
    });

    it('should fail with negative amount', async () => {
      const bid = new Bid({
        auctionId: new mongoose.Types.ObjectId(),
        bidderId: new mongoose.Types.ObjectId(),
        amount: -10
      });
      
      let error;
      try {
        await bid.save();
      } catch (e) {
        error = e;
      }
      
      expect(error).toBeDefined();
    });
  });
});
