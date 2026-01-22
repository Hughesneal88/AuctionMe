const EscrowService = require('../../src/services/EscrowService');
const PaymentService = require('../../src/services/PaymentService');
const MockPaymentGateway = require('../../src/services/MockPaymentGateway');

describe('EscrowService', () => {
  let escrowService;
  let paymentService;
  let mockGateway;

  beforeEach(() => {
    mockGateway = new MockPaymentGateway();
    paymentService = new PaymentService(mockGateway);
    escrowService = new EscrowService(paymentService);
  });

  describe('createEscrow', () => {
    it('should create an escrow and charge the buyer', async () => {
      const auctionId = 'auction-123';
      const buyerId = 'buyer-456';
      const sellerId = 'seller-789';
      const amount = 100;

      const escrow = await escrowService.createEscrow(auctionId, buyerId, sellerId, amount);

      expect(escrow).toBeDefined();
      expect(escrow.auctionId).toBe(auctionId);
      expect(escrow.buyerId).toBe(buyerId);
      expect(escrow.sellerId).toBe(sellerId);
      expect(escrow.amount).toBe(amount);
      expect(escrow.status).toBe('held');
      expect(escrow.deliveryCode).toBeDefined();
      expect(escrow.deliveryCode).toHaveLength(6);
    });

    it('should throw error if payment fails', async () => {
      mockGateway.setFailureRate(1); // Force failure

      await expect(
        escrowService.createEscrow('auction-123', 'buyer-456', 'seller-789', 100)
      ).rejects.toThrow('Failed to create escrow');
    });

    it('should throw error for invalid amount', async () => {
      await expect(
        escrowService.createEscrow('auction-123', 'buyer-456', 'seller-789', -50)
      ).rejects.toThrow();
    });
  });

  describe('verifyDelivery', () => {
    it('should verify delivery with correct code', async () => {
      const escrow = await escrowService.createEscrow('auction-123', 'buyer-456', 'seller-789', 100);
      const deliveryCode = escrow.deliveryCode;

      const result = escrowService.verifyDelivery(escrow.id, deliveryCode);

      expect(result).toBe(true);
      expect(escrow.deliveryConfirmedAt).toBeDefined();
    });

    it('should reject incorrect delivery code', async () => {
      const escrow = await escrowService.createEscrow('auction-123', 'buyer-456', 'seller-789', 100);

      expect(() => {
        escrowService.verifyDelivery(escrow.id, '000000');
      }).toThrow('Invalid delivery code');
    });

    it('should throw error for non-existent escrow', () => {
      expect(() => {
        escrowService.verifyDelivery('non-existent-id', '123456');
      }).toThrow('Escrow not found');
    });
  });

  describe('releaseFunds', () => {
    it('should release funds after delivery confirmation and delay', async () => {
      const escrow = await escrowService.createEscrow('auction-123', 'buyer-456', 'seller-789', 100);
      
      // Verify delivery
      escrowService.verifyDelivery(escrow.id, escrow.deliveryCode);
      
      // Simulate time passing by manually setting deliveryConfirmedAt to the past
      const escrowFromService = escrowService.getEscrow(escrow.id);
      escrowFromService.deliveryConfirmedAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago

      const releasedEscrow = await escrowService.releaseFunds(escrow.id);

      expect(releasedEscrow.status).toBe('released');
      expect(releasedEscrow.releasedAt).toBeDefined();
    });

    it('should not release funds before delay period', async () => {
      const escrow = await escrowService.createEscrow('auction-123', 'buyer-456', 'seller-789', 100);
      
      // Verify delivery
      escrowService.verifyDelivery(escrow.id, escrow.deliveryCode);

      await expect(
        escrowService.releaseFunds(escrow.id)
      ).rejects.toThrow('Funds can only be released');
    });

    it('should not release funds without delivery confirmation', async () => {
      const escrow = await escrowService.createEscrow('auction-123', 'buyer-456', 'seller-789', 100);

      await expect(
        escrowService.releaseFunds(escrow.id)
      ).rejects.toThrow();
    });
  });

  describe('refundEscrow', () => {
    it('should refund escrow to buyer', async () => {
      const escrow = await escrowService.createEscrow('auction-123', 'buyer-456', 'seller-789', 100);
      
      // Get the original transaction ID from the mock gateway
      const transactions = Array.from(mockGateway.transactions.values());
      const originalTxn = transactions[0];

      const refundedEscrow = await escrowService.refundEscrow(escrow.id, originalTxn.id);

      expect(refundedEscrow.status).toBe('refunded');
    });

    it('should throw error for non-existent escrow', async () => {
      await expect(
        escrowService.refundEscrow('non-existent-id', 'txn-123')
      ).rejects.toThrow('Escrow not found');
    });
  });

  describe('disputeEscrow', () => {
    it('should mark escrow as disputed', async () => {
      const escrow = await escrowService.createEscrow('auction-123', 'buyer-456', 'seller-789', 100);

      const disputedEscrow = escrowService.disputeEscrow(escrow.id);

      expect(disputedEscrow.status).toBe('disputed');
    });

    it('should throw error for non-held escrow', async () => {
      const escrow = await escrowService.createEscrow('auction-123', 'buyer-456', 'seller-789', 100);
      
      // Get transaction ID and refund
      const transactions = Array.from(mockGateway.transactions.values());
      await escrowService.refundEscrow(escrow.id, transactions[0].id);

      expect(() => {
        escrowService.disputeEscrow(escrow.id);
      }).toThrow('Can only dispute held escrows');
    });
  });

  describe('getDeliveryCode', () => {
    it('should return delivery code for escrow', async () => {
      const escrow = await escrowService.createEscrow('auction-123', 'buyer-456', 'seller-789', 100);

      const code = escrowService.getDeliveryCode(escrow.id);

      expect(code).toBe(escrow.deliveryCode);
      expect(code).toHaveLength(6);
    });
  });

  describe('autoReleaseEligibleEscrows', () => {
    it('should auto-release eligible escrows', async () => {
      const escrow1 = await escrowService.createEscrow('auction-1', 'buyer-1', 'seller-1', 100);
      const escrow2 = await escrowService.createEscrow('auction-2', 'buyer-2', 'seller-2', 200);

      // Verify deliveries
      escrowService.verifyDelivery(escrow1.id, escrow1.deliveryCode);
      escrowService.verifyDelivery(escrow2.id, escrow2.deliveryCode);

      // Simulate time passing
      const e1 = escrowService.getEscrow(escrow1.id);
      const e2 = escrowService.getEscrow(escrow2.id);
      e1.deliveryConfirmedAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      e2.deliveryConfirmedAt = new Date(Date.now() - 10 * 60 * 60 * 1000); // 10 hours ago (not eligible)

      const released = await escrowService.autoReleaseEligibleEscrows();

      expect(released).toContain(escrow1.id);
      expect(released).not.toContain(escrow2.id);
      expect(e1.status).toBe('released');
      expect(e2.status).toBe('held');
    });
  });
});
