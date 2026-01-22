import {
  generateTransactionId,
  generateEscrowId,
  generateDeliveryCode,
  hashDeliveryCode,
  compareDeliveryCode,
  verifyWebhookSignature
} from '../utils/helpers';

describe('Helper Functions', () => {
  describe('generateTransactionId', () => {
    it('should generate a unique transaction ID', () => {
      const id1 = generateTransactionId();
      const id2 = generateTransactionId();

      expect(id1).toMatch(/^TXN-[A-Z0-9]+-[A-Z0-9]+$/);
      expect(id2).toMatch(/^TXN-[A-Z0-9]+-[A-Z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('generateEscrowId', () => {
    it('should generate a unique escrow ID', () => {
      const id1 = generateEscrowId();
      const id2 = generateEscrowId();

      expect(id1).toMatch(/^ESC-[A-Z0-9]+-[A-Z0-9]+$/);
      expect(id2).toMatch(/^ESC-[A-Z0-9]+-[A-Z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('generateDeliveryCode', () => {
    it('should generate a 6-digit code', () => {
      const code = generateDeliveryCode();
      expect(code).toMatch(/^\d{6}$/);
      expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(code)).toBeLessThan(1000000);
    });
  });

  describe('hashDeliveryCode and compareDeliveryCode', () => {
    it('should hash and verify delivery code correctly', () => {
      const code = '123456';
      const hash = hashDeliveryCode(code);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(code);
      expect(compareDeliveryCode(code, hash)).toBe(true);
      expect(compareDeliveryCode('654321', hash)).toBe(false);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';
      const invalidSignature = 'invalid-signature-12345';

      expect(verifyWebhookSignature(payload, invalidSignature, secret)).toBe(false);
    });
  });
});
