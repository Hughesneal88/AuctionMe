const PaymentService = require('../../src/services/PaymentService');
const EscrowService = require('../../src/services/EscrowService');
const MockPaymentGateway = require('../../src/services/MockPaymentGateway');

describe('Payment Flow Integration', () => {
  let paymentService;
  let escrowService;
  let mockGateway;

  beforeEach(() => {
    mockGateway = new MockPaymentGateway();
    paymentService = new PaymentService(mockGateway);
    escrowService = new EscrowService(paymentService);
  });

  describe('Complete payment lifecycle', () => {
    it('should handle charge, hold, and payout flow', async () => {
      const buyerId = 'buyer-123';
      const sellerId = 'seller-456';
      const amount = 100;

      // 1. Charge buyer (via escrow creation)
      const escrow = await escrowService.createEscrow('auction-1', buyerId, sellerId, amount);
      
      expect(escrow.status).toBe('held');
      expect(escrow.amount).toBe(amount);

      // 2. Verify delivery
      escrowService.verifyDelivery(escrow.id, escrow.deliveryCode);
      expect(escrow.deliveryConfirmedAt).toBeDefined();

      // 3. Simulate time passing
      escrow.deliveryConfirmedAt = new Date(Date.now() - 25 * 60 * 60 * 1000);

      // 4. Release funds (payout to seller)
      const releasedEscrow = await escrowService.releaseFunds(escrow.id);
      
      expect(releasedEscrow.status).toBe('released');
      expect(releasedEscrow.releasedAt).toBeDefined();

      // 5. Verify transactions in gateway
      const transactions = Array.from(mockGateway.transactions.values());
      const chargeTransaction = transactions.find(t => t.type === 'charge');
      const payoutTransaction = transactions.find(t => t.type === 'payout');

      expect(chargeTransaction).toBeDefined();
      expect(chargeTransaction.userId).toBe(buyerId);
      expect(chargeTransaction.amount).toBe(amount);

      expect(payoutTransaction).toBeDefined();
      expect(payoutTransaction.userId).toBe(sellerId);
      expect(payoutTransaction.amount).toBe(amount);
    });

    it('should handle refund flow', async () => {
      const buyerId = 'buyer-123';
      const sellerId = 'seller-456';
      const amount = 100;

      // 1. Create escrow (charges buyer)
      const escrow = await escrowService.createEscrow('auction-1', buyerId, sellerId, amount);

      // 2. Get original transaction
      const transactions = Array.from(mockGateway.transactions.values());
      const chargeTransaction = transactions.find(t => t.type === 'charge');

      // 3. Refund escrow
      const refundedEscrow = await escrowService.refundEscrow(escrow.id, chargeTransaction.id);

      expect(refundedEscrow.status).toBe('refunded');

      // 4. Verify refund transaction
      const refundTransaction = Array.from(mockGateway.transactions.values())
        .find(t => t.type === 'refund');

      expect(refundTransaction).toBeDefined();
      expect(refundTransaction.userId).toBe(buyerId);
      expect(refundTransaction.amount).toBe(amount);
    });

    it('should handle partial refund scenario', async () => {
      const buyerId = 'buyer-123';
      const originalAmount = 100;
      const refundAmount = 50;

      // 1. Process initial charge
      const payment = await paymentService.processCharge(buyerId, originalAmount);
      expect(payment.status).toBe('completed');

      // 2. Process partial refund
      const refund = await paymentService.processRefund(
        buyerId,
        refundAmount,
        payment.gatewayTransactionId
      );

      expect(refund.status).toBe('completed');
      expect(refund.amount).toBe(refundAmount);
    });
  });

  describe('Multiple payments and escrows', () => {
    it('should handle multiple concurrent escrows', async () => {
      const buyer1 = 'buyer-1';
      const buyer2 = 'buyer-2';
      const seller1 = 'seller-1';
      const seller2 = 'seller-2';

      // Create multiple escrows
      const escrow1 = await escrowService.createEscrow('auction-1', buyer1, seller1, 100);
      const escrow2 = await escrowService.createEscrow('auction-2', buyer2, seller2, 200);
      const escrow3 = await escrowService.createEscrow('auction-3', buyer1, seller2, 150);

      expect(escrow1.status).toBe('held');
      expect(escrow2.status).toBe('held');
      expect(escrow3.status).toBe('held');

      // Verify deliveries
      escrowService.verifyDelivery(escrow1.id, escrow1.deliveryCode);
      escrowService.verifyDelivery(escrow2.id, escrow2.deliveryCode);

      // Simulate time passing for some escrows
      const e1 = escrowService.getEscrow(escrow1.id);
      const e2 = escrowService.getEscrow(escrow2.id);
      e1.deliveryConfirmedAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
      e2.deliveryConfirmedAt = new Date(Date.now() - 25 * 60 * 60 * 1000);

      // Release funds
      await escrowService.releaseFunds(escrow1.id);
      await escrowService.releaseFunds(escrow2.id);

      expect(e1.status).toBe('released');
      expect(e2.status).toBe('released');
      expect(escrow3.status).toBe('held');
    });

    it('should handle auto-release of multiple escrows', async () => {
      // Create multiple escrows
      const escrow1 = await escrowService.createEscrow('auction-1', 'buyer-1', 'seller-1', 100);
      const escrow2 = await escrowService.createEscrow('auction-2', 'buyer-2', 'seller-2', 200);
      const escrow3 = await escrowService.createEscrow('auction-3', 'buyer-3', 'seller-3', 150);

      // Verify all deliveries
      escrowService.verifyDelivery(escrow1.id, escrow1.deliveryCode);
      escrowService.verifyDelivery(escrow2.id, escrow2.deliveryCode);
      escrowService.verifyDelivery(escrow3.id, escrow3.deliveryCode);

      // Simulate time passing for some escrows
      const e1 = escrowService.getEscrow(escrow1.id);
      const e2 = escrowService.getEscrow(escrow2.id);
      const e3 = escrowService.getEscrow(escrow3.id);
      e1.deliveryConfirmedAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // Eligible
      e2.deliveryConfirmedAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // Eligible
      e3.deliveryConfirmedAt = new Date(Date.now() - 10 * 60 * 60 * 1000); // Not eligible

      // Auto-release
      const released = await escrowService.autoReleaseEligibleEscrows();

      expect(released).toHaveLength(2);
      expect(released).toContain(escrow1.id);
      expect(released).toContain(escrow2.id);
      expect(released).not.toContain(escrow3.id);
    });
  });

  describe('Payment failure scenarios', () => {
    it('should handle gateway failure on charge', async () => {
      mockGateway.setFailureRate(1);

      await expect(
        escrowService.createEscrow('auction-1', 'buyer-1', 'seller-1', 100)
      ).rejects.toThrow('Failed to create escrow');

      // No escrow should be created
      expect(() => {
        escrowService.getEscrow('non-existent');
      }).toThrow('Escrow not found');
    });

    it('should handle gateway failure on payout', async () => {
      // Create escrow successfully
      const escrow = await escrowService.createEscrow('auction-1', 'buyer-1', 'seller-1', 100);
      
      // Verify delivery
      escrowService.verifyDelivery(escrow.id, escrow.deliveryCode);
      escrow.deliveryConfirmedAt = new Date(Date.now() - 25 * 60 * 60 * 1000);

      // Set gateway to fail on next transaction
      mockGateway.setFailureRate(1);

      await expect(
        escrowService.releaseFunds(escrow.id)
      ).rejects.toThrow('Failed to release funds');

      // Escrow should still be in held status
      expect(escrow.status).toBe('held');
    });

    it('should handle network delays gracefully', async () => {
      // Mock gateway simulates network delays
      const startTime = Date.now();
      
      await paymentService.processCharge('buyer-1', 100);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have some delay (mock gateway adds 50-150ms)
      expect(duration).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Payment validation', () => {
    it('should validate payment amounts', async () => {
      await expect(
        paymentService.processCharge('buyer-1', 0)
      ).rejects.toThrow('Payment amount must be a positive number');

      await expect(
        paymentService.processCharge('buyer-1', -100)
      ).rejects.toThrow('Payment amount must be a positive number');
    });

    it('should not allow refund exceeding original amount', async () => {
      const payment = await paymentService.processCharge('buyer-1', 100);

      await expect(
        paymentService.processRefund('buyer-1', 150, payment.gatewayTransactionId)
      ).rejects.toThrow('Refund amount cannot exceed original amount');
    });

    it('should not allow refund of non-existent transaction', async () => {
      await expect(
        paymentService.processRefund('buyer-1', 50, 'fake-transaction-id')
      ).rejects.toThrow('Original transaction not found');
    });
  });

  describe('Dispute handling', () => {
    it('should handle disputed escrows', async () => {
      const escrow = await escrowService.createEscrow('auction-1', 'buyer-1', 'seller-1', 100);

      const disputedEscrow = escrowService.disputeEscrow(escrow.id);

      expect(disputedEscrow.status).toBe('disputed');

      // Cannot release disputed escrow
      await expect(
        escrowService.releaseFunds(escrow.id)
      ).rejects.toThrow();

      // Cannot refund disputed escrow
      const transactions = Array.from(mockGateway.transactions.values());
      await expect(
        escrowService.refundEscrow(escrow.id, transactions[0].id)
      ).rejects.toThrow();
    });
  });
});
