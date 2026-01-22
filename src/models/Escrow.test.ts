import mongoose from 'mongoose';
import Escrow from '../models/Escrow';
import { EscrowStatus } from '../types';

describe('Escrow Model', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/auctionme-test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Escrow.deleteMany({});
  });

  it('should create an escrow successfully', async () => {
    const escrowData = {
      escrowId: 'ESC-TEST-001',
      transactionId: 'TXN-TEST-001',
      auctionId: 'AUCTION-001',
      buyerId: 'BUYER-001',
      sellerId: 'SELLER-001',
      amount: 100,
      currency: 'USD',
      status: EscrowStatus.LOCKED,
      deliveryCode: 'hashed-code-123'
    };

    const escrow = new Escrow(escrowData);
    const savedEscrow = await escrow.save();

    expect(savedEscrow._id).toBeDefined();
    expect(savedEscrow.escrowId).toBe('ESC-TEST-001');
    expect(savedEscrow.amount).toBe(100);
    expect(savedEscrow.status).toBe(EscrowStatus.LOCKED);
  });

  it('should fail if required fields are missing', async () => {
    const escrow = new Escrow({
      escrowId: 'ESC-TEST-002',
      amount: 100
    });

    await expect(escrow.save()).rejects.toThrow();
  });

  it('should have timestamps', async () => {
    const escrow = new Escrow({
      escrowId: 'ESC-TEST-003',
      transactionId: 'TXN-TEST-001',
      auctionId: 'AUCTION-001',
      buyerId: 'BUYER-001',
      sellerId: 'SELLER-001',
      amount: 100,
      deliveryCode: 'hashed-code-123'
    });

    const savedEscrow = await escrow.save();
    expect(savedEscrow.createdAt).toBeDefined();
    expect(savedEscrow.updatedAt).toBeDefined();
  });

  it('should update escrow status', async () => {
    const escrow = new Escrow({
      escrowId: 'ESC-TEST-004',
      transactionId: 'TXN-TEST-001',
      auctionId: 'AUCTION-001',
      buyerId: 'BUYER-001',
      sellerId: 'SELLER-001',
      amount: 100,
      deliveryCode: 'hashed-code-123',
      status: EscrowStatus.LOCKED
    });

    const savedEscrow = await escrow.save();
    savedEscrow.status = EscrowStatus.RELEASED;
    savedEscrow.releasedAt = new Date();
    await savedEscrow.save();

    const updatedEscrow = await Escrow.findOne({ escrowId: 'ESC-TEST-004' });
    expect(updatedEscrow?.status).toBe(EscrowStatus.RELEASED);
    expect(updatedEscrow?.releasedAt).toBeDefined();
  });
});
