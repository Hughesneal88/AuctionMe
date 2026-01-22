import request from 'supertest';
import express from 'express';
import deliveryRoutes from '../routes/deliveryRoutes';
import { ConfirmationCodeService } from '../services/confirmationCodeService';
import { TransactionStatus } from '../models';

// Create a simple test app without database dependencies
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/api/delivery', deliveryRoutes);
  
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });
  
  return app;
};

const app = createTestApp();

describe('Delivery API Integration Tests', () => {
  beforeEach(() => {
    ConfirmationCodeService._clearStorage();
  });

  describe('POST /api/delivery/generate', () => {
    it('should generate confirmation code for valid transaction', async () => {
      const transactionId = 'trans-123';
      const buyerId = 'buyer-456';

      ConfirmationCodeService._setTransaction(transactionId, {
        id: transactionId,
        buyerId,
        sellerId: 'seller-789',
        status: TransactionStatus.IN_ESCROW,
        amount: 100,
      });

      const response = await request(app)
        .post('/api/delivery/generate')
        .send({ transactionId, buyerId })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toMatch(/^\d{6}$/);
      expect(response.body.data.confirmationId).toBeDefined();
      expect(response.body.data.expiresAt).toBeDefined();
    });

    it('should return 400 for missing parameters', async () => {
      const response = await request(app)
        .post('/api/delivery/generate')
        .send({ transactionId: 'trans-123' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should return 400 for invalid transaction', async () => {
      const response = await request(app)
        .post('/api/delivery/generate')
        .send({ transactionId: 'nonexistent', buyerId: 'buyer-456' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Transaction not found');
    });
  });

  describe('POST /api/delivery/confirm', () => {
    let transactionId: string;
    let buyerId: string;
    let sellerId: string;
    let code: string;

    beforeEach(async () => {
      transactionId = 'trans-123';
      buyerId = 'buyer-456';
      sellerId = 'seller-789';

      ConfirmationCodeService._setTransaction(transactionId, {
        id: transactionId,
        buyerId,
        sellerId,
        status: TransactionStatus.IN_ESCROW,
        amount: 100,
      });

      const result = await ConfirmationCodeService.createDeliveryConfirmation(
        transactionId,
        buyerId
      );
      code = result.code;
    });

    it('should confirm delivery with valid code', async () => {
      const response = await request(app)
        .post('/api/delivery/confirm')
        .send({ transactionId, code, sellerId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Delivery confirmed successfully');
    });

    it('should return 400 for invalid code format', async () => {
      const response = await request(app)
        .post('/api/delivery/confirm')
        .send({ transactionId, code: '12345', sellerId })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid code format');
    });

    it('should return 400 for wrong code', async () => {
      const response = await request(app)
        .post('/api/delivery/confirm')
        .send({ transactionId, code: '999999', sellerId })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid confirmation code');
    });

    it('should return 400 for missing parameters', async () => {
      const response = await request(app)
        .post('/api/delivery/confirm')
        .send({ transactionId, code })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should enforce one-time use', async () => {
      // First confirmation
      await request(app)
        .post('/api/delivery/confirm')
        .send({ transactionId, code, sellerId })
        .expect(200);

      // Second confirmation should fail
      const response = await request(app)
        .post('/api/delivery/confirm')
        .send({ transactionId, code, sellerId })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Confirmation code has already been used');
    });
  });

  describe('GET /api/delivery/status/:transactionId', () => {
    it('should return confirmation status for buyer', async () => {
      const transactionId = 'trans-123';
      const buyerId = 'buyer-456';

      ConfirmationCodeService._setTransaction(transactionId, {
        id: transactionId,
        buyerId,
        status: TransactionStatus.IN_ESCROW,
        amount: 100,
      });

      await ConfirmationCodeService.createDeliveryConfirmation(transactionId, buyerId);

      const response = await request(app)
        .get(`/api/delivery/status/${transactionId}`)
        .query({ buyerId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.transactionId).toBe(transactionId);
      expect(response.body.data.isUsed).toBe(false);
    });

    it('should return 404 for wrong buyer', async () => {
      const transactionId = 'trans-123';
      const buyerId = 'buyer-456';
      const wrongBuyerId = 'buyer-999';

      ConfirmationCodeService._setTransaction(transactionId, {
        id: transactionId,
        buyerId,
        status: TransactionStatus.IN_ESCROW,
        amount: 100,
      });

      await ConfirmationCodeService.createDeliveryConfirmation(transactionId, buyerId);

      const response = await request(app)
        .get(`/api/delivery/status/${transactionId}`)
        .query({ buyerId: wrongBuyerId })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing buyerId', async () => {
      const response = await request(app)
        .get('/api/delivery/status/trans-123')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
  });

  describe('Health check', () => {
    it('should return ok status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown').expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Route not found');
    });
  });
});
