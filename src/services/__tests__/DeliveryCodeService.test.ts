import { deliveryCodeService } from '../../services/DeliveryCodeService';

describe('DeliveryCodeService', () => {
  const testAuctionId = 'auction-123';
  const testBuyerId = 'buyer-456';
  const testSellerId = 'seller-789';

  describe('generateCode', () => {
    it('should generate a delivery code', async () => {
      const deliveryCode = await deliveryCodeService.generateCode(
        testAuctionId,
        testBuyerId,
        testSellerId
      );

      expect(deliveryCode).toBeDefined();
      expect(deliveryCode.id).toBeDefined();
      expect(deliveryCode.auctionId).toBe(testAuctionId);
      expect(deliveryCode.buyerId).toBe(testBuyerId);
      expect(deliveryCode.sellerId).toBe(testSellerId);
      expect(deliveryCode.code).toMatch(/^\d{6}$/); // 6-digit code
      expect(deliveryCode.failedAttempts).toBe(0);
      expect(deliveryCode.isUsed).toBe(false);
      expect(deliveryCode.isLocked).toBe(false);
    });

    it('should set expiration time', async () => {
      const expiresInHours = 48;
      const deliveryCode = await deliveryCodeService.generateCode(
        testAuctionId,
        testBuyerId,
        testSellerId,
        expiresInHours
      );

      const expectedExpiration = new Date(
        deliveryCode.createdAt.getTime() + expiresInHours * 60 * 60 * 1000
      );

      expect(deliveryCode.expiresAt.getTime()).toBeCloseTo(
        expectedExpiration.getTime(),
        -2 // Within 100ms
      );
    });
  });

  describe('verifyCode', () => {
    it('should verify correct code', async () => {
      const deliveryCode = await deliveryCodeService.generateCode(
        testAuctionId,
        testBuyerId,
        testSellerId
      );

      const result = await deliveryCodeService.verifyCode(
        deliveryCode.id,
        deliveryCode.code,
        testSellerId
      );

      expect(result.success).toBe(true);
      expect(result.deliveryCode?.isUsed).toBe(true);
      expect(result.deliveryCode?.usedAt).toBeInstanceOf(Date);
    });

    it('should reject incorrect code', async () => {
      const deliveryCode = await deliveryCodeService.generateCode(
        testAuctionId,
        testBuyerId,
        testSellerId
      );

      const result = await deliveryCodeService.verifyCode(
        deliveryCode.id,
        '000000',
        testSellerId
      );

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Invalid code');
      expect(result.deliveryCode?.failedAttempts).toBe(1);
    });

    it('should lock after 5 failed attempts', async () => {
      const deliveryCode = await deliveryCodeService.generateCode(
        testAuctionId,
        testBuyerId,
        testSellerId
      );

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await deliveryCodeService.verifyCode(
          deliveryCode.id,
          '000000',
          testSellerId
        );
      }

      const result = await deliveryCodeService.verifyCode(
        deliveryCode.id,
        deliveryCode.code,
        testSellerId
      );

      expect(result.success).toBe(false);
      expect(result.reason).toContain('locked');
    });

    it('should reject already used code', async () => {
      const deliveryCode = await deliveryCodeService.generateCode(
        testAuctionId,
        testBuyerId,
        testSellerId
      );

      // Use the code once
      await deliveryCodeService.verifyCode(
        deliveryCode.id,
        deliveryCode.code,
        testSellerId
      );

      // Try to use again
      const result = await deliveryCodeService.verifyCode(
        deliveryCode.id,
        deliveryCode.code,
        testSellerId
      );

      expect(result.success).toBe(false);
      expect(result.reason).toContain('already been used');
    });

    it('should reject non-existent code', async () => {
      const result = await deliveryCodeService.verifyCode(
        'non-existent-id',
        '123456',
        testSellerId
      );

      expect(result.success).toBe(false);
      expect(result.reason).toContain('not found');
    });
  });

  describe('isValid', () => {
    it('should return true for valid code', async () => {
      const deliveryCode = await deliveryCodeService.generateCode(
        testAuctionId,
        testBuyerId,
        testSellerId
      );

      const isValid = await deliveryCodeService.isValid(deliveryCode.id);
      expect(isValid).toBe(true);
    });

    it('should return false for used code', async () => {
      const deliveryCode = await deliveryCodeService.generateCode(
        testAuctionId,
        testBuyerId,
        testSellerId
      );

      await deliveryCodeService.verifyCode(
        deliveryCode.id,
        deliveryCode.code,
        testSellerId
      );

      const isValid = await deliveryCodeService.isValid(deliveryCode.id);
      expect(isValid).toBe(false);
    });
  });

  describe('getByAuctionId', () => {
    it('should retrieve code by auction ID', async () => {
      const deliveryCode = await deliveryCodeService.generateCode(
        testAuctionId,
        testBuyerId,
        testSellerId
      );

      const retrieved = await deliveryCodeService.getByAuctionId(testAuctionId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(deliveryCode.id);
    });

    it('should return null for non-existent auction', async () => {
      const retrieved = await deliveryCodeService.getByAuctionId('non-existent');
      expect(retrieved).toBeNull();
    });
  });
});
