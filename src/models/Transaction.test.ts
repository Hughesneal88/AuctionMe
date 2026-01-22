import mongoose from 'mongoose';
import Transaction from '../models/Transaction';
import { TransactionStatus, TransactionType, PaymentMethod } from '../types';

describe('Transaction Model', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/auctionme-test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Transaction.deleteMany({});
  });

  it('should create a transaction successfully', async () => {
    const transactionData = {
      transactionId: 'TXN-TEST-001',
      auctionId: 'AUCTION-001',
      buyerId: 'BUYER-001',
      sellerId: 'SELLER-001',
      amount: 100,
      currency: 'USD',
      paymentMethod: PaymentMethod.MOBILE_MONEY,
      status: TransactionStatus.PENDING,
      type: TransactionType.PAYMENT
    };

    const transaction = new Transaction(transactionData);
    const savedTransaction = await transaction.save();

    expect(savedTransaction._id).toBeDefined();
    expect(savedTransaction.transactionId).toBe('TXN-TEST-001');
    expect(savedTransaction.amount).toBe(100);
    expect(savedTransaction.status).toBe(TransactionStatus.PENDING);
  });

  it('should fail if required fields are missing', async () => {
    const transaction = new Transaction({
      transactionId: 'TXN-TEST-002',
      amount: 100
    });

    await expect(transaction.save()).rejects.toThrow();
  });

  it('should fail if amount is negative', async () => {
    const transaction = new Transaction({
      transactionId: 'TXN-TEST-003',
      auctionId: 'AUCTION-001',
      buyerId: 'BUYER-001',
      sellerId: 'SELLER-001',
      amount: -100,
      paymentMethod: PaymentMethod.MOBILE_MONEY
    });

    await expect(transaction.save()).rejects.toThrow();
  });

  it('should have timestamps', async () => {
    const transaction = new Transaction({
      transactionId: 'TXN-TEST-004',
      auctionId: 'AUCTION-001',
      buyerId: 'BUYER-001',
      sellerId: 'SELLER-001',
      amount: 100,
      paymentMethod: PaymentMethod.MOBILE_MONEY
    });

    const savedTransaction = await transaction.save();
    expect(savedTransaction.createdAt).toBeDefined();
    expect(savedTransaction.updatedAt).toBeDefined();
  });
});
