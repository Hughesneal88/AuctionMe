import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import Transaction from '../models/Transaction';
import Escrow from '../models/Escrow';
import { TransactionStatus } from '../types';
import { hashDeliveryCode } from '../utils/helpers';

describe('Escrow API Integration Tests', () => {
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

  describe('GET /api/escrow/:escrowId/status', () => {
    it('should return escrow status', async () => {
      // Create a test escrow
      const escrow = new Escrow({
        escrowId: 'ESC-TEST-001',
        transactionId: 'TXN-TEST-001',
        auctionId: 'AUCTION-001',
        buyerId: 'BUYER-001',
        sellerId: 'SELLER-001',
        amount: 100,
        deliveryCode: hashDeliveryCode('123456')
      });
      await escrow.save();

      const response = await request(app)
        .get('/api/escrow/ESC-TEST-001/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.escrowId).toBe('ESC-TEST-001');
      expect(response.body.data.deliveryCode).toBeUndefined(); // Should not expose
    });

    it('should return 404 for non-existent escrow', async () => {
      const response = await request(app)
        .get('/api/escrow/NON-EXISTENT/status');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/escrow/:escrowId/confirm-delivery', () => {
    it('should confirm delivery with correct code', async () => {
      const deliveryCode = '123456';
      const escrow = new Escrow({
        escrowId: 'ESC-TEST-002',
        transactionId: 'TXN-TEST-002',
        auctionId: 'AUCTION-001',
        buyerId: 'BUYER-001',
        sellerId: 'SELLER-001',
        amount: 100,
        deliveryCode: hashDeliveryCode(deliveryCode)
      });
      await escrow.save();

      const response = await request(app)
        .post('/api/escrow/ESC-TEST-002/confirm-delivery')
        .send({
          deliveryCode,
          confirmedBy: 'SELLER-001'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('confirmed');
    });

    it('should fail with incorrect delivery code', async () => {
      const escrow = new Escrow({
        escrowId: 'ESC-TEST-003',
        transactionId: 'TXN-TEST-003',
        auctionId: 'AUCTION-001',
        buyerId: 'BUYER-001',
        sellerId: 'SELLER-001',
        amount: 100,
        deliveryCode: hashDeliveryCode('123456')
      });
      await escrow.save();

      const response = await request(app)
        .post('/api/escrow/ESC-TEST-003/confirm-delivery')
        .send({
          deliveryCode: '999999',
          confirmedBy: 'SELLER-001'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/escrow/seller/:sellerId/can-withdraw', () => {
    it('should check if seller can withdraw', async () => {
      const response = await request(app)
        .get('/api/escrow/seller/SELLER-001/can-withdraw');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.canWithdraw).toBeDefined();
    });
  });

  describe('GET /api/escrow/seller/:sellerId/balance', () => {
    it('should return seller available balance', async () => {
      const response = await request(app)
        .get('/api/escrow/seller/SELLER-001/balance');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.availableBalance).toBeDefined();
    });
  });
});
