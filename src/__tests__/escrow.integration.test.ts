import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import Transaction from '../models/Transaction';
import Escrow from '../models/Escrow';
import User from '../models/User.model';
import { TransactionStatus, EscrowStatus } from '../types';
import { hashDeliveryCode, encryptDeliveryCode } from '../utils/helpers';
import { generateAccessToken } from '../utils/jwt.utils';

describe('Escrow API Integration Tests', () => {
  let buyerToken: string;
  let buyerUserId: string;
  let sellerUserId: string;

  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/auctionme-test');
    
    // Create test users
    const buyer = new User({
      email: 'buyer@test.com',
      password: 'hashedPassword',
      name: 'Test Buyer',
      isVerified: true
    });
    await buyer.save();
    buyerUserId = buyer._id.toString();
    buyerToken = generateAccessToken({ userId: buyerUserId, email: buyer.email });

    const seller = new User({
      email: 'seller@test.com',
      password: 'hashedPassword',
      name: 'Test Seller',
      isVerified: true
    });
    await seller.save();
    sellerUserId = seller._id.toString();
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
        buyerId: buyerUserId,
        sellerId: sellerUserId,
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
      expect(response.body.data.deliveryCodeEncrypted).toBeUndefined(); // Should not expose
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
      const encryptionSecret = process.env.DELIVERY_CODE_SECRET || 'default-secret-key-change-in-production';
      const escrow = new Escrow({
        escrowId: 'ESC-TEST-002',
        transactionId: 'TXN-TEST-002',
        auctionId: 'AUCTION-001',
        buyerId: buyerUserId,
        sellerId: sellerUserId,
        amount: 100,
        deliveryCode: hashDeliveryCode(deliveryCode),
        deliveryCodeEncrypted: encryptDeliveryCode(deliveryCode, encryptionSecret),
        status: EscrowStatus.LOCKED
      });
      await escrow.save();

      const response = await request(app)
        .post('/api/escrow/ESC-TEST-002/confirm-delivery')
        .send({
          deliveryCode,
          confirmedBy: sellerUserId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('confirmed');
      
      // Verify encrypted code was cleared
      const updatedEscrow = await Escrow.findOne({ escrowId: 'ESC-TEST-002' });
      expect(updatedEscrow?.deliveryCodeEncrypted).toBeUndefined();
    });

    it('should fail with incorrect delivery code', async () => {
      const escrow = new Escrow({
        escrowId: 'ESC-TEST-003',
        transactionId: 'TXN-TEST-003',
        auctionId: 'AUCTION-001',
        buyerId: buyerUserId,
        sellerId: sellerUserId,
        amount: 100,
        deliveryCode: hashDeliveryCode('123456'),
        status: EscrowStatus.LOCKED
      });
      await escrow.save();

      const response = await request(app)
        .post('/api/escrow/ESC-TEST-003/confirm-delivery')
        .send({
          deliveryCode: '999999',
          confirmedBy: sellerUserId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
    
    it('should prevent code reuse after confirmation', async () => {
      const deliveryCode = '123456';
      const escrow = new Escrow({
        escrowId: 'ESC-TEST-004',
        transactionId: 'TXN-TEST-004',
        auctionId: 'AUCTION-001',
        buyerId: buyerUserId,
        sellerId: sellerUserId,
        amount: 100,
        deliveryCode: hashDeliveryCode(deliveryCode),
        status: EscrowStatus.PENDING_CONFIRMATION // Already confirmed
      });
      await escrow.save();

      const response = await request(app)
        .post('/api/escrow/ESC-TEST-004/confirm-delivery')
        .send({
          deliveryCode,
          confirmedBy: sellerUserId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not in locked state');
    });
  });

  describe('GET /api/escrow/:escrowId/delivery-code', () => {
    it('should return delivery code for authorized buyer', async () => {
      const deliveryCode = '123456';
      const encryptionSecret = process.env.DELIVERY_CODE_SECRET || 'default-secret-key-change-in-production';
      const escrow = new Escrow({
        escrowId: 'ESC-TEST-005',
        transactionId: 'TXN-TEST-005',
        auctionId: 'AUCTION-001',
        buyerId: buyerUserId,
        sellerId: sellerUserId,
        amount: 100,
        deliveryCode: hashDeliveryCode(deliveryCode),
        deliveryCodeEncrypted: encryptDeliveryCode(deliveryCode, encryptionSecret),
        status: EscrowStatus.LOCKED
      });
      await escrow.save();

      const response = await request(app)
        .get('/api/escrow/ESC-TEST-005/delivery-code')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deliveryCode).toBe(deliveryCode);
      expect(response.body.data.message).toContain('only be used once');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/escrow/ESC-TEST-006/delivery-code');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('token');
    });

    it('should fail for unauthorized buyer', async () => {
      const deliveryCode = '123456';
      const encryptionSecret = process.env.DELIVERY_CODE_SECRET || 'default-secret-key-change-in-production';
      const escrow = new Escrow({
        escrowId: 'ESC-TEST-007',
        transactionId: 'TXN-TEST-007',
        auctionId: 'AUCTION-001',
        buyerId: 'DIFFERENT-BUYER-ID',
        sellerId: sellerUserId,
        amount: 100,
        deliveryCode: hashDeliveryCode(deliveryCode),
        deliveryCodeEncrypted: encryptDeliveryCode(deliveryCode, encryptionSecret),
        status: EscrowStatus.LOCKED
      });
      await escrow.save();

      const response = await request(app)
        .get('/api/escrow/ESC-TEST-007/delivery-code')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Unauthorized');
    });

    it('should fail when code is no longer available (already used)', async () => {
      const deliveryCode = '123456';
      const escrow = new Escrow({
        escrowId: 'ESC-TEST-008',
        transactionId: 'TXN-TEST-008',
        auctionId: 'AUCTION-001',
        buyerId: buyerUserId,
        sellerId: sellerUserId,
        amount: 100,
        deliveryCode: hashDeliveryCode(deliveryCode),
        status: EscrowStatus.PENDING_CONFIRMATION // Code already used
      });
      await escrow.save();

      const response = await request(app)
        .get('/api/escrow/ESC-TEST-008/delivery-code')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('no longer available');
    });
  });

  describe('GET /api/escrow/buyer/:buyerId', () => {
    it('should return buyer escrows for authorized user', async () => {
      // Create multiple escrows for buyer
      const escrow1 = new Escrow({
        escrowId: 'ESC-TEST-009',
        transactionId: 'TXN-TEST-009',
        auctionId: 'AUCTION-001',
        buyerId: buyerUserId,
        sellerId: sellerUserId,
        amount: 100,
        deliveryCode: hashDeliveryCode('123456'),
        status: EscrowStatus.LOCKED
      });
      await escrow1.save();

      const escrow2 = new Escrow({
        escrowId: 'ESC-TEST-010',
        transactionId: 'TXN-TEST-010',
        auctionId: 'AUCTION-002',
        buyerId: buyerUserId,
        sellerId: sellerUserId,
        amount: 200,
        deliveryCode: hashDeliveryCode('654321'),
        status: EscrowStatus.RELEASED
      });
      await escrow2.save();

      const response = await request(app)
        .get(`/api/escrow/buyer/${buyerUserId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].deliveryCode).toBeUndefined();
      expect(response.body.data[0].deliveryCodeEncrypted).toBeUndefined();
    });

    it('should fail when accessing another buyer escrows', async () => {
      const response = await request(app)
        .get('/api/escrow/buyer/DIFFERENT-BUYER-ID')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Unauthorized');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/escrow/buyer/${buyerUserId}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('token');
    });
  });

  describe('GET /api/escrow/seller/:sellerId/can-withdraw', () => {
    it('should check if seller can withdraw', async () => {
      const response = await request(app)
        .get(`/api/escrow/seller/${sellerUserId}/can-withdraw`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.canWithdraw).toBeDefined();
    });
  });

  describe('GET /api/escrow/seller/:sellerId/balance', () => {
    it('should return seller available balance', async () => {
      const response = await request(app)
        .get(`/api/escrow/seller/${sellerUserId}/balance`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.availableBalance).toBeDefined();
    });
  });
});
