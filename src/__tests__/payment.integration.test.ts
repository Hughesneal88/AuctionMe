import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import Transaction from '../models/Transaction';
import Escrow from '../models/Escrow';

describe('Payment API Integration Tests', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/auctionme-test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Transaction.deleteMany({});
    await Escrow.deleteMany({});
  });

  describe('POST /api/payments/initiate', () => {
    it('should initiate a payment successfully', async () => {
      const response = await request(app)
        .post('/api/payments/initiate')
        .send({
          auctionId: 'AUCTION-001',
          buyerId: 'BUYER-001',
          sellerId: 'SELLER-001',
          amount: 100,
          currency: 'USD',
          phoneNumber: '+1234567890',
          email: 'buyer@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.transactionId).toBeDefined();
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/payments/initiate')
        .send({
          auctionId: 'AUCTION-001',
          amount: 100
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });
  });

  describe('GET /api/payments/:transactionId', () => {
    it('should return transaction status', async () => {
      // First create a transaction
      const createResponse = await request(app)
        .post('/api/payments/initiate')
        .send({
          auctionId: 'AUCTION-001',
          buyerId: 'BUYER-001',
          sellerId: 'SELLER-001',
          amount: 100,
          phoneNumber: '+1234567890',
          email: 'buyer@example.com'
        });

      const transactionId = createResponse.body.data.transactionId;

      // Then get the transaction status
      const response = await request(app)
        .get(`/api/payments/${transactionId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.transactionId).toBe(transactionId);
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .get('/api/payments/NON-EXISTENT-TXN');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/payments/webhook', () => {
    it('should handle payment callback successfully', async () => {
      // First create a transaction
      const createResponse = await request(app)
        .post('/api/payments/initiate')
        .send({
          auctionId: 'AUCTION-001',
          buyerId: 'BUYER-001',
          sellerId: 'SELLER-001',
          amount: 100,
          phoneNumber: '+1234567890',
          email: 'buyer@example.com'
        });

      const transactionId = createResponse.body.data.transactionId;

      // Simulate webhook callback
      const response = await request(app)
        .post('/api/payments/webhook')
        .send({
          transactionId,
          status: 'completed',
          providerReference: 'PROVIDER-REF-123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail with missing webhook data', async () => {
      const response = await request(app)
        .post('/api/payments/webhook')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('running');
    });
  });
});
