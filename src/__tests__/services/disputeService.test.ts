import mongoose from 'mongoose';
import disputeService from '../../services/disputeService';
import User from '../../models/User';
import Auction from '../../models/Auction';
import Escrow from '../../models/Escrow';
import Dispute from '../../models/Dispute';
import { 
  DisputeReason, 
  DisputeStatus, 
  DisputeResolution,
  UserRole, 
  AuctionStatus, 
  EscrowStatus 
} from '../../types/enums';

describe('DisputeService', () => {
  let buyer: any;
  let seller: any;
  let admin: any;
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

    admin = await User.create({
      email: 'admin@example.com',
      password: 'password',
      name: 'Admin User',
      role: UserRole.ADMIN
    });

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

    escrow = await Escrow.create({
      auctionId: auction._id,
      buyerId: buyer._id,
      sellerId: seller._id,
      amount: 150,
      status: EscrowStatus.HELD
    });
  });

  describe('createDispute', () => {
    it('should create a dispute successfully', async () => {
      const dispute = await disputeService.createDispute({
        auctionId: auction._id,
        buyerId: buyer._id,
        reason: DisputeReason.ITEM_NOT_RECEIVED,
        description: 'Item was not delivered on time'
      });

      expect(dispute).toBeDefined();
      expect(dispute.buyerId.toString()).toBe(buyer._id.toString());
      expect(dispute.reason).toBe(DisputeReason.ITEM_NOT_RECEIVED);
      expect(dispute.status).toBe(DisputeStatus.OPEN);

      // Check that escrow is locked
      const updatedEscrow = await Escrow.findById(escrow._id);
      expect(updatedEscrow?.lockedForDispute).toBe(true);
      expect(updatedEscrow?.status).toBe(EscrowStatus.LOCKED);
    });

    it('should throw error if auction not found', async () => {
      const fakeAuctionId = new mongoose.Types.ObjectId();

      await expect(
        disputeService.createDispute({
          auctionId: fakeAuctionId,
          buyerId: buyer._id,
          reason: DisputeReason.ITEM_NOT_RECEIVED,
          description: 'Test'
        })
      ).rejects.toThrow('Auction not found');
    });

    it('should throw error if buyer is not the winner', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password',
        name: 'Other User',
        role: UserRole.BUYER
      });

      await expect(
        disputeService.createDispute({
          auctionId: auction._id,
          buyerId: otherUser._id,
          reason: DisputeReason.ITEM_NOT_RECEIVED,
          description: 'Test'
        })
      ).rejects.toThrow('Only the auction winner can create a dispute');
    });
  });

  describe('resolveDispute', () => {
    let dispute: any;

    beforeEach(async () => {
      dispute = await disputeService.createDispute({
        auctionId: auction._id,
        buyerId: buyer._id,
        reason: DisputeReason.ITEM_NOT_RECEIVED,
        description: 'Item was not delivered'
      });
    });

    it('should resolve dispute with refund to buyer', async () => {
      const resolved = await disputeService.resolveDispute({
        disputeId: dispute._id,
        resolution: DisputeResolution.REFUND_BUYER,
        resolutionNote: 'Item was not delivered, refunding buyer',
        reviewedBy: admin._id
      });

      expect(resolved.status).toBe(DisputeStatus.RESOLVED);
      expect(resolved.resolution).toBe(DisputeResolution.REFUND_BUYER);

      // Check that escrow is refunded
      const updatedEscrow = await Escrow.findById(escrow._id);
      expect(updatedEscrow?.status).toBe(EscrowStatus.REFUNDED);
    });

    it('should resolve dispute with release to seller', async () => {
      const resolved = await disputeService.resolveDispute({
        disputeId: dispute._id,
        resolution: DisputeResolution.RELEASE_TO_SELLER,
        resolutionNote: 'Item was delivered, releasing to seller',
        reviewedBy: admin._id
      });

      expect(resolved.status).toBe(DisputeStatus.RESOLVED);
      expect(resolved.resolution).toBe(DisputeResolution.RELEASE_TO_SELLER);

      // Check that escrow is released
      const updatedEscrow = await Escrow.findById(escrow._id);
      expect(updatedEscrow?.status).toBe(EscrowStatus.RELEASED);
    });
  });

  describe('getDisputes', () => {
    it('should get all disputes for a buyer', async () => {
      // Create first auction and escrow
      const auction1 = await Auction.create({
        title: 'Test Auction 1',
        description: 'Test Description 1',
        startingPrice: 100,
        currentPrice: 150,
        sellerId: seller._id,
        winnerId: buyer._id,
        status: AuctionStatus.COMPLETED,
        startDate: new Date(),
        endDate: new Date()
      });

      const escrow1 = await Escrow.create({
        auctionId: auction1._id,
        buyerId: buyer._id,
        sellerId: seller._id,
        amount: 150,
        status: EscrowStatus.HELD
      });

      // Create second auction and escrow
      const auction2 = await Auction.create({
        title: 'Test Auction 2',
        description: 'Test Description 2',
        startingPrice: 200,
        currentPrice: 250,
        sellerId: seller._id,
        winnerId: buyer._id,
        status: AuctionStatus.COMPLETED,
        startDate: new Date(),
        endDate: new Date()
      });

      const escrow2 = await Escrow.create({
        auctionId: auction2._id,
        buyerId: buyer._id,
        sellerId: seller._id,
        amount: 250,
        status: EscrowStatus.HELD
      });

      await disputeService.createDispute({
        auctionId: auction1._id,
        buyerId: buyer._id,
        reason: DisputeReason.ITEM_NOT_RECEIVED,
        description: 'Test dispute 1'
      });

      await disputeService.createDispute({
        auctionId: auction2._id,
        buyerId: buyer._id,
        reason: DisputeReason.DAMAGED_ITEM,
        description: 'Test dispute 2'
      });

      const result = await disputeService.getDisputes({
        buyerId: buyer._id
      });

      expect(result.disputes).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter disputes by status', async () => {
      const result = await disputeService.getDisputes({
        status: DisputeStatus.OPEN
      });

      expect(result.disputes.length).toBeGreaterThan(0);
      result.disputes.forEach((dispute: any) => {
        expect(dispute.status).toBe(DisputeStatus.OPEN);
      });
    });
  });
});
