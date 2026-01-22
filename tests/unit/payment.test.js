const MockPaymentGateway = require('../../src/services/MockPaymentGateway');
const PaymentService = require('../../src/services/PaymentService');

describe('PaymentService', () => {
  let paymentService;
  let mockGateway;

  beforeEach(() => {
    mockGateway = new MockPaymentGateway();
    paymentService = new PaymentService(mockGateway);
  });

  describe('processCharge', () => {
    it('should process a charge successfully', async () => {
      const userId = 'user-123';
      const amount = 100;
      const metadata = { auctionId: 'auction-456' };

      const payment = await paymentService.processCharge(userId, amount, metadata);

      expect(payment).toBeDefined();
      expect(payment.userId).toBe(userId);
      expect(payment.amount).toBe(amount);
      expect(payment.type).toBe('charge');
      expect(payment.status).toBe('completed');
      expect(payment.gatewayTransactionId).toBeDefined();
    });

    it('should handle charge failure', async () => {
      mockGateway.setFailureRate(1); // Force failure

      await expect(
        paymentService.processCharge('user-123', 100)
      ).rejects.toThrow('Payment gateway error');
    });

    it('should reject invalid amount', async () => {
      await expect(
        paymentService.processCharge('user-123', -50)
      ).rejects.toThrow('Payment amount must be a positive number');
    });
  });

  describe('processRefund', () => {
    it('should process a refund successfully', async () => {
      // First create a charge
      const chargePayment = await paymentService.processCharge('user-123', 100);
      
      // Then refund it
      const refundPayment = await paymentService.processRefund(
        'user-123',
        100,
        chargePayment.gatewayTransactionId
      );

      expect(refundPayment).toBeDefined();
      expect(refundPayment.userId).toBe('user-123');
      expect(refundPayment.amount).toBe(100);
      expect(refundPayment.type).toBe('refund');
      expect(refundPayment.status).toBe('completed');
    });

    it('should handle refund of non-existent transaction', async () => {
      await expect(
        paymentService.processRefund('user-123', 100, 'non-existent-txn')
      ).rejects.toThrow('Original transaction not found');
    });
  });

  describe('processPayout', () => {
    it('should process a payout successfully', async () => {
      const userId = 'seller-789';
      const amount = 95; // After fees
      const metadata = { escrowId: 'escrow-123' };

      const payment = await paymentService.processPayout(userId, amount, metadata);

      expect(payment).toBeDefined();
      expect(payment.userId).toBe(userId);
      expect(payment.amount).toBe(amount);
      expect(payment.type).toBe('payout');
      expect(payment.status).toBe('completed');
      expect(payment.gatewayTransactionId).toBeDefined();
    });

    it('should handle payout failure', async () => {
      mockGateway.setFailureRate(1); // Force failure

      await expect(
        paymentService.processPayout('seller-789', 95)
      ).rejects.toThrow('Payment gateway error');
    });
  });

  describe('getPayment', () => {
    it('should retrieve payment details', async () => {
      const payment = await paymentService.processCharge('user-123', 100);
      
      const retrieved = await paymentService.getPayment(payment.gatewayTransactionId);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(payment.gatewayTransactionId);
      expect(retrieved.userId).toBe('user-123');
      expect(retrieved.amount).toBe(100);
    });
  });
});

describe('MockPaymentGateway', () => {
  let gateway;

  beforeEach(() => {
    gateway = new MockPaymentGateway();
  });

  describe('charge', () => {
    it('should create a charge transaction', async () => {
      const result = await gateway.charge('user-123', 100, { test: true });

      expect(result.success).toBe(true);
      expect(result.transactionId).toBeDefined();
      expect(result.amount).toBe(100);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should simulate failures when configured', async () => {
      gateway.setFailureRate(1);

      await expect(
        gateway.charge('user-123', 100)
      ).rejects.toThrow('Payment gateway error');
    });

    it('should validate amount', async () => {
      await expect(
        gateway.charge('user-123', 0)
      ).rejects.toThrow('Payment amount must be a positive number');
    });
  });

  describe('refund', () => {
    it('should create a refund transaction', async () => {
      const chargeResult = await gateway.charge('user-123', 100);
      const refundResult = await gateway.refund(chargeResult.transactionId, 100);

      expect(refundResult.success).toBe(true);
      expect(refundResult.transactionId).toBeDefined();
      expect(refundResult.amount).toBe(100);
    });

    it('should not refund more than original amount', async () => {
      const chargeResult = await gateway.charge('user-123', 100);

      await expect(
        gateway.refund(chargeResult.transactionId, 150)
      ).rejects.toThrow('Refund amount cannot exceed original amount');
    });

    it('should not refund non-existent transaction', async () => {
      await expect(
        gateway.refund('fake-txn-id', 50)
      ).rejects.toThrow('Original transaction not found');
    });
  });

  describe('payout', () => {
    it('should create a payout transaction', async () => {
      const result = await gateway.payout('seller-789', 95, { escrowId: 'escrow-123' });

      expect(result.success).toBe(true);
      expect(result.transactionId).toBeDefined();
      expect(result.amount).toBe(95);
    });

    it('should simulate failures when configured', async () => {
      gateway.setFailureRate(1);

      await expect(
        gateway.payout('seller-789', 95)
      ).rejects.toThrow('Payment gateway error');
    });
  });

  describe('getTransaction', () => {
    it('should retrieve transaction details', async () => {
      const chargeResult = await gateway.charge('user-123', 100);
      const transaction = await gateway.getTransaction(chargeResult.transactionId);

      expect(transaction).toBeDefined();
      expect(transaction.id).toBe(chargeResult.transactionId);
      expect(transaction.userId).toBe('user-123');
      expect(transaction.amount).toBe(100);
      expect(transaction.type).toBe('charge');
    });

    it('should throw error for non-existent transaction', async () => {
      await expect(
        gateway.getTransaction('fake-txn-id')
      ).rejects.toThrow('Transaction not found');
    });
  });

  describe('setFailureRate', () => {
    it('should accept valid failure rates', () => {
      expect(() => gateway.setFailureRate(0)).not.toThrow();
      expect(() => gateway.setFailureRate(0.5)).not.toThrow();
      expect(() => gateway.setFailureRate(1)).not.toThrow();
    });

    it('should reject invalid failure rates', () => {
      expect(() => gateway.setFailureRate(-0.1)).toThrow('Failure rate must be between 0 and 1');
      expect(() => gateway.setFailureRate(1.1)).toThrow('Failure rate must be between 0 and 1');
    });
  });

  describe('clearTransactions', () => {
    it('should clear all transactions', async () => {
      await gateway.charge('user-1', 100);
      await gateway.charge('user-2', 200);

      expect(gateway.transactions.size).toBe(2);

      gateway.clearTransactions();

      expect(gateway.transactions.size).toBe(0);
    });
  });
});
