import mongoose from 'mongoose';
import Transaction from '../models/Transaction';
import Escrow from '../models/Escrow';
import transactionService from '../services/transactionService';
import escrowService from '../services/escrowService';
import { TransactionStatus, EscrowStatus, PaymentMethod } from '../types';
import { generateDeliveryCode } from '../utils/helpers';

/**
 * End-to-end test for the complete payment and escrow flow
 */
describe('Payment and Escrow Flow E2E', () => {
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

  it('should complete full payment and escrow flow', async () => {
    // Step 1: Create transaction
    const transaction = await transactionService.createTransaction(
      'AUCTION-001',
      'BUYER-001',
      'SELLER-001',
      100,
      'USD',
      PaymentMethod.MOBILE_MONEY
    );

    expect(transaction.status).toBe(TransactionStatus.PENDING);
    expect(transaction.amount).toBe(100);

    // Step 2: Simulate payment callback (payment successful)
    const updatedTransaction = await transactionService.handlePaymentCallback(
      transaction.transactionId,
      'completed',
      'PROVIDER-REF-123',
      { paymentMethod: 'mobile_money' }
    );

    expect(updatedTransaction.status).toBe(TransactionStatus.COMPLETED);

    // Step 3: Verify escrow was created automatically
    const escrow = await escrowService.getEscrowByTransaction(transaction.transactionId);
    expect(escrow).toBeDefined();
    expect(escrow?.status).toBe(EscrowStatus.LOCKED);
    expect(escrow?.amount).toBe(100);

    // Step 4: Seller cannot withdraw while escrow is locked
    const canWithdraw = await escrowService.canWithdraw('SELLER-001', 100);
    expect(canWithdraw).toBe(false);

    // Step 5: Buyer receives item and provides delivery code
    // For testing, we simulate the delivery code retrieval
    // In production, buyer would get code via SMS/Email or retrieve via API
    const deliveryCode = '123456'; // Simulated delivery code
    
    // We need to update the escrow with a known hashed and encrypted code for testing
    const crypto = require('crypto');
    const hashedCode = crypto.createHash('sha256').update(deliveryCode).digest('hex');
    
    // Encrypt the code using the same method as the service
    const encryptionSecret = process.env.DELIVERY_CODE_SECRET || 'default-secret-key-change-in-production';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(encryptionSecret.padEnd(32, '0').substring(0, 32)), iv);
    let encrypted = cipher.update(deliveryCode, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    const encryptedCode = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    
    if (escrow) {
      escrow.deliveryCode = hashedCode;
      escrow.deliveryCodeEncrypted = encryptedCode;
      await escrow.save();
    }

    // Step 6: Confirm delivery with code
    const confirmedEscrow = await escrowService.confirmDelivery(
      escrow!.escrowId,
      deliveryCode,
      'SELLER-001'
    );

    expect(confirmedEscrow.status).toBe(EscrowStatus.PENDING_CONFIRMATION);
    expect(confirmedEscrow.confirmedAt).toBeDefined();

    // Step 7: Release funds to seller
    const releasedEscrow = await escrowService.releaseFunds(confirmedEscrow.escrowId);
    expect(releasedEscrow.status).toBe(EscrowStatus.RELEASED);
    expect(releasedEscrow.releasedAt).toBeDefined();

    // Step 8: Verify seller can now withdraw
    const canWithdrawNow = await escrowService.canWithdraw('SELLER-001', 100);
    expect(canWithdrawNow).toBe(true);

    // Step 9: Check available balance
    const balance = await escrowService.getAvailableBalance('SELLER-001');
    expect(balance).toBe(100);
  });

  it('should handle payment failure correctly', async () => {
    // Create transaction
    const transaction = await transactionService.createTransaction(
      'AUCTION-002',
      'BUYER-002',
      'SELLER-002',
      200,
      'USD',
      PaymentMethod.MOBILE_MONEY
    );

    // Simulate payment failure
    const failedTransaction = await transactionService.handlePaymentCallback(
      transaction.transactionId,
      'failed',
      undefined,
      { reason: 'insufficient_funds' }
    );

    expect(failedTransaction.status).toBe(TransactionStatus.FAILED);

    // Verify no escrow was created
    const escrow = await escrowService.getEscrowByTransaction(transaction.transactionId);
    expect(escrow).toBeNull();
  });

  it('should handle refund correctly', async () => {
    // Create and complete transaction
    const transaction = await transactionService.createTransaction(
      'AUCTION-003',
      'BUYER-003',
      'SELLER-003',
      150,
      'USD',
      PaymentMethod.MOBILE_MONEY
    );

    await transactionService.handlePaymentCallback(
      transaction.transactionId,
      'completed',
      'PROVIDER-REF-456'
    );

    const escrow = await escrowService.getEscrowByTransaction(transaction.transactionId);
    expect(escrow).toBeDefined();

    // Process refund
    const refundedEscrow = await escrowService.refundEscrow(
      escrow!.escrowId,
      'Item not available'
    );

    expect(refundedEscrow.status).toBe(EscrowStatus.REFUNDED);
    expect(refundedEscrow.refundedAt).toBeDefined();
  });

  it('should prevent fund release without delivery confirmation', async () => {
    // Create and complete transaction
    const transaction = await transactionService.createTransaction(
      'AUCTION-004',
      'BUYER-004',
      'SELLER-004',
      250,
      'USD',
      PaymentMethod.MOBILE_MONEY
    );

    await transactionService.handlePaymentCallback(
      transaction.transactionId,
      'completed',
      'PROVIDER-REF-789'
    );

    const escrow = await escrowService.getEscrowByTransaction(transaction.transactionId);
    expect(escrow).toBeDefined();

    // Try to release funds without confirmation
    await expect(
      escrowService.releaseFunds(escrow!.escrowId)
    ).rejects.toThrow('Delivery must be confirmed before releasing funds');

    expect(escrow?.status).toBe(EscrowStatus.LOCKED);
  });

  it('should prevent double release of funds', async () => {
    // Create and complete transaction
    const transaction = await transactionService.createTransaction(
      'AUCTION-005',
      'BUYER-005',
      'SELLER-005',
      300,
      'USD',
      PaymentMethod.MOBILE_MONEY
    );

    await transactionService.handlePaymentCallback(
      transaction.transactionId,
      'completed',
      'PROVIDER-REF-ABC'
    );

    const escrow = await escrowService.getEscrowByTransaction(transaction.transactionId);
    expect(escrow).toBeDefined();

    // Confirm delivery and release funds
    const deliveryCode = '654321';
    const crypto = require('crypto');
    const hashedCode = crypto.createHash('sha256').update(deliveryCode).digest('hex');
    
    // Encrypt the code
    const encryptionSecret = process.env.DELIVERY_CODE_SECRET || 'default-secret-key-change-in-production';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(encryptionSecret.padEnd(32, '0').substring(0, 32)), iv);
    let encrypted = cipher.update(deliveryCode, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    const encryptedCode = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    
    if (escrow) {
      escrow.deliveryCode = hashedCode;
      escrow.deliveryCodeEncrypted = encryptedCode;
      await escrow.save();
    }

    await escrowService.confirmDelivery(escrow!.escrowId, deliveryCode, 'SELLER-005');
    await escrowService.releaseFunds(escrow!.escrowId);

    // Try to release again
    await expect(
      escrowService.releaseFunds(escrow!.escrowId)
    ).rejects.toThrow('Delivery must be confirmed before releasing funds');
  });
});
