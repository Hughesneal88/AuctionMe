import { ConfirmationCodeService } from '../services/confirmationCodeService';
import { TransactionStatus } from '../models';

describe('ConfirmationCodeService', () => {
  beforeEach(() => {
    // Clear storage before each test
    ConfirmationCodeService._clearStorage();
  });

  describe('generateUniqueCode', () => {
    it('should generate a 6-digit code', () => {
      const code = ConfirmationCodeService.generateUniqueCode();
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate unique codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(ConfirmationCodeService.generateUniqueCode());
      }
      expect(codes.size).toBe(100);
    });

    it('should generate codes between 100000 and 999999', () => {
      const code = ConfirmationCodeService.generateUniqueCode();
      const numCode = parseInt(code, 10);
      expect(numCode).toBeGreaterThanOrEqual(100000);
      expect(numCode).toBeLessThanOrEqual(999999);
    });
  });

  describe('hashCode and verifyCode', () => {
    it('should hash a code', async () => {
      const code = '123456';
      const hash = await ConfirmationCodeService.hashCode(code);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(code);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should verify correct code against hash', async () => {
      const code = '123456';
      const hash = await ConfirmationCodeService.hashCode(code);
      const isValid = await ConfirmationCodeService.verifyCode(code, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect code against hash', async () => {
      const code = '123456';
      const wrongCode = '654321';
      const hash = await ConfirmationCodeService.hashCode(code);
      const isValid = await ConfirmationCodeService.verifyCode(wrongCode, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('createDeliveryConfirmation', () => {
    it('should create a delivery confirmation', async () => {
      const transactionId = 'trans-123';
      const buyerId = 'buyer-456';

      // Setup transaction
      ConfirmationCodeService._setTransaction(transactionId, {
        id: transactionId,
        buyerId,
        sellerId: 'seller-789',
        status: TransactionStatus.IN_ESCROW,
        amount: 100,
      });

      const result = await ConfirmationCodeService.createDeliveryConfirmation(
        transactionId,
        buyerId
      );

      expect(result.code).toMatch(/^\d{6}$/);
      expect(result.confirmation).toBeDefined();
      expect(result.confirmation.transactionId).toBe(transactionId);
      expect(result.confirmation.buyerId).toBe(buyerId);
      expect(result.confirmation.isUsed).toBe(false);
    });

    it('should throw error if transaction not found', async () => {
      await expect(
        ConfirmationCodeService.createDeliveryConfirmation('nonexistent', 'buyer-456')
      ).rejects.toThrow('Transaction not found');
    });

    it('should throw error if transaction not in escrow', async () => {
      const transactionId = 'trans-123';
      const buyerId = 'buyer-456';

      ConfirmationCodeService._setTransaction(transactionId, {
        id: transactionId,
        buyerId,
        status: TransactionStatus.PENDING_PAYMENT,
        amount: 100,
      });

      await expect(
        ConfirmationCodeService.createDeliveryConfirmation(transactionId, buyerId)
      ).rejects.toThrow('Transaction must be in escrow');
    });

    it('should throw error if buyer ID does not match', async () => {
      const transactionId = 'trans-123';
      const buyerId = 'buyer-456';
      const wrongBuyerId = 'buyer-999';

      ConfirmationCodeService._setTransaction(transactionId, {
        id: transactionId,
        buyerId,
        status: TransactionStatus.IN_ESCROW,
        amount: 100,
      });

      await expect(
        ConfirmationCodeService.createDeliveryConfirmation(transactionId, wrongBuyerId)
      ).rejects.toThrow('Only the buyer can access this confirmation code');
    });

    it('should throw error if confirmation already exists', async () => {
      const transactionId = 'trans-123';
      const buyerId = 'buyer-456';

      ConfirmationCodeService._setTransaction(transactionId, {
        id: transactionId,
        buyerId,
        status: TransactionStatus.IN_ESCROW,
        amount: 100,
      });

      await ConfirmationCodeService.createDeliveryConfirmation(transactionId, buyerId);

      await expect(
        ConfirmationCodeService.createDeliveryConfirmation(transactionId, buyerId)
      ).rejects.toThrow('Confirmation code already exists');
    });
  });

  describe('confirmDelivery', () => {
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
      const result = await ConfirmationCodeService.confirmDelivery(
        transactionId,
        code,
        sellerId
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Delivery confirmed successfully');

      const { transactions } = ConfirmationCodeService._getStorage();
      const transaction = transactions.get(transactionId);
      expect(transaction.status).toBe(TransactionStatus.COMPLETED);
      expect(transaction.escrowReleasedAt).toBeDefined();
    });

    it('should reject invalid code', async () => {
      const result = await ConfirmationCodeService.confirmDelivery(
        transactionId,
        '999999',
        sellerId
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid confirmation code');
    });

    it('should enforce one-time use', async () => {
      // First use - should succeed
      const firstResult = await ConfirmationCodeService.confirmDelivery(
        transactionId,
        code,
        sellerId
      );
      expect(firstResult.success).toBe(true);

      // Second use - should fail
      const secondResult = await ConfirmationCodeService.confirmDelivery(
        transactionId,
        code,
        sellerId
      );
      expect(secondResult.success).toBe(false);
      expect(secondResult.message).toBe('Confirmation code has already been used');
    });

    it('should reject if seller ID does not match', async () => {
      const wrongSellerId = 'seller-999';
      const result = await ConfirmationCodeService.confirmDelivery(
        transactionId,
        code,
        wrongSellerId
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Only the seller can confirm delivery');
    });

    it('should reject if confirmation not found', async () => {
      const result = await ConfirmationCodeService.confirmDelivery(
        'nonexistent-trans',
        code,
        sellerId
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('No confirmation code found for this transaction');
    });

    it('should mark confirmation as used with timestamp', async () => {
      await ConfirmationCodeService.confirmDelivery(transactionId, code, sellerId);

      const { deliveryConfirmations } = ConfirmationCodeService._getStorage();
      const confirmation = Array.from(deliveryConfirmations.values()).find(
        (c) => c.transactionId === transactionId
      );

      expect(confirmation?.isUsed).toBe(true);
      expect(confirmation?.usedAt).toBeDefined();
    });
  });

  describe('getConfirmationDetails', () => {
    it('should return confirmation details for buyer', async () => {
      const transactionId = 'trans-123';
      const buyerId = 'buyer-456';

      ConfirmationCodeService._setTransaction(transactionId, {
        id: transactionId,
        buyerId,
        status: TransactionStatus.IN_ESCROW,
        amount: 100,
      });

      await ConfirmationCodeService.createDeliveryConfirmation(transactionId, buyerId);

      const details = ConfirmationCodeService.getConfirmationDetails(
        transactionId,
        buyerId
      );

      expect(details).toBeDefined();
      expect(details?.transactionId).toBe(transactionId);
      expect(details?.buyerId).toBe(buyerId);
      expect(details?.isUsed).toBe(false);
      // Should not include code hash
      expect((details as any).codeHash).toBeUndefined();
    });

    it('should return null for wrong buyer', async () => {
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

      const details = ConfirmationCodeService.getConfirmationDetails(
        transactionId,
        wrongBuyerId
      );

      expect(details).toBeNull();
    });

    it('should return null for nonexistent transaction', () => {
      const details = ConfirmationCodeService.getConfirmationDetails(
        'nonexistent',
        'buyer-456'
      );

      expect(details).toBeNull();
    });
  });
});
