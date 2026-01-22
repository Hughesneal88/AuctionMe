import { fraudDetectionService } from '../../services/FraudDetectionService';

describe('FraudDetectionService', () => {
  const testUserId = 'test-user-123';
  const testAuctionId = 'auction-456';

  beforeEach(() => {
    // Clean up before each test
    fraudDetectionService.cleanup();
  });

  describe('validateBid', () => {
    it('should validate a legitimate bid', async () => {
      const validation = await fraudDetectionService.validateBid(
        testUserId,
        testAuctionId,
        100,
        50
      );

      expect(validation.isValid).toBe(true);
      expect(validation.riskScore).toBeLessThan(70);
    });

    it('should reject negative bid amount', async () => {
      const validation = await fraudDetectionService.validateBid(
        testUserId,
        testAuctionId,
        -10,
        50
      );

      expect(validation.isValid).toBe(false);
      expect(validation.reason).toContain('positive');
    });

    it('should reject bid lower than current highest', async () => {
      const validation = await fraudDetectionService.validateBid(
        testUserId,
        testAuctionId,
        40,
        50
      );

      expect(validation.isValid).toBe(false);
      expect(validation.reason).toContain('higher');
    });

    it('should flag high velocity bidding', async () => {
      // Place multiple bids quickly
      for (let i = 0; i < 6; i++) {
        await fraudDetectionService.validateBid(
          testUserId,
          testAuctionId,
          100 + i,
          50 + i
        );
      }

      const validation = await fraudDetectionService.validateBid(
        testUserId,
        testAuctionId,
        110,
        109
      );

      expect(validation.flags).toContain('HIGH_VELOCITY');
      expect(validation.riskScore).toBeGreaterThan(0);
    });

    it('should flag unusually high bids', async () => {
      const validation = await fraudDetectionService.validateBid(
        testUserId,
        testAuctionId,
        15000,
        100
      );

      expect(validation.flags).toContain('UNUSUALLY_HIGH');
      expect(validation.riskScore).toBeGreaterThan(0);
    });

    it('should reject too small increment', async () => {
      const validation = await fraudDetectionService.validateBid(
        testUserId,
        testAuctionId,
        100.5,
        100
      );

      expect(validation.isValid).toBe(false);
      expect(validation.reason).toContain('Minimum bid increment');
    });
  });

  describe('isSpam', () => {
    it('should detect spam keywords', async () => {
      const spamContent = 'Click here to get your free viagra now!';
      const isSpam = await fraudDetectionService.isSpam(spamContent, testUserId);

      expect(isSpam).toBe(true);
    });

    it('should detect excessive capitalization', async () => {
      const spamContent = 'THIS IS ALL CAPS SPAM MESSAGE!!!';
      const isSpam = await fraudDetectionService.isSpam(spamContent, testUserId);

      expect(isSpam).toBe(true);
    });

    it('should detect excessive special characters', async () => {
      const spamContent = '!!!###$$$%%%^^^&&&***';
      const isSpam = await fraudDetectionService.isSpam(spamContent, testUserId);

      expect(isSpam).toBe(true);
    });

    it('should detect repeated characters', async () => {
      const spamContent = 'aaaaaaaaaa spam message';
      const isSpam = await fraudDetectionService.isSpam(spamContent, testUserId);

      expect(isSpam).toBe(true);
    });

    it('should allow legitimate content', async () => {
      const legitContent = 'This is a normal auction description for a laptop.';
      const isSpam = await fraudDetectionService.isSpam(legitContent, testUserId);

      expect(isSpam).toBe(false);
    });
  });
});
