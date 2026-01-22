import mongoose from 'mongoose';
import Dispute from '../../models/Dispute';
import User from '../../models/User';
import Auction from '../../models/Auction';
import Escrow from '../../models/Escrow';
import { DisputeStatus, DisputeReason, UserRole, AuctionStatus, EscrowStatus } from '../../types/enums';

describe('Dispute Model', () => {
  let buyer: any;
  let seller: any;
  let auction: any;
  let escrow: any;

  beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auctionme_test';
    await mongoose.connect(MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Auction.deleteMany({}),
      Escrow.deleteMany({}),
      Dispute.deleteMany({})
    ]);

    // Create test users
    buyer = await User.create({
      email: 'buyer@example.com',
      password: 'password',
      name: 'Buyer User',
      role: UserRole.BUYER
    });

    seller = await User.create({
      email: 'seller@example.com',
      password: 'password',
      name: 'Seller User',
      role: UserRole.SELLER
    });

    // Create test auction
    auction = await Auction.create({
      title: 'Test Auction',
      description: 'Test Description',
      startingPrice: 100,
      currentPrice: 150,
      sellerId: seller._id,
      winnerId: buyer._id,
      status: AuctionStatus.COMPLETED,
      startDate: new Date(),
      endDate: new Date()
    });

    // Create test escrow
    escrow = await Escrow.create({
      auctionId: auction._id,
      buyerId: buyer._id,
      sellerId: seller._id,
      amount: 150,
      status: EscrowStatus.HELD
    });
  });

  describe('Dispute Creation', () => {
    it('should create a dispute with required fields', async () => {
      const timeLimit = new Date();
      timeLimit.setDate(timeLimit.getDate() + 7);

      const dispute = await Dispute.create({
        auctionId: auction._id,
        escrowId: escrow._id,
        buyerId: buyer._id,
        sellerId: seller._id,
        reason: DisputeReason.ITEM_NOT_RECEIVED,
        description: 'Item was not delivered',
        timeLimit,
        status: DisputeStatus.OPEN
      });

      expect(dispute.reason).toBe(DisputeReason.ITEM_NOT_RECEIVED);
      expect(dispute.description).toBe('Item was not delivered');
      expect(dispute.status).toBe(DisputeStatus.OPEN);
    });

    it('should create a dispute with evidence', async () => {
      const timeLimit = new Date();
      timeLimit.setDate(timeLimit.getDate() + 7);

      const evidence = [{
        description: 'Photo of damaged item',
        imageUrls: ['https://example.com/image1.jpg'],
        uploadedAt: new Date()
      }];

      const dispute = await Dispute.create({
        auctionId: auction._id,
        escrowId: escrow._id,
        buyerId: buyer._id,
        sellerId: seller._id,
        reason: DisputeReason.DAMAGED_ITEM,
        description: 'Item was damaged',
        evidence,
        timeLimit,
        status: DisputeStatus.OPEN
      });

      expect(dispute.evidence).toHaveLength(1);
      expect(dispute.evidence[0].description).toBe('Photo of damaged item');
    });
  });

  describe('Dispute Status Updates', () => {
    it('should update dispute status to under review', async () => {
      const timeLimit = new Date();
      timeLimit.setDate(timeLimit.getDate() + 7);

      const dispute = await Dispute.create({
        auctionId: auction._id,
        escrowId: escrow._id,
        buyerId: buyer._id,
        sellerId: seller._id,
        reason: DisputeReason.ITEM_NOT_RECEIVED,
        description: 'Item was not delivered',
        timeLimit,
        status: DisputeStatus.OPEN
      });

      dispute.status = DisputeStatus.UNDER_REVIEW;
      await dispute.save();

      expect(dispute.status).toBe(DisputeStatus.UNDER_REVIEW);
    });
  });
});
