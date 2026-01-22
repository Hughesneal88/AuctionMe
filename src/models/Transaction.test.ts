import { TransactionModel } from '../models/Transaction';
import { CreateTransactionRequest, TransactionStatus } from '../types';
import pool from '../config/database';

// Mock the database pool
jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

describe('TransactionModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new transaction', async () => {
      const mockTransaction = {
        id: 1,
        user_id: 123,
        amount: 100.50,
        currency: 'USD',
        payment_method: 'mobile_money',
        payment_provider: 'flutterwave',
        transaction_type: 'payment',
        status: 'pending',
        idempotency_key: 'test-key-123',
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockTransaction],
      });

      const data: CreateTransactionRequest = {
        user_id: 123,
        amount: 100.50,
        currency: 'USD',
        payment_method: 'mobile_money',
        payment_provider: 'flutterwave',
        transaction_type: 'payment',
        idempotency_key: 'test-key-123',
      };

      const result = await TransactionModel.create(data);

      expect(result).toEqual(mockTransaction);
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('should throw error for duplicate idempotency key', async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce({
        code: '23505',
      });

      const data: CreateTransactionRequest = {
        user_id: 123,
        amount: 100.50,
        currency: 'USD',
        payment_method: 'mobile_money',
        payment_provider: 'flutterwave',
        transaction_type: 'payment',
        idempotency_key: 'duplicate-key',
      };

      await expect(TransactionModel.create(data)).rejects.toThrow(
        'Transaction with this idempotency key already exists'
      );
    });
  });

  describe('findById', () => {
    it('should find transaction by ID', async () => {
      const mockTransaction = {
        id: 1,
        user_id: 123,
        status: 'completed',
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockTransaction],
      });

      const result = await TransactionModel.findById(1);

      expect(result).toEqual(mockTransaction);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM transactions WHERE id = $1',
        [1]
      );
    });

    it('should return null if transaction not found', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      const result = await TransactionModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update transaction status', async () => {
      const mockUpdatedTransaction = {
        id: 1,
        status: 'completed',
        provider_transaction_id: 'txn-123',
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockUpdatedTransaction],
      });

      const result = await TransactionModel.updateStatus(1, 'completed', 'txn-123');

      expect(result).toEqual(mockUpdatedTransaction);
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('should throw error if transaction not found', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      await expect(TransactionModel.updateStatus(999, 'completed')).rejects.toThrow(
        'Transaction not found'
      );
    });
  });

  describe('findByIdempotencyKey', () => {
    it('should find transaction by idempotency key', async () => {
      const mockTransaction = {
        id: 1,
        idempotency_key: 'test-key',
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockTransaction],
      });

      const result = await TransactionModel.findByIdempotencyKey('test-key');

      expect(result).toEqual(mockTransaction);
    });
  });
});
